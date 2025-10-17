// moduleManager.js
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import fs from 'fs-extra';
import AdmZip from 'adm-zip';
import getPort from 'get-port';
import { nanoid } from 'nanoid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const MODULES_DIR = path.join(ROOT_DIR, 'modules');
const REGISTRY_FILE = path.join(DATA_DIR, 'modules.json');

await fs.ensureDir(DATA_DIR);
await fs.ensureDir(UPLOADS_DIR);
await fs.ensureDir(MODULES_DIR);

const registry = await loadRegistry();

import http from 'node:http';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function slugify(s) {
    return String(s || '').toLowerCase().trim()
        .replace(/[^\w\-]+/g, '-').replace(/\-+/g, '-')
        .replace(/^-+|-+$/g, '') || `mod-${nanoid(6)}`;
}

async function loadRegistry() {
    try { return JSON.parse(await fs.readFile(REGISTRY_FILE, 'utf8')); }
    catch { return {}; }
}
async function saveRegistry() {
    await fs.writeFile(REGISTRY_FILE, JSON.stringify(registry, null, 2));
}

function interpolateArgs(args, env) {
    const e = env || {};
    return (args || []).map(a => a.replace?.(/\$\{(\w+)\}/g, (_, k) => e[k] ?? '') ?? a);
}

function detectDefaults(moduleDir) {
    // Heurísticas mínimas si no hay manifest
    const hasPkg = fs.existsSync(path.join(moduleDir, 'package.json'));
    const hasServerJs = fs.existsSync(path.join(moduleDir, 'server.js'));
    const hasMainGo = fs.existsSync(path.join(moduleDir, 'main.go'));
    const hasPublic = fs.existsSync(path.join(moduleDir, 'public'));
    const hasIndexPhp = fs.existsSync(path.join(moduleDir, 'index.php')) || fs.existsSync(path.join(moduleDir, 'public/index.php'));

    if (hasPkg || hasServerJs) {
        return { language: 'node', start: hasPkg ? 'npm' : 'node', args: hasPkg ? ['start'] : ['server.js'], cwd: '.', healthPath: '/health' };
    }
    if (hasMainGo) {
        return { language: 'go', start: 'go', args: ['run', 'main.go'], cwd: '.', healthPath: '/health' };
    }
    if (hasIndexPhp || hasPublic) {
        const docroot = hasPublic ? 'public' : '.';
        return { language: 'php', start: 'php', args: ['-S', '127.0.0.1:${PORT}', '-t', docroot], cwd: '.', healthPath: '/health' };
    }
    throw new Error('No se pudo detectar el tipo del módulo y no hay manifest.json');
}

async function readManifestOrDetect(moduleDir) {
    const manifestPath = path.join(moduleDir, 'manifest.json');
    if (await fs.pathExists(manifestPath)) {
        const m = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
        if (!m.language) throw new Error('manifest.json: falta "language"');
        return {
            name: m.name,
            slug: m.slug,
            language: m.language,
            start: m.start,
            args: m.args || [],
            cwd: m.cwd || '.',
            env: m.env || {},
            healthPath: m.healthPath || '/health'
        };
    }
    return detectDefaults(moduleDir);
}

function ensureRecord(slug) {
    registry[slug] = registry[slug] || {};
}

function normalizeDirName(base) {
    const s = slugify(base);
    return s || `mod-${nanoid(6)}`;
}

export async function installFromZip(zipFilePath) {
    const zip = new AdmZip(zipFilePath);
    const entries = zip.getEntries();
    const topName = entries[0]?.entryName.split('/')[0] || `mod-${nanoid(6)}`;

    const destDirName = normalizeDirName(topName);
    const destDir = path.join(MODULES_DIR, destDirName);
    await fs.ensureDir(destDir);

    zip.extractAllTo(destDir, true);

    // NUEVO: localizar la verdadera raíz del módulo (con o sin carpeta envolvente)
    const moduleRoot = await resolveModuleRoot(destDir);

    const manifest = await readManifestOrDetect(moduleRoot);
    const name = manifest.name || destDirName;
    const slug = slugify(manifest.slug || name);

    ensureRecord(slug);
    registry[slug] = {
        slug,
        name,
        dir: moduleRoot,        // OJO: apuntamos a la raíz real
        language: manifest.language,
        start: manifest.start,
        args: manifest.args,
        cwd: manifest.cwd,
        env: manifest.env,
        healthPath: manifest.healthPath,
        port: null,
        pid: null,
        status: 'installed',
        createdAt: Date.now()
    };
    await saveRegistry();
    return registry[slug];
}

// helpers
function checkHealthOnce(port, healthPath = '/health', timeoutMs = 1500){
  return new Promise(resolve => {
    const req = http.request(
      { host: '127.0.0.1', port, path: healthPath, method: 'GET', timeout: timeoutMs },
      res => { res.resume(); resolve(res.statusCode>=200 && res.statusCode<400); }
    );
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.on('error', () => resolve(false));
    req.end();
  });
}
async function waitForHealth(port, healthPath, totalMs = 15000, everyMs = 300){
  const end = Date.now()+totalMs;
  while(Date.now()<end){
    if(await checkHealthOnce(port, healthPath)) return true;
    await sleep(everyMs);
  }
  return false;
}

// lee el final de un archivo (para adjuntar en errores)
async function tailFile(filePath, maxBytes = 8000){
  try {
    const stat = await fs.stat(filePath);
    const start = Math.max(0, stat.size - maxBytes);
    const buf = await fs.readFile(filePath, {encoding:'utf8', start});
    return (start>0 ? '...tail...\n' : '') + buf;
  } catch { return ''; }
}

// Asegura buen comando/args/env/cwd (usa process.execPath para Node en Windows)
function buildSpawnSpec(mod, port) {
  const env = { ...process.env, PORT: String(port), ...mod.env };
  const args = (mod.args || []).map(a => a.replace?.(/\$\{(\w+)\}/g, (_, k) => env[k] ?? '') ?? a);
  let command = mod.start;

  if (mod.language === 'node' && command === 'node') {
    command = process.execPath; // usa el binario actual de Node
  }
  const cwd = path.join(mod.dir, mod.cwd || '.');
  return { command, args, cwd, env };
}

export async function startModule(slug){
  const mod = registry[slug];
  if(!mod) throw new Error('Módulo no encontrado');
  if(mod.status === 'running') return mod;

  // puerto dinámico (si usás modo puerto fijo, conservá tu lógica)
  const port = await getPort();
  const { command, args, cwd, env } = buildSpawnSpec(mod, port);

  // valida que exista el entrypoint
  if (mod.language === 'node') {
    const entry = path.join(cwd, args.find(a => a.endsWith('.js')) || '');
    if (entry && !(await fs.pathExists(entry))) {
      throw new Error(`Entrypoint no existe: ${entry} (revisá "cwd" y "args" en manifest.json)`);
    }
  }

  const logDir = path.join(mod.dir, '.logs');
  await fs.ensureDir(logDir);
  const outFile = path.join(logDir, 'out.log');
  const errFile = path.join(logDir, 'err.log');
  const outStream = fs.createWriteStream(outFile, { flags: 'a' });
  const errStream = fs.createWriteStream(errFile, { flags: 'a' });

  // Capturamos buffers en memoria para mensajes de error
  let outBuf = '', errBuf = '';
  const cap = (buf, chunk) => {
    buf += chunk.toString();
    if (buf.length > 8000) buf = buf.slice(-8000);
    return buf;
  };

  const useShell = process.platform === 'win32' && !command.includes(path.sep);
  let spawnErr = null, exited = false, exitCode = null, exitSignal = null;

  const child = spawn(command, args, { cwd, env, stdio: ['ignore','pipe','pipe'], shell: useShell });
  child.stdout.on('data', d => { outStream.write(d); outBuf = cap(outBuf, d); });
  child.stderr.on('data', d => { errStream.write(d); errBuf = cap(errBuf, d); });
  child.on('error', e => { spawnErr = e; });
  child.once('exit', (code, signal) => { exited = true; exitCode = code; exitSignal = signal; });

  mod.port = port;
  mod.pid = child.pid || null;
  mod.status = 'starting';
  await saveRegistry();

  const healthy = await waitForHealth(port, mod.healthPath || '/health', 15000, 300);

  if (spawnErr || !healthy || exited) {
    try { if (child.pid) process.kill(child.pid, 'SIGTERM'); } catch {}
    mod.status = 'stopped';
    mod.pid = null;
    await saveRegistry();

    // tail de logs a mensaje (para entender por qué no llegó al console.log)
    const tailOut = outBuf || await tailFile(outFile);
    const tailErr = errBuf || await tailFile(errFile);

    const detail = [
      spawnErr ? `spawn error: ${spawnErr.message}` : null,
      exited ? `exit code=${exitCode} signal=${exitSignal}` : null,
      `HEALTH: http://127.0.0.1:${port}${mod.healthPath || '/health'} → ${healthy ? 'OK' : 'FAIL'}`,
      tailErr ? `--- STDERR (tail) ---\n${tailErr}` : null,
      tailOut ? `--- STDOUT (tail) ---\n${tailOut}` : null,
    ].filter(Boolean).join('\n');

    throw new Error(`No se pudo iniciar el módulo "${slug}".\n${detail}`);
  }

  mod.status = 'running';
  await saveRegistry();
  return mod;
}


export async function stopModule(slug) {
    const mod = registry[slug];
    if (!mod) throw new Error('Módulo no encontrado');
    if (mod.status !== 'running' || !mod.pid) return mod;
    try {
        process.kill(mod.pid);
    } catch { }
    mod.status = 'stopped';
    mod.pid = null;
    await saveRegistry();
    return mod;
}

export async function uninstallModule(slug) {
    const mod = registry[slug];
    if (!mod) throw new Error('Módulo no encontrado');
    if (mod.pid) await stopModule(slug);
    // Borrar carpeta
    await fs.remove(mod.dir);
    delete registry[slug];
    await saveRegistry();
    return true;
}

export function listModules() {
    return Object.values(registry).sort((a, b) => a.slug.localeCompare(b.slug));
}

export function getRegistry() { return registry; }

// Busca 'manifest.json' descendiendo si hay una única carpeta a nivel superior.
// Si no lo encuentra, devuelve la propia carpeta.
async function resolveModuleRoot(extractedDir) {
    // ¿Está en la raíz?
    if (await fs.pathExists(path.join(extractedDir, 'manifest.json'))) {
        return extractedDir;
    }

    const entries = await fs.readdir(extractedDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory());
    const files = entries.filter(e => e.isFile());

    // Caso típico: un solo directorio y ningún archivo -> bajar un nivel
    if (files.length === 0 && dirs.length === 1) {
        const sub = path.join(extractedDir, dirs[0].name);
        if (await fs.pathExists(path.join(sub, 'manifest.json'))) return sub;

        // Intento extra: un nivel más profundo si también sólo hay una carpeta
        const subEntries = await fs.readdir(sub, { withFileTypes: true });
        const subDirs = subEntries.filter(e => e.isDirectory());
        const subFiles = subEntries.filter(e => e.isFile());
        if (subFiles.length === 0 && subDirs.length === 1) {
            const sub2 = path.join(sub, subDirs[0].name);
            if (await fs.pathExists(path.join(sub2, 'manifest.json'))) return sub2;
        }
    }

    // Último intento: búsqueda superficial
    for (const d of dirs) {
        const candidate = path.join(extractedDir, d.name);
        if (await fs.pathExists(path.join(candidate, 'manifest.json'))) return candidate;
    }

    // Por defecto, devolvé la carpeta tal cual (para heurísticas)
    return extractedDir;
}


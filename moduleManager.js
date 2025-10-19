/**
 * ⚠️⚠️⚠️ ADVERTENCIA ⚠️⚠️⚠️
 * ============================================================
 *  ESTE ARCHIVO CONTROLA TODO EL SISTEMA DE CONTENEDOR DE MÓDULOS.
 * 
 *  !⚠️ NO MODIFICAR NINGUNA LÍNEA A MENOS QUE SEPAS EXACTAMENTE QUÉ ESTÁS HACIENDO ⚠️
 * 
 *  CUALQUIER CAMBIO EN ESTE ARCHIVO PUEDE:
 *    - BLOQUEAR PROCESOS O PUERTOS
 *    - CORROMPER EL REGISTRO DE MÓDULOS
 *    - IMPEDIR LA INSTALACIÓN O DESINSTALACIÓN
 *    - HACER QUE EL CONTENEDOR NO VUELVA A INICIAR
 * 
 *  ESTE ARCHIVO ES FUNDAMENTAL PARA EL FUNCIONAMIENTO DE:
 *    - Instalación de módulos ZIP
 *    - Ejecución y supervisión de procesos Node/Go/PHP/Python/ETC
 *    - Registro persistente (modules.json)
 *    - Reinicio automático tras caída o reboot
 *    - Liberación segura de recursos (Windows/Linux)
 * 
 *  🔒 EN RESUMEN:
 *  !>>> NO TOCAR ESTE ARCHIVO <<< 
 * 
 * ============================================================
 */

// ============================================================
// IMPORTACIONES Y CONFIGURACIÓN BASE
// ============================================================
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, exec } from 'node:child_process';
import { once } from 'node:events';
import fs from 'fs-extra';
import AdmZip from 'adm-zip';
import getPort from 'get-port';
import { nanoid } from 'nanoid';
import http from 'node:http';
import { EventEmitter } from 'node:events';

// ============================================================
// DIRECTORIOS Y RUTAS PRINCIPALES
// ============================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const MODULES_DIR = path.join(ROOT_DIR, 'modules');
const REGISTRY_FILE = path.join(DATA_DIR, 'modules.json');

// Crear carpetas base si no existen
await fs.ensureDir(DATA_DIR);
await fs.ensureDir(MODULES_DIR);

// ============================================================
// REGISTRO DE MÓDULOS
// ============================================================
const registry = await loadRegistry();
const registryLength = Object.keys(registry).length;

// Al reiniciar el contenedor, reintenta iniciar los módulos activos
if (registry && registryLength > 0) {
  for (let i = 0; i < registryLength; i++) {
    const m = registry[Object.keys(registry)[i]];
    try {
      await fetch(`http://localhost:${m.port}`, { method: 'HEAD', timeout: 1500 });
    } catch {
      await startModule(m.slug);
    }
  }
}

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================
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

function detectDefaults(moduleDir) {
  const hasPkg = fs.existsSync(path.join(moduleDir, 'package.json'));
  const hasServerJs = fs.existsSync(path.join(moduleDir, 'server.js'));
  const hasMainGo = fs.existsSync(path.join(moduleDir, 'main.go'));
  const hasPublic = fs.existsSync(path.join(moduleDir, 'public'));
  const hasIndexPhp = fs.existsSync(path.join(moduleDir, 'index.php')) || fs.existsSync(path.join(moduleDir, 'public/index.php'));

  if (hasPkg || hasServerJs)
    return { language: 'node', start: hasPkg ? 'npm' : 'node', args: hasPkg ? ['start'] : ['server.js'], cwd: '.', healthPath: '/health' };

  if (hasMainGo)
    return { language: 'go', start: 'go', args: ['run', 'main.go'], cwd: '.', healthPath: '/health' };

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
    return { name: m.name, slug: m.slug, language: m.language, start: m.start, args: m.args || [], cwd: m.cwd || '.', env: m.env || {}, healthPath: m.healthPath || '/health' };
  }
  return detectDefaults(moduleDir);
}

function ensureRecord(slug) {
  registry[slug] = registry[slug] || {};
}

// ============================================================
// INSTALACIÓN DE MÓDULOS DESDE ZIP
// ============================================================
export async function installFromZip(zipFilePath, { customName, description } = {}) {
  const zip = new AdmZip(zipFilePath);
  const entries = zip.getEntries();
  const topName = entries[0]?.entryName.split('/')[0] || `mod-${nanoid(6)}`;
  const destDir = path.join(MODULES_DIR, slugify(topName));

  await fs.ensureDir(destDir);
  zip.extractAllTo(destDir, true);

  const moduleRoot = await resolveModuleRoot(destDir);
  const manifest = await readManifestOrDetect(moduleRoot);
  const slug = slugify(manifest.slug || manifest.name || topName);

  ensureRecord(slug);
  registry[slug] = {
    slug,
    name: manifest.name || slug,
    dir: moduleRoot,
    language: manifest.language,
    start: manifest.start,
    args: manifest.args,
    cwd: manifest.cwd,
    env: manifest.env,
    healthPath: manifest.healthPath,
    port: null,
    pid: null,
    status: 'installed',
    description: description,
    customName,
    createdAt: Date.now(),
  };
  await saveRegistry();
  return registry[slug];
}

// ============================================================
// INICIO DE MÓDULOS
// ============================================================
export async function startModule(slug) {
  const mod = registry[slug];
  if (!mod) throw new Error('Módulo no encontrado');

  const port = await getPort();
  const env = { ...process.env, PORT: String(port), ...mod.env };
  const args = (mod.args || []).map(a => a.replace?.(/\$\{(\w+)\}/g, (_, k) => env[k] ?? '') ?? a);
  const cwd = path.join(mod.dir, mod.cwd || '.');
  const command = mod.start === 'node' ? process.execPath : mod.start;

  // Validar entrypoint
  if (mod.language === 'node') {
    const entry = path.join(cwd, args.find(a => a.endsWith('.js')) || '');
    if (entry && !(await fs.pathExists(entry))) {
      throw new Error(`Entrypoint no existe: ${entry}`);
    }
  }

  // Crear logs
  const logDir = path.join(mod.dir, '.logs');
  await fs.ensureDir(logDir);
  const outStream = fs.createWriteStream(path.join(logDir, 'out.log'), { flags: 'a' });
  const errStream = fs.createWriteStream(path.join(logDir, 'err.log'), { flags: 'a' });

  const useShell = process.platform === 'win32' && !command.includes(path.sep);
  const child = spawn(command, args, { cwd, env, shell: useShell });
  child.unref();

  child.stdout.pipe(outStream);
  child.stderr.pipe(errStream);
  child.stdin.on('end', () => {
    child.kill();
  });

  mod.port = port;
  mod.pid = child.pid;
  mod.status = 'running';
  mod.child = child;
  mod.outStream = outStream;
  mod.errStream = errStream;

  await saveRegistry();
  return mod;
}

// ============================================================
// DETENCIÓN DE MÓDULOS
// ============================================================
const isWin = process.platform === 'win32';

async function killProcessTree(pid) {
  if (!pid) return;
  if (isWin) {
    await new Promise(res => {
      const killer = spawn('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true });
      killer.on('close', () => res());
      killer.on('error', () => res());
    });
  } else {
    try { process.kill(pid, 'SIGTERM'); } catch { }
    await sleep(400);
    try { process.kill(pid, 'SIGKILL'); } catch { }
  }
}

async function closeStreamSafe(stream) {
  if (!stream) return;
  try {
    stream.removeAllListeners?.();
    stream.unpipe?.();
    if (stream.end && !stream.writableEnded) await new Promise(r => stream.end(r));
    if (stream.destroy && !stream.destroyed) stream.destroy();
    if (typeof stream.close === 'function') try { stream.close(); } catch { }
  } catch { }
}

async function waitChildClosed(child, timeoutMs = 2500) {
  if (
    !child ||
    !(child instanceof EventEmitter) ||
    typeof child.once !== 'function' ||
    typeof child.removeListener !== 'function'
  ) {
    await new Promise(r => setTimeout(r, Math.min(timeoutMs, 100)));
    return;
  }

  await new Promise(resolve => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(t);
      try { child.removeListener('close', finish); } catch { }
      try { child.removeListener('exit', finish); } catch { }
      resolve();
    };

    const t = setTimeout(finish, timeoutMs);
    try { child.once('close', finish); } catch { }
    try { child.once('exit', finish); } catch { }
  });
}

async function rmrfRetry(dir, attempts = 5, delayMs = 300) {
  if (!dir) return;
  for (let i = 0; i < attempts; i++) {
    try { await fs.remove(dir); return; }
    catch (e) {
      if (e.code === 'EBUSY' || e.code === 'EPERM') await sleep(delayMs + i * 200);
      else throw e;
    }
  }
  await fs.remove(dir);
}

export async function stopModule(slug, { deleteDir = false } = {}) {
  const mod = registry[slug];
  if (!mod) throw new Error('Módulo no encontrado');
  if (mod.status !== 'running' && mod.status !== 'starting') return mod;

  const child = mod.child;
  const pid = child?.pid;

  try {
    try { child?.stdin?.write?.('exit\n'); } catch { }
    try { child?.stdin?.end?.(); } catch { }

    // Cerrar/desconectar stdio y logs
    await closeStreamSafe(child?.stdin);
    await closeStreamSafe(child?.stdout);
    await closeStreamSafe(child?.stderr);
    await closeStreamSafe(mod.outStream);
    await closeStreamSafe(mod.errStream);

    // kill del arbol de procesos
    await waitChildClosed(child, 700);

    if (child && child.pid && !child.killed) {
      await killProcessTree(child.pid);  
    }

    await waitChildClosed(child, 1500);
  } catch (e) {
    console.log('No se pudo matar el proceso:', e?.message || e);
  } finally {
    try {
      if (child && child instanceof EventEmitter) child.removeAllListeners?.();
    } catch { }

    mod.child = null;
    mod.pid = null;
    mod.outStream = null;
    mod.errStream = null;

    mod.status = 'stopped';
    await saveRegistry();
  }

  if (deleteDir && mod.dir) {
    try {
      await rmrfRetry(mod.dir);
    } catch (e) {
      console.error('No se pudo eliminar:', e);
    }
  }

  return mod;
}

// ============================================================
// DESINSTALACIÓN DE MÓDULOS
// ============================================================
export async function uninstallModule(slug) {
  const mod = registry[slug];
  if (!mod) throw new Error('Módulo no encontrado');
  if (mod.pid) await stopModule(slug);
  await fs.remove(mod.dir);
  delete registry[slug];
  await saveRegistry();
  return true;
}

// ============================================================
// UTILIDADES
// ============================================================
export function listModules() {
  return Object.values(registry).sort((a, b) => a.slug.localeCompare(b.slug));
}

export function getRegistry() { return registry; }

// ============================================================
// DETECCIÓN DE RAÍZ DE MÓDULO (ZIP)
// ============================================================
async function resolveModuleRoot(extractedDir) {
  if (await fs.pathExists(path.join(extractedDir, 'manifest.json'))) return extractedDir;
  const entries = await fs.readdir(extractedDir, { withFileTypes: true });
  const dirs = entries.filter(e => e.isDirectory());
  const files = entries.filter(e => e.isFile());

  if (files.length === 0 && dirs.length === 1) {
    const sub = path.join(extractedDir, dirs[0].name);
    if (await fs.pathExists(path.join(sub, 'manifest.json'))) return sub;
  }

  for (const d of dirs) {
    const candidate = path.join(extractedDir, d.name);
    if (await fs.pathExists(path.join(candidate, 'manifest.json'))) return candidate;
  }

  return extractedDir;
}

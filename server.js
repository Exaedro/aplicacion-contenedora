// server.js (CONTENEDOR)
import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'fs-extra';
import { createProxyMiddleware } from 'http-proxy-middleware';
import {
    installFromZip, startModule, stopModule, uninstallModule,
    listModules, getRegistry
} from './moduleManager.js';
import fsp from 'node:fs/promises';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'ui'));

app.use(express.json());

const upload = multer({ dest: path.join(process.cwd(), 'uploads') });

// ---------- API ----------
app.post('/api/modules/install', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Falta archivo ZIP (campo "file")' });
        const installed = await installFromZip(req.file.path);
        const started = await startModule(installed.slug);
        return res.json({ ok: true, module: started });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    } finally {
        if (req.file) await fs.remove(req.file.path).catch(() => { });
    }
});

app.get('/api/modules', (req, res) => {
    res.json({ modules: listModules() });
});

app.post('/api/modules/:slug/start', async (req, res) => {
    try {
        const started = await startModule(req.params.slug);
        return res.json({ ok: true, module: started });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

app.post('/api/modules/:slug/stop', async (req, res) => {
    try {
        const mod = await stopModule(req.params.slug);
        res.json({ ok: true, module: mod });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

async function removeDirWithRetries(dir, tries = 6, delayMs = 200) {
    for (let i = 0; i < tries; i++) {
        try {
            await fsp.rm(dir, { recursive: true, force: true });
            return;
        } catch (err) {
            // En Windows a veces llegan EPERM/EBUSY/ENOTEMPTY por locks transitorios
            if ((err.code === 'EBUSY' || err.code === 'EPERM' || err.code === 'ENOTEMPTY') && i < tries - 1) {
                await sleep(delayMs * (i + 1)); // backoff suave
                continue;
            }
            throw err;
        }
    }
    throw new Error('No se pudo eliminar el directorio (lock persistente)');
}


app.delete('/api/modules/:slug', async (req, res) => {
    const { slug } = req.params;
    try {
        const reg = getRegistry()[slug];
        if (!reg) return res.status(404).json({ error: 'Módulo no existe' });

        // 1) Si está corriendo, frenalo primero (cierra logs/handles)
        try { await stopModule(slug); } catch { /* ignoramos si ya estaba parado */ }

        // 2) Pequeña espera para que Windows suelte locks de archivos
        await sleep(150);

        // 3) Borrado robusto del directorio del módulo
        await removeDirWithRetries(reg.dir);

        // 4) Limpieza de registro
        // Si tu uninstallModule() hace otras limpiezas (puertos, índices, etc),
        // podés llamarlo pero ignorar error ENOENT si ya borramos la carpeta.
        try {
            await uninstallModule(slug);
        } catch (e) {
            if (e.code !== 'ENOENT') {
                // si tu uninstallModule falla por otra cosa, devolvelo como 500
                throw e;
            }
            // ENOENT es normal si ya no existe el dir
            // de todos modos quitamos del registry por si no lo hizo
            const regAll = getRegistry();
            if (regAll && regAll[slug]) delete regAll[slug];
        }

        return res.json({ ok: true });
    } catch (e) {
        return res.status(500).json({ error: e.message || String(e) });
    }
});

app.get('/api/modules/:slug/logs', async (req, res) => {
    const { slug } = req.params;
    const type = req.query.type === 'err' ? 'err' : 'out';
    const reg = getRegistry()[slug];
    if (!reg) return res.status(404).send('Módulo no existe');
    const file = path.join(reg.dir, '.logs', type === 'err' ? 'err.log' : 'out.log');
    if (!await fs.pathExists(file)) return res.type('text/plain').send('');
    const data = await fs.readFile(file, 'utf8');
    res.type('text/plain').send(data.slice(-8000));
});

// ---------- Utils ----------
function getSlugFromReq(req) {
    if (req.params && req.params.slug) return req.params.slug;
    const m = req.originalUrl.match(/^\/modulos\/([^\/\?\#]+)/);
    return m ? m[1] : null;
}

// ---------- RESCATE: si falta slug, infiere por Referer y redirige ----------
app.use('/modulos', (req, res, next) => {
    // path: lo que sigue a /modulos
    const segs = (req.path || '/').split('/').filter(Boolean);
    if (segs.length === 0) return next(); // /modulos -> nada que hacer

    const first = segs[0];                    // candidato a slug
    const reg = getRegistry();
    if (reg[first]) return next();            // es un slug válido → sigue al proxy

    // No es un slug válido: intentamos deducir desde el Referer
    const ref = req.get('referer') || req.get('referrer') || '';
    const m = ref.match(/\/modulos\/([^\/\?#]+)/);
    const refSlug = m && m[1];
    if (refSlug && reg[refSlug]) {
        // reconstruimos la URL con el slug correcto y preservamos querystring
        const q = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
        const subpath = req.path.replace(/^\/+/, ''); // ej: 'css/estilo_login.css'
        return res.redirect(302, `/modulos/${refSlug}/${subpath}${q}`);
    }

    // Sin forma de adivinar → mensaje claro
    return res.status(404).type('text/plain')
        .send('Falta slug en la URL. Usa /modulos/<slug>/…');
});

app.use((req, res, next) => {
    // ignorar cosas que son del host, no de módulos
    if (req.path.startsWith('/api/')) return next();
    if (req.path.startsWith('/modulos/')) return next(); // ya tiene prefijo correcto
    if (req.method === 'GET' && req.path === '/') return next(); // home del host

    // intentar deducir el slug desde el Referer
    const ref = req.get('referer') || req.get('referrer') || '';
    const m = ref.match(/\/modulos\/([^\/\?#]+)/);
    const refSlug = m && m[1];
    if (refSlug && getRegistry()[refSlug]) {
        // 307 mantiene método y BODY (sirve para formularios POST, fetch, etc.)
        const target = `/modulos/${refSlug}${req.originalUrl.startsWith('/') ? '' : '/'}${req.originalUrl}`;
        return res.redirect(307, target);
    }

    // si no podemos adivinar, seguí normal (probablemente 404 del host)
    return next();
});

// ---------- PROXY /modulos/<slug>/... ----------
app.use(
    '/modulos/:slug',
    // Guard-rail y target
    (req, res, next) => {
        const slug = getSlugFromReq(req);
        const reg = slug && getRegistry()[slug];
        if (!reg) return res.status(404).send(`Módulo "${slug ?? 'desconocido'}" no existe`);
        if (reg.status !== 'running' || !reg.port) {
            return res.status(503).send(`Módulo "${slug}" no está corriendo`);
        }
        req._target = `http://127.0.0.1:${reg.port}`;
        next();
    },
    createProxyMiddleware({
        target: 'http://127.0.0.1:65535', // dummy
        changeOrigin: true,
        ws: true,
        logLevel: 'warn',

        router: (req) => req._target,

        // Quitamos /modulos/<slug> del path hacia el backend
        pathRewrite: (path) => {
            const rewritten = path.replace(/^\/modulos\/[^/]+/, '');
            return rewritten === '' ? '/' : rewritten;
        },

        // Pasamos al backend el prefijo público real (útil para <base>)
        onProxyReq: (proxyReq, req) => {
            const slug = (req.params && req.params.slug) ||
                (req.originalUrl.match(/^\/modulos\/([^\/\?#]+)/) || [])[1];
            if (slug) proxyReq.setHeader('X-Forwarded-Prefix', `/modulos/${slug}/`);
        },

        onError: (err, req, res) => {
            res.status(502).type('text/plain')
                .send(`Proxy falló hacia ${req._target || '(sin target)'}: ${err.code || err.message}`);
        }
    })
);

const uiDir = path.join(process.cwd(), 'ui');
app.use(express.static(process.cwd() + '/ui/public'));

// ---------- raíz ----------
app.get('/', async (req, res) => {
    const modules = listModules();
    console.log(modules)

    res.render('index.ejs', { modules });
    //     res.type('html').send(`
    //     <h1>Contenedor de módulos</h1>
    //     <p>Subí un ZIP con un módulo y accedé en <code>/modulos/&lt;slug&gt;</code>.</p>
    //     <p>API:</p>
    //     <ul>
    //       <li>POST /api/modules/install  (multipart field: <b>file</b>)</li>
    //       <li>GET  /api/modules</li>
    //       <li>POST /api/modules/:slug/start</li>
    //       <li>POST /api/modules/:slug/stop</li>
    //       <li>DELETE /api/modules/:slug</li>
    //     </ul>
    //   `);
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Contenedor escuchando en http://localhost:${PORT}`));

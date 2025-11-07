// server.js (panic edition)
import 'dotenv/config';

import express from 'express';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import cookieParser from 'cookie-parser';
import { createProxyMiddleware } from 'http-proxy-middleware';

// Local utils (seguimos asumiendo que existen)
import { listModules, getRegistry } from './moduleManager.js';
import { testConnection, sequelize } from './db/index.js';
import { getSlugFromReq } from './utils/getSlugFromReq.js';
import { authPageRequired, authRequired } from './middlewares/authMiddleware.js';

// ---------- RUTAS/Servicios (se importarán dinámicamente más abajo) ----------
// import authRouter from './routes/auth.js';
// import modulesRouter from './routes/modules.js';
// import usersRouter from './routes/users.js';
import { buildModuleListForUser } from './services/modulesWithPrefs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const BOOT = {
  startedAt: new Date().toISOString(),
  db: { ok: false, error: null, synced: false },
  routers: { auth: false, modules: false, users: false },
  uiPaths: null
};

// ---------- CONFIG BÁSICA ----------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'ui'));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'ui', 'public')));

// Guarda info de rutas para diagnóstico
BOOT.uiPaths = {
  views: path.join(__dirname, 'ui'),
  public: path.join(__dirname, 'ui', 'public')
};

// ---------- HEALTH & DIAG ----------
app.get('/health', (_req, res) => res.status(200).json({ ok: true, t: Date.now() }));
app.get('/__diag', (_req, res) => res.status(200).json(BOOT));

// ---------- HOME ----------
app.get('/', authPageRequired, async (req, res, next) => {
  try {
    const user = req?.user || { uid: 'anon' };
    const modules = await buildModuleListForUser(user.uid);

    const favorites = modules.filter(m => m._pref?.estado === 'favorito');
    const hidden    = modules.filter(m => m._pref?.estado === 'escondido');
    const others    = modules.filter(m => m._pref?.estado !== 'favorito' && m._pref?.estado !== 'escondido');
    const sidebarModules = modules;

    res.render('index.ejs', {
      favorites,
      modules: others,
      all: modules,
      hidden,
      user,
      sidebarModules,
      title: 'Aplicación Contenedora'
    });
  } catch (err) {
    next(err);
  }
});

// ---------- PÁGINAS BÁSICAS ----------
app.get('/auth', (_req, res) => {
  res.render('auth', { title: 'Autenticación' });
});

app.get('/profile', authRequired, (req, res) => {
  res.render('profile', { title: 'Perfil', user: req.user });
});

app.get('/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

// ---------- RESCATE: si falta slug, infiere por Referer y redirige ----------
app.use('/modulos', (req, res, next) => {
  const segs = (req.path || '/').split('/').filter(Boolean);
  if (segs.length === 0) return next(); // /modulos -> nada que hacer

  const first = segs[0];
  const reg = getRegistry();
  if (reg[first]) return next(); // slug válido

  const ref = req.get('referer') || req.get('referrer') || '';
  const m = ref.match(/\/modulos\/([^\/\?#]+)/);
  const refSlug = m && m[1];
  if (refSlug && reg[refSlug]) {
    const q = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    const subpath = req.path.replace(/^\/+/, '');
    return res.redirect(302, `/modulos/${refSlug}/${subpath}${q}`);
  }

  return res.status(404).type('text/plain')
    .send('Falta slug en la URL. Usa /modulos/<slug>/…');
});

// ---------- DEDUCCIÓN DE SLUG PARA RUTAS NO HOST ----------
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  if (req.path.startsWith('/modulos/')) return next();
  if (req.method === 'GET' && req.path === '/') return next();

  const ref = req.get('referer') || req.get('referrer') || '';
  const m = ref.match(/\/modulos\/([^\/\?#]+)/);
  const refSlug = m && m[1];
  if (refSlug && getRegistry()[refSlug]) {
    const target = `/modulos/${refSlug}${req.originalUrl.startsWith('/') ? '' : '/'}${req.originalUrl}`;
    return res.redirect(307, target);
  }
  return next();
});

// ---------- PROXY /modulos/<slug>/... ----------
app.use(
  '/modulos/:slug',
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
    pathRewrite: (pathStr) => {
      const rewritten = pathStr.replace(/^\/modulos\/[^/]+/, '');
      return rewritten === '' ? '/' : rewritten;
    },
    onProxyReq: (proxyReq, req) => {
      const slug =
        (req.params && req.params.slug) ||
        (req.originalUrl.match(/^\/modulos\/([^\/\?#]+)/) || [])[1];
      if (slug) proxyReq.setHeader('X-Forwarded-Prefix', `/modulos/${slug}/`);
    },
    onError: (err, req, res) => {
      res
        .status(502)
        .type('text/plain')
        .send(`Proxy falló hacia ${req._target || '(sin target)'}: ${err.code || err.message}`);
    }
  })
);

// ---------- MANEJO DE ERRORES ----------
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err);
  const status = err.status || 500;
  // Evitar romper si falta views/error.ejs
  try {
    res.status(status).render('error', {
      title: 'Error',
      status,
      message: err.message || 'Error interno'
    });
  } catch {
    res.status(status).type('text/plain').send(`Error ${status}: ${err.message || 'interno'}`);
  }
});

// ---------- ARRANQUE CON REINTENTOS DE PUERTO ----------
async function startServerWithRetry(basePort = Number(process.env.PORT) || 3000, attempts = 10) {
  return new Promise((resolve, reject) => {
    let port = basePort;
    let server;

    const tryListen = () => {
      server = app.listen(port)
        .once('listening', () => {
          console.log(`Contenedor escuchando en http://localhost:${port}`);
          resolve({ server, port });
        })
        .once('error', (err) => {
          if (err.code === 'EADDRINUSE' && attempts > 0) {
            console.warn(`[BOOT] Puerto ${port} en uso. Probando ${port + 1}...`);
            port += 1;
            attempts -= 1;
            setTimeout(tryListen, 100);
          } else {
            reject(err);
          }
        });
    };

    tryListen();
  });
}

// ---------- BOOT DB OPCIONAL + IMPORTS DINÁMICOS ----------
async function initDbIfPossible() {
  try {
    console.log('[BOOT] Probando conexión a la DB…');
    await testConnection();
    BOOT.db.ok = true;
    console.log('[BOOT] DB OK. Sincronizando modelos…');
    await sequelize.sync({ alter: true });
    BOOT.db.synced = true;
    console.log('[BOOT] Modelos sincronizados.');
  } catch (err) {
    BOOT.db.error = err?.message || String(err);
    console.error('[BOOT] Falló la DB (el server sigue igual):', BOOT.db.error);
  }
}

async function initRoutersDynamically() {
  // Import dinámico para no tumbar el proceso si algo rompe
  try {
    const { default: authRouter } = await import('./routes/auth.js');
    app.use('/api/auth', authRouter);
    BOOT.routers.auth = true;
  } catch (e) {
    console.error('[BOOT] No se pudo cargar /api/auth:', e?.message || e);
  }

  try {
    const { default: modulesRouter } = await import('./routes/modules.js');
    app.use('/api/modules', modulesRouter);
    BOOT.routers.modules = true;
  } catch (e) {
    console.error('[BOOT] No se pudo cargar /api/modules:', e?.message || e);
  }

  try {
    const { default: usersRouter } = await import('./routes/users.js');
    app.use('/api/users', usersRouter);
    BOOT.routers.users = true;
  } catch (e) {
    console.error('[BOOT] No se pudo cargar /api/users:', e?.message || e);
  }

  try {
    const svc = await import('./services/modulesWithPrefs.js');
    if (typeof svc.buildModuleListForUser === 'function') {
      buildModuleListForUser = svc.buildModuleListForUser;
    }
  } catch (e) {
    console.error('[BOOT] No se pudo cargar services/modulesWithPrefs:', e?.message || e);
  }
}

// ---------- MAIN ----------
async function main() {
  console.log('[BOOT] Iniciando…');
  await startServerWithRetry();       // 1) arranca sí o sí
  initDbIfPossible();                 // 2) DB en paralelo (no bloquea)
  initRoutersDynamically();           // 3) routers dinámicos (no tumban)
  console.log('[BOOT] Listo. Revisá /__diag para estado.');
}

// Guardias globales
process.on('unhandledRejection', (e) => {
  console.error('[UNHANDLED REJECTION]', e);
});
process.on('uncaughtException', (e) => {
  console.error('[UNCAUGHT EXCEPTION]', e);
});

// Disparo
main().catch((e) => {
  console.error('[BOOT FATAL]', e);
  process.exit(1);
});

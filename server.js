import 'dotenv/config';

import express from 'express';
import path from 'node:path';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { listModules, getRegistry } from './moduleManager.js';
import { testConnection, sequelize } from './db/index.js';
import cookieParser from 'cookie-parser';
import { getSlugFromReq } from './utils/getSlugFromReq.js';
import { authPageRequired, authRequired } from './middlewares/authMiddleware.js';

// ---------- RUTAS ----------
import authRouter from './routes/auth.js';
import modulesRouter from './routes/modules.js';
import usersRouter from './routes/users.js';

// ---------- PUERTO DEL SERVIDOR ----------
const PORT = process.env.PORT || 3000;

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'ui'));

app.use(express.json());
app.use(cookieParser());

app.use(express.static(process.cwd() + '/ui/public'));

// ---------- raíz ----------
app.get('/', authPageRequired, async (req, res) => {
    const modules = listModules();
    const user = req.user;
    
    res.render('index.ejs', { modules, user, title: 'Aplicación Contenedora' });
});

// ---------- AUTENTIFICACION ----------
app.get('/auth', (req, res) => {
    res.render('auth', { title: 'Autenticación' });
});

app.get('/profile', (req, res) => {
    res.render('profile', { title: 'Perfil' });
});

app.get('/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});

// ---------- TESTEO DE CONEXION A LA BASE DE DATOS ----------
await testConnection();
await sequelize.sync({ alter: true });

// ---------- INICIO DEL SERVIDOR ----------
app.listen(PORT, () => console.log(`Contenedor escuchando en http://localhost:${PORT}`));

// ---------- API ----------
app.use('/api/auth', authRouter);
app.use('/api/modules', modulesRouter);
app.use('/api/users', usersRouter);

// ---------- RESCATE: si falta slug, infiere por Referer y redirige ----------
app.use('/modulos', (req, res, next) => {
    // path: lo que sigue a /modulos
    const segs = (req.path || '/').split('/').filter(Boolean);
    if (segs.length === 0) return next(); // /modulos -> nada que hacer

    const first = segs[0];                 
    const reg = getRegistry();
    if (reg[first]) return next();            // es un slug válido → sigue al proxy

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

app.use((req, res, next) => {
    // ignorar cosas que son del host, no de módulos
    if (req.path.startsWith('/api/')) return next();
    if (req.path.startsWith('/modulos/')) return next(); 
    if (req.method === 'GET' && req.path === '/') return next(); // home del host

    // intentar deducir el slug desde el Referer
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
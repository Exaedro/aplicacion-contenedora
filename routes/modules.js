import multer from "multer";
import path from "node:path";
import { installFromZip, startModule, stopModule, uninstallModule, listModules, getRegistry } from "../moduleManager.js";
import removeDirWithRetries from "../utils/removeDirWithRetries.js";
import fs from "fs-extra";
import { sleep } from "../utils/sleep.js";

import { Router } from "express";
const router = Router();

const upload = multer({ dest: path.join(process.cwd(), 'uploads') });

router.get('/', (req, res) => {
    res.json({ modules: listModules() });
});

router.get('/:slug/exists', async (req, res) => {
    const { slug } = req.params;
    try {
        const reg = getRegistry()[slug];
        if (!reg) return res.status(404).json({ error: 'Módulo no existe' });
        return res.json({ ok: true });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

router.post('/install', upload.single('file'), async (req, res) => {
    const { moduleName, moduleDescription } = req.body;

    try {
        if (!req.file) return res.status(400).json({ error: 'Falta archivo ZIP (campo "file")' });
        const installed = await installFromZip(req.file.path, { customName: moduleName, description: moduleDescription });
        const started = await startModule(installed.slug);
        return res.json({ ok: true, module: started });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    } finally {
        if (req.file) await fs.remove(req.file.path).catch(() => { });
    }
});

router.post('/:slug/start', async (req, res) => {
    try {
        const started = await startModule(req.params.slug);
        return res.json({ ok: true, module: started });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

router.post('/:slug/stop', async (req, res) => {
    try {
        const mod = await stopModule(req.params.slug);
        res.json({ ok: true, module: mod });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.delete('/:slug', async (req, res) => {
    const { slug } = req.params;
    try {
        const reg = getRegistry()[slug];
        if (!reg) return res.status(404).json({ error: 'Módulo no existe' });

        // 1) Si está corriendo, frenalo primero (cierra logs/handles)
        try { await stopModule(slug); } catch { /* ignoramos si ya estaba parado */ }

        // 2) Pequeña espera para que Windows suelte locks de archivos
        await sleep(500);
    
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
                console.error('uninstallModule falló:', e);
                throw e;
            }
            
            // ENOENT es normal si ya no existe el dir
            // de todos modos quitamos del registry por si no lo hizo
            const regAll = getRegistry();
            if (regAll && regAll[slug]) delete regAll[slug];
        }

        return res.json({ ok: true });
    } catch (e) {
        console.log(e)
        return res.status(500).json({ error: e.message || String(e) });
    }
});

router.get('/:slug/logs', async (req, res) => {
    const { slug } = req.params;
    const type = req.query.type === 'err' ? 'err' : 'out';
    const reg = getRegistry()[slug];
    if (!reg) return res.status(404).send('Módulo no existe');
    const file = path.join(reg.dir, '.logs', type === 'err' ? 'err.log' : 'out.log');
    if (!await fs.pathExists(file)) return res.type('text/plain').send('');
    const data = await fs.readFile(file, 'utf8');
    res.type('text/plain').send(data.slice(-8000));
});

export default router;
import fsp from "node:fs/promises";

export default async function removeDirWithRetries(dir, tries = 6, delayMs = 200) {
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
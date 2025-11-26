import fsp from "node:fs/promises";
import { sleep } from "./sleep.js";
import { getRegistry, saveRegistry } from "../moduleManager.js";

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

            if (err.code == 'EPERM') {
                const newName = dir + '-deleted.lock'
                try {
                    
                    const registry = await getRegistry();
                    const mod = registry.find(m => m.dir === dir);
                    if (mod) {
                        mod.status = 'deleted';
                        await saveRegistry();
                        await fsp.rename(dir, newName)
                    }

                    return
                } catch (e) {
                    console.log(e)
                }
                continue;
            }
            
            throw err;
        }
    }
    throw new Error('No se pudo eliminar el directorio (lock persistente)');
}
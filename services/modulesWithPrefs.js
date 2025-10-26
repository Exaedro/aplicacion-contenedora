import { ModulePreference } from '../db/models/ModulePreference.js';
import { getModulesArray } from '../utils/registry.js';

export async function buildModuleListForUser(userId) {
    const modules = getModulesArray(); // lee modules.json en cada llamada (barato y fresco)
    const prefs = await ModulePreference.findAll({ where: { usuario_id: userId } });

    const prefMap = new Map(prefs.map(p => [p.modulo_nombre, p]));
    const favorites = [];
    const neutrals = [];

    for (const mod of modules) {
        const pref = prefMap.get(mod.slug);
        if (pref?.estado === 'escondido') continue; // filtrar ocultos

        const view = {
            ...mod,
            _pref: {
                estado: pref?.estado ?? 'neutral',
                orden: pref?.orden ?? null,
            }
        };

        if (view._pref.estado === 'favorito') favorites.push(view);
        else neutrals.push(view);
    }

    favorites.sort((a, b) => {
        const ao = a._pref.orden ?? Number.POSITIVE_INFINITY;
        const bo = b._pref.orden ?? Number.POSITIVE_INFINITY;
        if (ao !== bo) return ao - bo;
        return a.custom_name.localeCompare(b.custom_name);
    });

    neutrals.sort((a, b) => a.custom_name.localeCompare(b.custom_name));

    return [...favorites, ...neutrals];
}

/** Utilidad opcional: normaliza orden según array de slugs */
export async function applyFavoriteOrder(userId, orderSlugs) {
    if (!Array.isArray(orderSlugs)) return;
    const favs = await ModulePreference.findAll({ where: { usuario_id: userId, estado: 'favorito' } });
    const index = new Map(orderSlugs.map((s, i) => [s, i]));
    for (const fav of favs) {
        fav.orden = index.has(fav.modulo_nombre) ? index.get(fav.modulo_nombre) : orderSlugs.length + 999;
        await fav.save();
    }
}

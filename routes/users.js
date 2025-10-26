import { User } from "../db/models/User.js";
import { ModulePreference } from "../db/models/ModulePreference.js";
import { authRequired } from '../middlewares/authMiddleware.js'; // tu middleware JWT
import { isValidSlug } from '../utils/registry.js';
import { applyFavoriteOrder } from '../services/modulesWithPrefs.js';
import { buildModuleListForUser } from '../services/modulesWithPrefs.js';
import { sequelize } from "../db/index.js";

import { Router } from "express";
const router = Router();

// Obtener todos los usuarios
router.get('/', async (_req, res) => {
  const users = await User.findAll({ order: [['created_at', 'DESC']], attributes: { exclude: ['password_hash'] } });
  res.json(users);
});

router.post('/', async (req, res) => {
  try {
    const { nombres, apellidos, email, contrasena } = req.body;

    const password_hash = encryptPassword(contrasena);
    const user = await User.create({ nombres, apellidos, email, password_hash });

    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


/** GET preferencias actuales (favorites, hidden, map detallado) */
router.get('/preferences/modules', authRequired, async (req, res) => {
  const rows = await ModulePreference.findAll({
    where: { usuario_id: req.user.uid },
    order: [['estado', 'ASC'],                                    // 'favorito' / 'escondido'
    [sequelize.literal('orden IS NULL'), 'ASC'],                 // primero los que TIENEN orden
    ['orden', 'ASC'],
    ['modulo_nombre', 'ASC'],],
  });

  const favorites = rows.filter(r => r.estado === 'favorito')
                        .sort((a,b) => (a.orden ?? 1e9) - (b.orden ?? 1e9))
                        .map(r => r.modulo_nombre);

                        

  const hidden = rows.filter(r => r.estado === 'escondido').map(r => r.modulo_nombre);

  const map = {};
  for (const r of rows) {
    map[r.modulo_nombre] = { estado: r.estado, orden: r.orden };
  }

  res.json({ favorites, hidden, map });
});

/**
 * PATCH para cambiar estados y/o ordenar favoritos.
 * body:
 *  {
 *    "set": { "slugA": "favorite"|"hidden"|"neutral", ... },
 *    "order": ["slugFav1","slugFav2",...]
 *  }
 */
router.patch('/preferences/modules', authRequired, async (req, res) => {
  const { set = {}, order = null } = req.body || {};
  const user_id = req.user.uid;

  // 1) aplicar cambios de estado
  for (const [slug, estado] of Object.entries(set)) {
    if (!isValidSlug(slug)) continue; // ignorar slugs inexistentes (evita basura)
    if (estado === 'neutral') {
      await ModulePreference.destroy({ where: { usuario_id: user_id, modulo_nombre: slug }});
    } else if (estado === 'favorito' || estado === 'escondido') {
      await ModulePreference.upsert({ usuario_id: user_id, modulo_nombre: slug, estado });
    }
  }

  // 2) si llega orden, actualizar pinned_order de favoritos
  if (Array.isArray(order) && order.length) {
    await applyFavoriteOrder(user_id, order.filter(isValidSlug));
  }

  // 3) responder estado resumido
  const rows = await ModulePreference.findAll({ where: { usuario_id: user_id }});
  res.json({ ok: true, count: rows.length });
});

/** Devuelve los módulos ya filtrados/ordenados según preferencias del usuario autenticado */
router.get('/for-user', authRequired, async (req, res) => {
  const list = await buildModuleListForUser(req.user.uid);
  res.json({ modules: list });
});

export default router;
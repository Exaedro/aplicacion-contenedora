import { User } from "../db/models/User.js";

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

export default router;
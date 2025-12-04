const express = require('express');
const router = express.Router();
const userService = require('../services/UserService');
const isAdmin = require('../middlewares/authMiddleware');

// GET /api/usuarios - List all users
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const search = req.query.q || '';

        const result = await userService.getAll(page, limit, search);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

// GET /api/usuarios/:id - Get a specific user
router.get('/:id', async (req, res) => {
    try {
        const user = await userService.getById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener el usuario' });
    }
});

// PATCH /api/usuarios/:id/rol - Update user role (Admin only)
router.patch('/:id/rol', isAdmin, async (req, res) => {
    try {
        const { rol } = req.body;
        if (!rol) {
            return res.status(400).json({ error: 'El campo "rol" es requerido' });
        }

        const updatedUser = await userService.updateRole(req.params.id, rol);
        if (!updatedUser) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ message: 'Rol actualizado correctamente', user: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar el rol' });
    }
});

// PATCH /api/usuarios/:id/password - Update user password (Admin only)
router.patch('/:id/password', isAdmin, async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ error: 'El campo "password" es requerido' });
        }

        const updatedUser = await userService.updatePassword(req.params.id, password);
        if (!updatedUser) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ message: 'Contraseña actualizada correctamente', user: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar la contraseña' });
    }
});

module.exports = router;

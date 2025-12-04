const express = require('express');
const router = express.Router();

// GET /admin/usuarios - Render user list
router.get('/usuarios', (req, res) => {
    res.render('listadoUsuarios');
});

// GET /admin/usuarios/:id/editar - Render edit user form
router.get('/usuarios/:id/editar', (req, res) => {
    // We pass the ID to the view so it can fetch the data
    res.render('editarUsuario', { userId: req.params.id });
});

module.exports = router;

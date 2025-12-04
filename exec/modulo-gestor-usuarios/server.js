const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/apiUsuarios');
const uiRoutes = require('./routes/uiRutas');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// View Engine Setup
app.set('views', path.join(__dirname, 'ui'));
app.set('view engine', 'ejs');

// Routes
app.use('/api/usuarios', apiRoutes);
app.use('/admin', uiRoutes);

// Root redirect
app.get('/', (req, res) => {
    res.redirect('/admin/usuarios');
});

// Start Server
app.listen(PORT, () => {
    console.log(`[BOOT] MODULO GESTOR DE USUARIOS CORRIENDO: http://localhost:${PORT}`);
});

module.exports = app;
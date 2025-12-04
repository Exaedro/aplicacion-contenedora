// Middleware to simulate admin authorization
// In a real app, this would check a session or JWT token
const isAdmin = (req, res, next) => {
    // Simulating a logged-in admin user for this demo
    // You can toggle this to false to test permission denial
    const currentUser = {
        id: 7,
        rol: 'admin' // Change to 'user' to test restriction
    };

    console.log(`[AuthMiddleware] Checking permissions for User ID: ${currentUser.id}, Role: ${currentUser.rol}`);

    if (currentUser && currentUser.rol === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
    }
};

module.exports = isAdmin;

import jwt from 'jsonwebtoken';
import { User } from '../db/models/index.js';

function getToken(req) {
    // Primero intentar desde cookies (como el contenedor principal)
    if (req.cookies?.token) return req.cookies.token;
    
    // Luego desde el header Authorization
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
        return auth.slice(7);
    }
    return null;
}

export async function authRequired(req, res, next) {
    try {
        const token = getToken(req);

        // Debug: Log para ver qué está recibiendo
        console.log('[Módulo Alumnos Auth] Cookies recibidas:', req.cookies);
        console.log('[Módulo Alumnos Auth] Headers Authorization:', req.headers.authorization);
        console.log('[Módulo Alumnos Auth] Token encontrado:', token ? 'Sí' : 'No');

        if (!token) {
            return res.status(401).json({ 
                error: "No autenticado",
                debug: {
                    hasCookies: !!req.cookies,
                    cookieKeys: req.cookies ? Object.keys(req.cookies) : [],
                    hasAuthHeader: !!req.headers.authorization
                }
            });
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) return res.status(500).json({ error: "JWT no configurado" });

        const payload = jwt.verify(token, secret);
        req.user = payload || {};

        // Si el token no trae una propiedad 'role', intentar obtenerla desde la tabla usuarios
        // usando el uid del payload.
        if ((!req.user.role || req.user.role === 'user') && req.user.uid) {
            try {
                const usuario = await User.findByPk(req.user.uid);
                if (usuario) {
                    // 'rol' es el campo usado en la DB (módulo de alumnos usa 'rol')
                    req.user.role = usuario.rol || usuario.role || req.user.role;
                    console.log('[Módulo Alumnos Auth] Role obtenido desde DB:', req.user.role);
                }
            } catch (dbErr) {
                console.error('[Módulo Alumnos Auth] Error al obtener usuario desde DB:', dbErr);
            }
        }

        console.log('[Módulo Alumnos Auth] Usuario autenticado:', {
            uid: req.user.uid,
            email: req.user.email,
            role: req.user.role
        });

        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ error: "Sesión expirada" });
        }
        return res.status(401).json({ error: "Token inválido", details: err.message });
    }
}

export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            console.error('[Módulo Alumnos Auth] requireRole: No hay usuario en req.user');
            return res.status(401).json({ error: "No autenticado" });
        }

        // Soportar tanto payload.role como payload.rol por compatibilidad
        const userRole = req.user.role || req.user.rol || null;

        console.log('[Módulo Alumnos Auth] Verificando rol:', {
            usuario: req.user.email,
            rolActual: userRole,
            rolesRequeridos: roles
        });

        if (!roles.includes(userRole)) {
            console.error('[Módulo Alumnos Auth] Rol insuficiente:', {
                rolActual: userRole,
                rolesRequeridos: roles
            });
            return res.status(403).json({ 
                error: "No autorizado",
                detalles: {
                    rolActual: userRole,
                    rolesRequeridos: roles
                }
            });
        }

        console.log('[Módulo Alumnos Auth] Rol verificado correctamente');
        next();
    };
}


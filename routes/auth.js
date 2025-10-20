import "dotenv/config";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { comparePasswords } from "../utils/encrypt.js";
import { User } from "../db/models/User.js"; // ajustá el import a tu estructura

const router = Router();

const DUMMY_HASH = "$2b$10$XoJrPG3uI2m8Wv0m0CqF1u0oC9F8r8f8vJw8pU9zT9bJg8r1o7X2a"; 

function setAuthCookie(res, token) {
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
        httpOnly: true,
        secure: isProd,          
        sameSite: "lax",       
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
        path: "/",
    });
}

/**
 * POST /login
 * Body: { email: string, contrasena: string }
 */
router.post("/login", async (req, res) => {
    try {
        let { email, contrasena } = req.body || {};

        if (typeof email !== "string" || typeof contrasena !== "string") {
            return res.status(400).json({ error: "Email y contraseña son requeridos." });
        }

        email = email.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: "Email inválido." });
        }
        if (contrasena.length < 6) {
            return res.status(400).json({ error: "La contraseña es demasiado corta." });
        }

        // Buscar usuario
        const user = await User.findOne({ where: { email } });

        // Comparación 
        const hashToCompare = user?.dataValues.password_hash ?? DUMMY_HASH;
        const ok = comparePasswords(contrasena, hashToCompare);

        if (!user || !ok) {
            return res.status(401).json({ error: "Credenciales inválidas." });
        }

        if (user.isBlocked) {
            return res.status(403).json({ error: "Cuenta bloqueada. Contactá al administrador." });
        }

        // JWT
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) {
            return res.status(500).json({ error: "Falta configurar JWT_SECRET." });
        }

        const token = jwt.sign(
            { uid: user.id, email: user.email, role: user.role || "user" },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        setAuthCookie(res, token);

        return res.json({
            ok: true,
            user: {
                id: user.dataValues.id,
                nombres: user.dataValues.nombres,
                apellidos: user.dataValues.apellidos,
                email: user.dataValues.email,
            },
        });
    } catch (err) {
        console.error("POST /login error:", err);
        return res.status(500).json({ error: "Error interno del servidor." });
    }
});

router.post('/register', async (req, res) => {
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

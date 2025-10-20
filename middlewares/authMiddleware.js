import "dotenv/config";
import jwt from "jsonwebtoken";

function getToken(req) {
    const auth = req.get("authorization");
    if (req.cookies?.token) return req.cookies.token;
    if (auth && auth.toLowerCase().startsWith("bearer ")) {
        return auth.slice(7);
    }
    return null;
}

export function authRequired(req, res, next) {
    try {
        const token = getToken(req);
        if (!token) return res.status(401).json({ error: "No autenticado" });

        const secret = process.env.JWT_SECRET;
        if (!secret) return res.status(500).json({ error: "JWT no configurado" });

        const payload = jwt.verify(token, secret); // lanza si expira o es inválido
        req.user = payload; // { uid, email, role, iat, exp, ... }
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ error: "Sesión expirada" });
        }
        return res.status(401).json({ error: "Token inválido" });
    }
}

export function authPageRequired(req, res, next) {
    try {
        const token = getToken(req);
        if (!token) return res.redirect("/auth");

        const secret = process.env.JWT_SECRET;
        const payload = jwt.verify(token, secret);
        req.user = payload;
        next();
    } catch {
        return res.redirect("/auth");
    }
}
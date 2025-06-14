// C:\xampp\htdocs\Proyecto\proyecto-entregable-sector-7\backend\api3\src\middleware\authMiddleware.js
import { verifyToken } from '../utils/jwt.js'; // Ruta: desde middleware/ a utils/

/**
 * Middleware para verificar la validez del token JWT.
 * Adjunta la información decodificada del token a `req.user`.
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // El token debe venir en el formato "Bearer TOKEN"
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: 'Token no proporcionado. Acceso denegado.' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(403).json({ message: 'Token inválido o expirado. Acceso denegado.' });
    }

    req.user = decoded; // Adjunta el payload del token (ej. { id, username, rol }) a la solicitud
    next();
};

export default authenticateToken;
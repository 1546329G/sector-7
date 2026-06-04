import { verifyToken } from '../utils/jwt.js';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: 'Token no proporcionado. Acceso denegado.' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(403).json({ message: 'Token inválido o expirado. Acceso denegado.' });
    }

    req.user = decoded;
    next();
};

export default authenticateToken;

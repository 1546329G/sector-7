// backend/api3/src/middleware/authMiddleware.js (CONVERTIDO A ES MODULES)

// CAMBIO: Usar import en lugar de require
import { verifyToken } from '../utils/jwt.js'; // <-- Asegúrate de que esta ruta sea correcta y añade .js

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Formato esperado: Bearer TOKEN
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ message: 'Token no proporcionado. Acceso denegado.' });
  }

  // Asegúrate de que verifyToken maneje errores o devuelva null/false si es inválido
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ message: 'Token inválido o expirado. Acceso denegado.' });
  }

  req.user = decoded; // Adjunta el payload del token (ej. { username: 'testuser' }) a la solicitud
  next();
};

// CAMBIO: Usar export default en lugar de module.exports
export default authenticateToken;
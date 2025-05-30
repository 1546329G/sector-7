const { verifyToken } = require('../utils/jwt'); // Asegúrate de que esta ruta sea correcta

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Formato esperado: Bearer TOKEN
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ message: 'Token no proporcionado. Acceso denegado.' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ message: 'Token inválido o expirado. Acceso denegado.' });
  }

  req.user = decoded; // Adjunta el payload del token (ej. { username: 'testuser' }) a la solicitud
  next();
};

module.exports = authenticateToken;
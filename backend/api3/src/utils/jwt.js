const jwt = require('jsonwebtoken');

const generateToken = (payload) => {
  // Usa process.env.JWT_SECRET para obtener el secreto del .env
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }); // Token expira en 1 hora
};

const verifyToken = (token) => {
  try {
    // Usa process.env.JWT_SECRET para obtener el secreto del .env
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    // console.error("Error al verificar token:", error.message); // Opcional para depuración
    return null; // Token inválido o expirado
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
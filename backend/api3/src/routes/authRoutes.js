const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController');
const authenticateToken = require('../middleware/authMiddleware'); // Importa el middleware de autenticación

const router = express.Router();

// Ruta para el registro de usuarios
router.post('/register', registerUser);

// Ruta para el inicio de sesión de usuarios
router.post('/login', loginUser);

// Ruta de ejemplo protegida (solo accesible con un token válido)
router.get('/protected', authenticateToken, (req, res) => {
  // req.user contiene la información del usuario decodificada del token JWT
  res.json({ message: `¡Acceso concedido para ${req.user.username}! Estos son datos muy secretos.` });
});

module.exports = router;
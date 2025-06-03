// backend/api3/src/routes/authRoutes.js (CORREGIDO A ES MODULES COMPLETAMENTE)

import express from 'express'; // <-- CAMBIO: Usar import
import { getDatabasePool } from '../../../db.js'; // <-- CORRECCIÓN CLAVE DE LA RUTA Y SINTAXIS
import { registerUser, loginUser } from '../controllers/authController.js'; // <-- CAMBIO: Usar import y añadir .js
import authenticateToken from '../middleware/authMiddleware.js'; // <-- CAMBIO: Usar import y añadir .js (asumo que exporta default)

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

export default router; // <-- CAMBIO: Usar export default
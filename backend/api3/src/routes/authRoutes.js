// C:\xampp\htdocs\Proyecto\proyecto-entregable-sector-7\backend\api3\src\routes\authRoutes.js
import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js'; // Ruta: de routes/ a controllers/
import authenticateToken from '../middleware/authMiddleware.js'; // Ruta: de routes/ a middleware/

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

// Ruta de ejemplo protegida, para probar que el token funciona
router.get('/protected', authenticateToken, (req, res) => {
    // req.user contendrá la información del usuario decodificada del token JWT
    res.json({ message: `¡Acceso concedido para ${req.user.username}! Estos son datos muy secretos.`, user: req.user });
});

export default router;
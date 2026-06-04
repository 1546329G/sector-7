import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';
import authenticateToken from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: `¡Acceso concedido para ${req.user.username}! Estos son datos muy secretos.`, user: req.user });
});

export default router;

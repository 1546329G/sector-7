import express from 'express';
import { getAllUsers, getUserCount, updateUser, toggleUserStatus, deleteUser } from '../controllers/userController.js';
import authenticateToken from '../middleware/authMiddleware.js';
import authorizeRoles from '../middleware/authorizeRoles.js';

const router = express.Router();

router.get('/count', authenticateToken, authorizeRoles(['admin', 'reportes']), getUserCount);

router.get('/', authenticateToken, authorizeRoles(['admin', 'reportes']), getAllUsers);

router.put('/:id', authenticateToken, authorizeRoles(['admin']), updateUser);

router.patch('/:id/toggle-status', authenticateToken, authorizeRoles(['admin']), toggleUserStatus);

router.delete('/:id', authenticateToken, authorizeRoles(['admin']), deleteUser);

export default router;

// C:\xampp\htdocs\Proyecto\proyecto-entregable-sector-7\backend\api3\src\routes\userRoutes.js
import express from 'express';
import { getAllUsers, getUserCount, updateUser, toggleUserStatus, deleteUser } from '../controllers/userController.js'; // Ruta: de routes/ a controllers/
import authenticateToken from '../middleware/authMiddleware.js'; // Ruta: de routes/ a middleware/
import authorizeRoles from '../middleware/authorizeRoles.js'; // Ruta: de routes/ a middleware/

const router = express.Router();

// Ruta para obtener el conteo total de usuarios
// Requiere autenticación y el rol de 'admin' o 'reportes'
router.get('/count', authenticateToken, authorizeRoles(['admin', 'reportes']), getUserCount);

// Ruta para obtener todos los usuarios
// Requiere autenticación y el rol de 'admin' o 'reportes'
router.get('/', authenticateToken, authorizeRoles(['admin', 'reportes']), getAllUsers);

// Ruta para actualizar un usuario por ID
// Requiere autenticación y el rol de 'admin'
router.put('/:id', authenticateToken, authorizeRoles(['admin']), updateUser);

// Ruta para cambiar el estado activo/inactivo de un usuario
// Requiere autenticación y el rol de 'admin'
router.patch('/:id/toggle-status', authenticateToken, authorizeRoles(['admin']), toggleUserStatus);

// Ruta para eliminar un usuario por ID
// Requiere autenticación y el rol de 'admin'
router.delete('/:id', authenticateToken, authorizeRoles(['admin']), deleteUser);

export default router;
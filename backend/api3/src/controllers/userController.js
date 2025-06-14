// C:\xampp\htdocs\Proyecto\proyecto-entregable-sector-7\backend\api3\src\controllers\userController.js
import { getDatabasePool } from '../../../db.js'; // Ruta: desde src/controllers/ sube src/, api3/, backend/ y encuentra db.js

/**
 * Obtiene el conteo total de usuarios.
 * @param {object} req - Objeto de solicitud de Express.
 * @param {object} res - Objeto de respuesta de Express.
 */
export const getUserCount = async (req, res) => {
    const pool = await getDatabasePool();
    try {
        const [rows] = await pool.query('SELECT COUNT(*) AS totalUsers FROM usuarios');
        res.status(200).json({ totalUsers: rows[0].totalUsers });
    } catch (error) {
        console.error('Error al obtener el conteo de usuarios:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener el conteo de usuarios.' });
    }
};

/**
 * Obtiene todos los usuarios.
 * @param {object} req - Objeto de solicitud de Express.
 * @param {object} res - Objeto de respuesta de Express.
 */
export const getAllUsers = async (req, res) => {
    const pool = await getDatabasePool();
    try {
        const [rows] = await pool.query('SELECT id, username, rol, activo, creado_en, actualizado_en FROM usuarios ORDER BY username ASC');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener usuarios.' });
    }
};

/**
 * Actualiza la información de un usuario.
 * @param {object} req - Objeto de solicitud de Express. Contiene `params.id` y `body { username, rol, activo }`.
 * @param {object} res - Objeto de respuesta de Express.
 */
export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, rol, activo } = req.body;
    const pool = await getDatabasePool();
    try {
        const [result] = await pool.query(
            'UPDATE usuarios SET username = ?, rol = ?, activo = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?',
            [username, rol, activo, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        // Devuelve el usuario actualizado
        const [updatedUserRows] = await pool.query('SELECT id, username, rol, activo, creado_en, actualizado_en FROM usuarios WHERE id = ?', [id]);
        res.status(200).json({ message: 'Usuario actualizado exitosamente.', user: updatedUserRows[0] });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

/**
 * Cambia el estado 'activo' de un usuario.
 * @param {object} req - Objeto de solicitud de Express. Contiene `params.id` y `body { activo }`.
 * @param {object} res - Objeto de respuesta de Express.
 */
export const toggleUserStatus = async (req, res) => {
    const { id } = req.params;
    const { activo } = req.body; // El frontend envía el nuevo estado (true/false)
    const pool = await getDatabasePool();
    try {
        const [result] = await pool.query(
            'UPDATE usuarios SET activo = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?',
            [activo, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        // Devuelve el usuario con el estado actualizado
        const [updatedUserRows] = await pool.query('SELECT id, username, rol, activo, creado_en, actualizado_en FROM usuarios WHERE id = ?', [id]);
        res.status(200).json({ message: 'Estado de usuario actualizado exitosamente.', user: updatedUserRows[0] });
    } catch (error) {
        console.error('Error al cambiar estado de usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

/**
 * Elimina un usuario.
 * @param {object} req - Objeto de solicitud de Express. Contiene `params.id`.
 * @param {object} res - Objeto de respuesta de Express.
 */
export const deleteUser = async (req, res) => {
    const { id } = req.params;
    const pool = await getDatabasePool();
    try {
        const [result] = await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        res.status(200).json({ message: 'Usuario eliminado exitosamente.' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};
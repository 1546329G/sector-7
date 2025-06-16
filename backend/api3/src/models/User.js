// C:\xampp\htdocs\Proyecto\proyecto-entregable-sector-7\backend\api3\src\models\User.js
import { getDatabasePool } from '../../../db.js'; // Ruta: desde src/models/ sube src/, api3/, backend/ y encuentra db.js

class User {
    /**
     * Busca un usuario por su nombre de usuario.
     * @param {string} username - El nombre de usuario a buscar.
     * @returns {Promise<object|undefined>} El objeto de usuario si se encuentra, o undefined.
     */
    static async findByUsername(username) {
        const pool = await getDatabasePool(); // Obtiene el pool de conexiones
        try {
            // Selecciona todas las columnas relevantes, incluyendo 'activo'
            const [rows] = await pool.query('SELECT id, username, password_hash, rol, activo FROM usuarios WHERE username = ?', [username]);
            return rows[0]; // Devuelve el primer resultado (debería ser único)
        } catch (error) {
            console.error('Error al buscar usuario por nombre de usuario (modelo):', error);
            throw error; // Propagar el error para manejo superior
        }
    }

    /**
     * Crea un nuevo usuario en la base de datos.
     * @param {string} username - Nombre de usuario del nuevo usuario.
     * @param {string} password_hash - Contraseña hasheada del nuevo usuario.
     * @param {string} [rol='usuario'] - Rol del usuario (por defecto 'usuario').
     * @returns {Promise<object>} Objeto con el ID y rol del nuevo usuario.
     */
    static async create(username, password_hash, rol) {
        const pool = await getDatabasePool(); // Obtiene el pool de conexiones
        try {
            const finalRol = rol || 'usuario'; // Establece un rol por defecto si no se proporciona
            const [result] = await pool.query(
                'INSERT INTO usuarios (username, password_hash, rol, activo, creado_en, actualizado_en) VALUES (?, ?, ?, TRUE, NOW(), NOW())',
                [username, password_hash, finalRol]
            );
            return { id: result.insertId, username, rol: finalRol };
        } catch (error) {
            console.error('Error al crear nuevo usuario en la base de datos (modelo):', error);
            throw error;
        }
    }

    /**
     * Obtiene todos los usuarios de la base de datos.
     * @returns {Promise<Array<object>>} Un array de objetos de usuario.
     */
    static async findAll() {
        const pool = await getDatabasePool();
        try {
            const [rows] = await pool.query('SELECT id, username, rol, activo, creado_en, actualizado_en FROM usuarios ORDER BY username ASC');
            return rows;
        } catch (error) {
            console.error('Error al obtener todos los usuarios (modelo):', error);
            throw error;
        }
    }

    /**
     * Actualiza un usuario existente por su ID.
     * @param {number} id - ID del usuario a actualizar.
     * @param {string} username - Nuevo nombre de usuario.
     * @param {string} rol - Nuevo rol del usuario.
     * @param {boolean} activo - Nuevo estado de actividad del usuario.
     * @returns {Promise<boolean>} True si el usuario fue actualizado, false si no se encontró.
     */
    static async update(id, username, rol, activo) {
        const pool = await getDatabasePool();
        try {
            const [result] = await pool.query(
                'UPDATE usuarios SET username = ?, rol = ?, activo = ?, actualizado_en = NOW() WHERE id = ?',
                [username, rol, activo, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al actualizar usuario (modelo):', error);
            throw error;
        }
    }

    /**
     * Elimina un usuario por su ID.
     * @param {number} id - ID del usuario a eliminar.
     * @returns {Promise<boolean>} True si el usuario fue eliminado, false si no se encontró.
     */
    static async delete(id) {
        const pool = await getDatabasePool();
        try {
            const [result] = await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al eliminar usuario (modelo):', error);
            throw error;
        }
    }

    /**
     * Cambia el estado 'activo' de un usuario.
     * @param {number} id - ID del usuario.
     * @param {boolean} newStatus - El nuevo estado (true para activo, false para inactivo).
     * @returns {Promise<boolean>} True si el estado fue cambiado, false si no se encontró el usuario.
     */
    static async toggleStatus(id, newStatus) {
        const pool = await getDatabasePool();
        try {
            const [result] = await pool.query(
                'UPDATE usuarios SET activo = ?, actualizado_en = NOW() WHERE id = ?',
                [newStatus, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al cambiar estado de usuario (modelo):', error);
            throw error;
        }
    }
}

export default User;
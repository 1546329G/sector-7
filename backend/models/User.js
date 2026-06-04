import { getDatabasePool } from '../db.js';

class User {
    static async findByUsername(username) {
        const pool = await getDatabasePool();
        try {
            const [rows] = await pool.query('SELECT id, username, password_hash, rol, activo FROM usuarios WHERE username = ?', [username]);
            return rows[0];
        } catch (error) {
            console.error('Error al buscar usuario por nombre de usuario (modelo):', error);
            throw error;
        }
    }

    static async create(username, password_hash, rol) {
        const pool = await getDatabasePool();
        try {
            const finalRol = rol || 'usuario';
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

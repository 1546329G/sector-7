// api3/src/controllers/userController.js

const db = require('../db'); // Asegúrate de que esta ruta a tu archivo db.js sea correcta
const bcrypt = require('bcryptjs'); // Solo si lo usas para registrar/cambiar contraseñas
const jwt = require('jsonwebtoken'); // Solo si lo usas para generar tokens

// Función para obtener todos los usuarios
exports.getAllUsers = async (req, res) => {
    try {
        // Ejecuta el SELECT. ¡MUY IMPORTANTE INCLUIR 'activo' AQUÍ!
        const [rows] = await db.query('SELECT id, username, rol, activo, creado_en, actualizado_en FROM usuarios ORDER BY username ASC');
        res.status(200).json(rows); // Envía los usuarios como JSON
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener usuarios.' });
    }
};

// --- AÑADE AQUÍ TUS OTRAS FUNCIONES CONTROLADORAS (register, login, etc.) ---
// Ejemplo de register (ya deberías tenerlo):
exports.register = async (req, res) => {
    const { username, password, rol } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Usuario y contraseña son requeridos.' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        // Asegúrate de que la inserción incluya 'activo' con un valor por defecto
        const [result] = await db.query('INSERT INTO usuarios (username, password_hash, rol, activo) VALUES (?, ?, ?, ?)', [username, hashedPassword, rol || 'usuario', true]);
        res.status(201).json({ message: 'Usuario registrado exitosamente', userId: result.insertId });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'El nombre de usuario ya existe.' });
        }
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// Ejemplo de login (ya deberías tenerlo):
exports.login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await db.query('SELECT id, username, password_hash, rol, activo FROM usuarios WHERE username = ?', [username]);
        const user = rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }
        
        // ¡Verifica el estado activo aquí!
        if (!user.activo) {
            return res.status(403).json({ message: 'Tu cuenta está inactiva. Contacta al administrador.' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, rol: user.rol },
            process.env.JWT_SECRET || 'your_jwt_secret', // Usa una variable de entorno real
            { expiresIn: '1h' }
        );
        res.status(200).json({ message: 'Login exitoso', token, user: { id: user.id, username: user.username, rol: user.rol, activo: user.activo } });
    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// Asegúrate de incluir aquí las funciones para updateUser, toggleUserStatus, deleteUser
// que ya podrías tener o que necesitarías implementar para las otras rutas.
// ... (Aquí van tus otras funciones del controlador como updateUser, toggleUserStatus, deleteUser) ...

// Ejemplo de updateUser (si no lo tienes):
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, rol, activo } = req.body;
    try {
        const [result] = await db.query(
            'UPDATE usuarios SET username = ?, rol = ?, activo = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?',
            [username, rol, activo, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        const [updatedUserRows] = await db.query('SELECT id, username, rol, activo, creado_en, actualizado_en FROM usuarios WHERE id = ?', [id]);
        res.status(200).json({ message: 'Usuario actualizado exitosamente.', user: updatedUserRows[0] });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// Ejemplo de toggleUserStatus (si no lo tienes):
exports.toggleUserStatus = async (req, res) => {
    const { id } = req.params;
    const { activo } = req.body; // El frontend enviará el nuevo estado (true/false)
    try {
        const [result] = await db.query(
            'UPDATE usuarios SET activo = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?',
            [activo, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        const [updatedUserRows] = await db.query('SELECT id, username, rol, activo, creado_en, actualizado_en FROM usuarios WHERE id = ?', [id]);
        res.status(200).json({ message: 'Estado de usuario actualizado exitosamente.', user: updatedUserRows[0] });
    } catch (error) {
        console.error('Error al cambiar estado de usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// Ejemplo de deleteUser (si no lo tienes):
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM usuarios WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        res.status(200).json({ message: 'Usuario eliminado exitosamente.' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};
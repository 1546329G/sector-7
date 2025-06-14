// C:\xampp\htdocs\Proyecto\proyecto-entregable-sector-7\backend\api3\src\controllers\authController.js
import bcrypt from 'bcryptjs';
import User from '../models/User.js'; // Ruta: desde controllers/ a models/
import { generateToken } from '../utils/jwt.js'; // Ruta: desde controllers/ a utils/

/**
 * Maneja el registro de un nuevo usuario.
 * @param {object} req - Objeto de solicitud de Express.
 * @param {object} res - Objeto de respuesta de Express.
 */
export const registerUser = async (req, res) => {
    const { username, password, rol } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Se requiere nombre de usuario y contraseña.' });
    }

    try {
        const existingUser = await User.findByUsername(username);
        if (existingUser) {
            return res.status(409).json({ message: 'El nombre de usuario ya existe.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create(username, hashedPassword, rol);

        res.status(201).json({ message: 'Usuario registrado exitosamente.' });
    } catch (error) {
        console.error('Error en el registro de usuario (controlador):', error);
        if (error.code === 'ER_DUP_ENTRY') { // Error específico de MySQL para entrada duplicada
            return res.status(409).json({ message: 'El nombre de usuario ya existe.' });
        }
        res.status(500).json({ message: 'Error en el servidor al registrar el usuario.', error: error.message });
    }
};

/**
 * Maneja el inicio de sesión de un usuario.
 * @param {object} req - Objeto de solicitud de Express.
 * @param {object} res - Objeto de respuesta de Express.
 */
export const loginUser = async (req, res) => {
    const { username, password } = req.body;

    console.log('--- INTENTO DE LOGIN ---');
    console.log('Username recibido:', username);

    try {
        const user = await User.findByUsername(username);
        console.log('Usuario encontrado en DB:', user ? user.username : 'Ninguno');

        if (!user) {
            console.log('Usuario no encontrado para:', username);
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        console.log('Resultado de bcrypt.compare (isPasswordValid):', isPasswordValid);

        if (!isPasswordValid) {
            console.log('Contraseña NO válida para:', username);
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }
        
        // Verificar si la cuenta está activa
        if (!user.activo) {
            console.log('Cuenta inactiva para:', username);
            return res.status(403).json({ message: 'Tu cuenta está inactiva. Contacta al administrador.' });
        }

        const token = generateToken({ id: user.id, username: user.username, rol: user.rol });
        console.log('Login exitoso para:', username);
        // Devolver el token y la información básica del usuario (incluyendo 'activo')
        res.json({ token, message: 'Inicio de sesión exitoso.', user: { id: user.id, username: user.username, rol: user.rol, activo: user.activo } });
    } catch (error) {
        console.error('Error en el inicio de sesión (catch):', error);
        res.status(500).json({ message: 'Error en el servidor al iniciar sesión.' });
    }
};
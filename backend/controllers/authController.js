import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';

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
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'El nombre de usuario ya existe.' });
        }
        res.status(500).json({ message: 'Error en el servidor al registrar el usuario.', error: error.message });
    }
};

export const loginUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findByUsername(username);

        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        if (!user.activo) {
            return res.status(403).json({ message: 'Tu cuenta está inactiva. Contacta al administrador.' });
        }

        const token = generateToken({ id: user.id, username: user.username, rol: user.rol });
        res.json({ token, message: 'Inicio de sesión exitoso.', user: { id: user.id, username: user.username, rol: user.rol, activo: user.activo } });
    } catch (error) {
        console.error('Error en el inicio de sesión (catch):', error);
        res.status(500).json({ message: 'Error en el servidor al iniciar sesión.' });
    }
};

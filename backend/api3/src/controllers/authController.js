// backend/api3/src/controllers/authController.js (CONVERTIDO A ES MODULES)

import bcrypt from 'bcryptjs'; // <-- CAMBIO: Usar import
// Importante: La ruta de User.js. Necesitas subir dos niveles desde controllers/ a api3/src/, luego al models/
// La ruta más probable para models/User.js desde controllers/ es ../models/User.js
import User from '../models/User.js'; // <-- CAMBIO: Usar import y añadir .js. Asumiendo export default de User.js
import { generateToken } from '../utils/jwt.js'; // <-- CAMBIO: Usar import y añadir .js

// --- FUNCIÓN registerUser ---
export const registerUser = async (req, res) => { // <-- CAMBIO: Añadir 'export const'
  const { username, password, rol } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Se requiere nombre de usuario y contraseña.' });
  }

  try {
    // 1. Verificar si el usuario ya existe
    const existingUser = await User.findByUsername(username); // Asegúrate de que User.findByUsername sea asíncrono
    if (existingUser) {
      return res.status(409).json({ message: 'El nombre de usuario ya existe.' });
    }

    // 2. Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Crear el nuevo usuario en la DB
    await User.create(username, hashedPassword, rol); // Asegúrate de que User.create sea asíncrono y reciba 'rol'

    res.status(201).json({ message: 'Usuario registrado exitosamente.' });
  } catch (error) {
    console.error('Error en el registro de usuario (controlador):', error);
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'El nombre de usuario ya existe.' });
    }
    res.status(500).json({ message: 'Error en el servidor al registrar el usuario.', error: error.message });
  }
};


// --- FUNCIÓN loginUser ---
export const loginUser = async (req, res) => { // <-- CAMBIO: Añadir 'export const'
    const { username, password } = req.body;

    console.log('--- INTENTO DE LOGIN ---');
    console.log('Username recibido:', username);
    // console.log('Password recibido (plano):', password); // <-- Para depuración, ¡elimina en producción!

    try {
        // 1. Buscar al usuario en la DB
        const user = await User.findByUsername(username); // Asegúrate de que User.findByUsername sea asíncrono
        console.log('Usuario encontrado en DB:', user ? user.username : 'Ninguno');

        if (!user) {
            console.log('Usuario no encontrado para:', username);
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // 2. Comparar la contraseña ingresada con el hash almacenado
        console.log('Password hash almacenado:', user.password_hash);
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        console.log('Resultado de bcrypt.compare (isPasswordValid):', isPasswordValid);

        if (!isPasswordValid) {
            console.log('Contraseña NO válida para:', username);
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // 3. Si las credenciales son válidas, generar un token JWT
        const token = generateToken({ id: user.id, username: user.username, rol: user.rol });
        console.log('Login exitoso para:', username);
        res.json({ token, message: 'Inicio de sesión exitoso.', user: { id: user.id, username: user.username, rol: user.rol } });
    } catch (error) {
        console.error('Error en el inicio de sesión (catch):', error);
        res.status(500).json({ message: 'Error en el servidor al iniciar sesión.' });
    }
};

// <-- REMUEVE LA SIGUIENTE EXPORTACIÓN COMMONJS:
// module.exports = {
//   registerUser,
//   loginUser,
// };
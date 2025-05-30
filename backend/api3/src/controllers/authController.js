// controllers/authController.js
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

const registerUser = async (req, res) => {
  const { username, password, rol } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Se requiere nombre de usuario y contraseña.' });
  }

  try {
    // 1. Verificar si el usuario ya existe
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(409).json({ message: 'El nombre de usuario ya existe.' });
    }

    // 2. Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Crear el nuevo usuario en la DB
    // La función create ahora puede devolver un objeto con el ID si quieres usarlo, aunque no es estrictamente necesario para este endpoint.
    await User.create(username, hashedPassword, rol); // Asegúrate de pasar 'rol'
    // Si User.create falla (ej. por un problema en la DB), el catch de este bloque lo atrapará

    res.status(201).json({ message: 'Usuario registrado exitosamente.' });
  } catch (error) {
    console.error('Error en el registro de usuario (controlador):', error); // Mensaje más específico
    // Verifica si el error es de una entrada duplicada (ej. si el findByUsername no lo atrapó por alguna razón de concurrencia)
    if (error.code === 'ER_DUP_ENTRY') { // Código de error de MySQL/MariaDB para entrada duplicada
        return res.status(409).json({ message: 'El nombre de usuario ya existe.' });
    }
    res.status(500).json({ message: 'Error en el servidor al registrar el usuario.', error: error.message }); // Devuelve el mensaje de error real
  }
};


const loginUser = async (req, res) => {
    const { username, password } = req.body;

    console.log('--- INTENTO DE LOGIN ---');
    console.log('Username recibido:', username);
    console.log('Password recibido (plano):', password); // <-- Para depuración, ¡elimina en producción!

    try {
        // 1. Buscar al usuario en la DB
        const user = await User.findByUsername(username);
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
module.exports = {
  registerUser,
  loginUser,
};
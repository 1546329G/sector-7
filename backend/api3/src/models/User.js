// models/User.js
const { pool } = require('../config/database');

class User {
  // Encuentra un usuario por su nombre de usuario
  static async findByUsername(username) {
    try {
      const [rows] = await pool.query('SELECT * FROM usuarios WHERE username = ?', [username]);
      return rows[0];
    } catch (error) {
      console.error('Error al buscar usuario por nombre de usuario (DB):', error); // Añadir (DB) para claridad
      throw error;
    }
  }

  // Crea un nuevo usuario en la base de datos
  // Asegúrate de que 'rol' coincida con los valores permitidos en tu DB.
  // Si tu DB tiene 'usuario' como DEFAULT, puedes quitar el valor por defecto aquí.
  // O usar el valor que TU DB tiene por defecto, por ejemplo:
  static async create(username, password_hash, rol) { // Quitamos el valor por defecto si tu DB lo maneja
    try {
        // Si 'rol' llega como undefined, usar 'usuario' que es el default de tu DB
        const finalRol = rol || 'usuario'; // Usa 'usuario' si no se proporciona 'rol'
      const [result] = await pool.query(
        'INSERT INTO usuarios (username, password_hash, rol) VALUES (?, ?, ?)',
        [username, password_hash, finalRol] // Usamos finalRol aquí
      );
      // Retorna el ID del usuario recién creado para que el frontend pueda tenerlo si es necesario
      return { id: result.insertId, username, rol: finalRol };
    } catch (error) {
      console.error('Error al crear nuevo usuario en la base de datos:', error); // Mensaje más específico
      throw error; // Es crucial relanzar el error para que el controlador lo capture
    }
  }

  // ... (si agregaste findAll, update, delete, toggleStatus, asegúrate de que también manejen errores)
}

module.exports = User;
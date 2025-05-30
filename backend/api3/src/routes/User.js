const { pool } = require('../config/db'); // Asumo que tienes una conexión a la DB aquí
const bcrypt = require('bcryptjs');

class User {
  static async create(username, password) {
    // Genera un hash de la contraseña
    const password_hash = await bcrypt.hash(password, 10);
    // El rol se define aquí
    const role = 'user'; // Asignamos el rol por defecto 'user' al crear

    try {
      const [result] = await pool.query(
        'INSERT INTO usuarios (username, password_hash, role) VALUES (?, ?, ?)',
        [username, password_hash, role] // Asegúrate de que 'role' esté incluido aquí
      );
      return { id: result.insertId, username, role }; // Retorna el usuario creado con su ID y rol
    } catch (error) {
      console.error('Error al crear nuevo usuario:', error);
      throw error;
    }
  }

  // ... otros métodos (findByUsername, findById, etc.)
}

module.exports = User;
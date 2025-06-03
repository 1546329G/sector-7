// backend/api3/src/models/User.js (CONVERTIDO A ES MODULES)

// CAMBIO: Usar import en lugar de require
// Importante: La ruta de db.js desde models/User.js es ../../../db.js
// ¡Tu código original usa '../config/database' lo cual indica un problema de ruta!
// Si tu pool de base de datos unificado está en backend/db.js, la importación aquí debe ser:
import { getDatabasePool } from '../../../db.js'; // <-- CAMBIO Y CORRECCIÓN DE RUTA

class User {
  // Encuentra un usuario por su nombre de usuario
  static async findByUsername(username) {
    // CAMBIO: Usa getDatabasePool() para obtener el pool
    const pool = await getDatabasePool(); // Obtiene el pool de conexiones
    try {
      const [rows] = await pool.query('SELECT id, username, password_hash, rol FROM usuarios WHERE username = ?', [username]); // Corregido 'SELECT *' a columnas específicas
      return rows[0];
    } catch (error) {
      console.error('Error al buscar usuario por nombre de usuario (DB):', error);
      throw error;
    }
  }

  // Crea un nuevo usuario en la base de datos
  static async create(username, password_hash, rol) {
    // CAMBIO: Usa getDatabasePool() para obtener el pool
    const pool = await getDatabasePool(); // Obtiene el pool de conexiones
    try {
      const finalRol = rol || 'usuario';
      const [result] = await pool.query(
        'INSERT INTO usuarios (username, password_hash, rol) VALUES (?, ?, ?)',
        [username, password_hash, finalRol]
      );
      return { id: result.insertId, username, rol: finalRol };
    } catch (error) {
      console.error('Error al crear nuevo usuario en la base de datos:', error);
      throw error;
    }
  }

  // ... (si agregaste findAll, update, delete, toggleStatus, asegúrate de que también manejen errores)
}

// CAMBIO: Usar export default en lugar de module.exports
export default User;
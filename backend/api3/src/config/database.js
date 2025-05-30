const mysql = require('mysql2/promise'); // Usamos la versión de promesas de mysql2

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

// Crear un pool de conexiones para manejar múltiples conexiones de forma eficiente
const pool = mysql.createPool(dbConfig);

const testDbConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Conexión a la base de datos MariaDB exitosa!');
    connection.release(); // Liberar la conexión al pool
  } catch (error) {
    console.error('Error al conectar a la base de datos MariaDB:', error.message);
    process.exit(1); // Salir de la aplicación si no se puede conectar a la DB
  }
};

module.exports = {
  pool,
  testDbConnection
};
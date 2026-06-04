import mysql from 'mysql2/promise';

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'railway',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306
};

let dbPool;

export async function getDatabasePool() {
    if (dbPool) {
        return dbPool;
    }

    try {
        console.log('Intentando conectar al DB con:', {
            host: dbConfig.host,
            user: dbConfig.user,
            database: dbConfig.database,
            port: dbConfig.port,
            password: dbConfig.password ? '******' : ''
        });

        const pool = mysql.createPool(dbConfig);
        await pool.getConnection();
        console.log('Pool de conexiones a la base de datos creado correctamente y verificado.');
        dbPool = pool;
        return dbPool;
    } catch (error) {
        console.error('Error al crear o verificar el pool de conexiones:', error);
        console.error('Detalles del error:', {
            code: error.code,
            errno: error.errno,
            syscall: error.syscall,
            message: error.message
        });
        console.warn('El servidor continuará pero las funciones de BD no estarán disponibles hasta que se configure la conexión.');
        return null;
    }
}

// C:\xampp\htdocs\Proyecto\proyecto-entregable-sector-7\backend\api3\src\app.js
import express from 'express';
import cors from 'cors';
import { getDatabasePool } from '../../db.js'; // Ruta: desde src/ sube api3/, backend/ y encuentra db.js

import authRoutes from './routes/authRoutes.js'; // Ruta: desde src/ a routes/
import userRoutes from './routes/userRoutes.js'; // Ruta: desde src/ a routes/

// Verifica la conexión a la base de datos cuando se inicia la API 3
(async () => {
    try {
        await getDatabasePool();
        console.log('[API 3] Conexión a la base de datos verificada al inicio.');
    } catch (error) {
        console.error('[API 3] Falló la verificación inicial de la conexión a la base de datos:', error);
        // Opcional: process.exit(1); si quieres que la aplicación se detenga
        // si la conexión a la DB no se puede establecer al inicio.
    }
})();

const app = express();

// Middlewares
app.use(express.json()); // Para parsear el body de las solicitudes como JSON
app.use(cors()); // Habilita CORS para permitir solicitudes desde el frontend

// Montar las rutas de autenticación y de usuarios
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Ruta de prueba para verificar que la API 3 está funcionando
app.get('/', (req, res) => {
    res.send('API de Autenticación y Usuarios (API 3) funcionando!');
});

export default app;
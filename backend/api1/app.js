// backend/api1/app.js (Este es el archivo para la API PRINCIPAL de profesores)

import express from 'express';
import cors from 'cors';

// Importa los routers de las rutas de la API Principal
import profesorRoutes from './routes/profesorRoutes.js';
import asistenciaRoutes from './routes/asistenciaRoutes.js';
import horarioFeriadoRoutes from './routes/horarioFeriadoRoutes.js';

// Importa el pool de la base de datos unificado
import { getDatabasePool } from '../db.js'; // Asegúrate de que esta ruta sea correcta

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Montar las rutas en la aplicación de Express
app.use(profesorRoutes);
app.use(asistenciaRoutes);
app.use(horarioFeriadoRoutes);

// Opcional: Una ruta de prueba simple para la raíz de la API 1
app.get('/', (req, res) => {
    res.send('API Principal (Profesores) funcionando!');
});


// Verificar la conexión a la DB al inicio (opcional, ya lo hace server.js)
(async () => {
    try {
        await getDatabasePool();
        console.log('[API 1] Conexión a la base de datos verificada al inicio.');
    } catch (error) {
        console.error('[API 1] Falló la verificación inicial de la conexión a la base de datos:', error);
    }
})();

// ... (resto de tu código en backend/api1/app.js) ...

console.log('[API 1 Debug] app.js de la API Principal se está exportando.');
export default app; // Exporta la aplicación Express

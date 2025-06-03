// backend/api3/src/app.js

// require('dotenv').config(); // <-- ELIMINAR ESTA LÍNEA AQUÍ. server.js ya carga dotenv.
// En backend/api3/src/app.js
// <-- Esta ruta es incorrecta para app.js
import express from 'express'; // <-- CAMBIO: De require a import
import cors from 'cors';      // <-- CAMBIO: De require a import

// Importa authRoutes - ASEGÚRATE DE QUE ESTE TAMBIÉN USE 'import' Y TENGA '.js'
import authRoutes from './routes/authRoutes.js'; // <-- CAMBIO: De require a import, y añade .js

// La importación de testDbConnection es el siguiente punto a revisar.
// Si testDbConnection es solo una función que se ejecuta una vez,
// y tu db.js unificado está en la raíz, entonces la forma de llamar a la conexión
// cambiará. Asumo que 'database.js' es tu antiguo archivo de conexión de api3,
// el cual hemos eliminado y reemplazado con el 'db.js' unificado.
// Lo más probable es que ahora llames directamente a getDatabasePool() al inicio de app.js o server.js
// para verificar la conexión, o solo la llamas cuando una ruta la necesita.

// Si quieres verificar la conexión al inicio de API 3, hazlo así:
import { getDatabasePool } from '../../db.js'; // <-- Importa el db.js unificado
(async () => {
  try {
    await getDatabasePool(); // Esto verificará la conexión al inicio de la API 3
    console.log('[API 3] Conexión a la base de datos verificada al inicio.');
  } catch (error) {
    console.error('[API 3] Falló la verificación inicial de la conexión a la base de datos:', error);
    // Decide si quieres que la API 3 se detenga si la DB no está lista al inicio.
    // process.exit(1);
  }
})();


const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('API de Autenticación funcionando!');
});



console.log('[API 3 Debug] app.js de la API de Autenticación se está exportando.');
export default app; 
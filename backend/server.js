// backend/server.js

// 1. Cargar dotenv al inicio para que process.env esté disponible
//    'dotenv/config' es el método recomendado para ES Modules
import 'dotenv/config';

// 2. Importar tus aplicaciones de Express
import appApi1 from './api1/app.js';
import appApi3 from './api3/src/app.js';

// 3. Obtener los puertos de las variables de entorno
//    Asegúrate de que los nombres en tu .env coincidan con lo que buscas aquí.
//    Tu .env actual tiene 'PORT=5009', no PORT_API1 ni PORT_API3.
//    Si quieres puertos separados para cada API, deberías definirlos así en tu .env:
//    PORT_API1=5009
//    PORT_API3=5010
//    Si solo tienes PORT=5009, entonces ambas APIs intentarán usar 5009 si no usas fallbacks diferentes.

const portApi1 = process.env.PORT_API1 || process.env.PORT || 5009; // Intenta PORT_API1, luego PORT, luego 5009
const portApi3 = process.env.PORT_API3 || 5010; // Intenta PORT_API3, luego 5010


// Iniciar la API de Profesores/Asistencias (API 1)

import express from 'express';
import reporteRoutes from './routes/reporte.js';
import periodoRoutes from './routes/periodos.js';
import saveRoutes from './routes/save.js';

const app = express();
const PORT = process.env.PORT || 3000;


app.get('/', (req, res) => {
  res.send('Hola!');
});

app.use(express.json());
app.use('/',reporteRoutes);
app.use('/',periodoRoutes);
app.use('/',saveRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
//-----------------------------------
//-----------------------------------
// --- INICIO DE api1 ---
//-----------------------------------
//-----------------------------------
appApi1.listen(portApi1, () => {
    console.log(`\n=================================================`);
    console.log(`\n=================================================`);
    console.log(`\n=================================================`);
    console.log(`[API 1 - Principal] Servidor escuchando en http://localhost:${portApi1}`);
    console.log(`[API 1 - Principal] (Rutas de Profesores, Asistencias, Horarios, Feriados)`);
    console.log(`=================================================\n`);

    // Puedes listar las rutas específicas de API1 aquí si lo deseas, como en tu server.js original de api1
    console.log('Rutas disponibles para EXTRAER (GET) en API 1:');
    console.log(`- http://localhost:${portApi1}/profesores`);
    console.log(`- http://localhost:${portApi1}/profesores/buscar?q=...`);
    console.log(`- http://localhost:${portApi1}/profesores/:id`);
    console.log(`- http://localhost:${portApi1}/asistencias`);
    console.log(`- http://localhost:${portApi1}/horarios/profesor/:id_profesor`);
    console.log(`- http://localhost:${portApi1}/feriados`);
    console.log('\nRutas disponibles para INSERTAR (POST) en API 1:');
    console.log(`- http://localhost:${portApi1}/profesores`);
    console.log(`- http://localhost:${portApi1}/asistencias`);
    console.log(`- http://localhost:${portApi1}/feriados`);
    console.log(`- http://localhost:${portApi1}/horarios`);
    console.log('\nRutas disponibles para ACTUALIZAR (PUT) en API 1:');
    console.log(`- http://localhost:${portApi1}/profesores/:id`);
    console.log('\nRutas disponibles para ELIMINAR (DELETE) en API 1:');
    console.log(`- http://localhost:${portApi1}/profesores/:id`);
});




//-----------------------------------
//-----------------------------------
// --- INICIO DE  api3  ---
//-----------------------------------
//-----------------------------------
appApi3.listen(portApi3, () => {
    console.log(`\n=================================================`);
    console.log(`\n=================================================`);
    console.log(`\n=================================================`);
    console.log(`\n=================================================`);
    console.log(`[API 3 - Autenticación] Servidor escuchando en http://localhost:${portApi3}`);
    console.log(`[API 3 - Autenticación] (Rutas de Autenticación, Usuarios)`);
    console.log(`=================================================\n`);
    console.log(`\n=================================================`);


    console.log('--- Rutas Disponibles para API 3 ---');
    console.log(' ');

    // Rutas de Autenticación
    console.log(`Autenticación (Base URL: http://localhost:${portApi3}/api/auth):`);
    console.log('  - POST /login:       Iniciar sesión de usuario (body: {username, password})');
    console.log('  - POST /register:    Registrar un nuevo usuario (body: {username, password, rol})');
    console.log(' ');

    // Rutas de Usuarios
    console.log(`Gestión de Usuarios (Base URL: http://localhost:${portApi3}/api/users):`);
    console.log('  - GET /:             Obtener todos los usuarios (requiere token JWT, roles: admin, reportes)');
    console.log('  - PUT /:id:          Actualizar un usuario por ID (requiere token JWT, rol: admin, body: {username, rol, activo})');
    console.log('  - PATCH /:id/toggle-status: Cambiar estado activo/inactivo (requiere token JWT, rol: admin, body: {activo: boolean})');
    console.log('  - DELETE /:id:       Eliminar un usuario por ID (requiere token JWT, rol: admin)');
    console.log(' ');

    // Ruta de Prueba General
    console.log('Ruta de Prueba General:');
    console.log(`  - GET /:             Ruta de prueba del servidor API 3`);
    console.log(' ');
    console.log('-------------------------------------------------');
});


process.on('SIGINT', () => {
    console.log('\n[Servidor Principal] Señal SIGINT recibida. Apagando servidores...');
    process.exit(0);
});




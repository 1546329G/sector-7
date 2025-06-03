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

const portApi1 = process.env.PORT_API1 || process.env.PORT || 5009; // Intenta PORT_API1, luego PORT, luego 6001
const portApi3 = process.env.PORT_API3 || 5010; // Intenta PORT_API3, luego 6000

//-----------------------------------
//-----------------------------------
// --- INICIO DE LOS SERVIDORES ---
//-----------------------------------
//-----------------------------------

// Iniciar la API de Profesores/Asistencias (API 1)
appApi1.listen(portApi1, () => {
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


appApi3.listen(portApi3, () => {
    console.log(`\n=================================================`);
    console.log(`[API 3 - Autenticación] Servidor escuchando en http://localhost:${portApi3}`);
    console.log(`[API 3 - Autenticación] (Rutas de Autenticación, Usuarios)`);
    console.log(`=================================================\n`);
    // Puedes listar las rutas de API3 aquí si lo deseas
    console.log('Rutas disponibles para API 3 (Autenticación):');
    console.log(`- http://localhost:${portApi3}/api/auth/login`);
    console.log(`- http://localhost:${portApi3}/api/auth/register`);
    console.log(`- http://localhost:${portApi3}/ (Ruta de prueba)`);
});


process.on('SIGINT', () => {
    console.log('\n[Servidor Principal] Señal SIGINT recibida. Apagando servidores...');
    process.exit(0);
});
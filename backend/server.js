// backend/server.js
const appApi1 = require('./api1/app');
const appApi3 = require('./api3/src/app'); 

const portApi1 = process.env.PORT_API1 || 3001; // Puerto para la API de Profesores/Asistencias
const portApi3 = process.env.PORT_API3 || 3000; // Puerto para la API de Autenticación




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

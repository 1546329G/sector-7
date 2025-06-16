// backend/server.js

// 1. Cargar dotenv al inicio para que process.env esté disponible
import 'dotenv/config';

// 2. Importar tus aplicaciones de Express
import express from 'express'; // Keep this for the main app
import chalk from 'chalk'; // Import chalk for colors
import appApi1 from './api1/app.js';
import appApi3 from './api3/src/app.js';
import appApi2 from './api2/app.js'; 

// 3. Obtener los puertos de las variables de entorno
const portApi1 = process.env.PORT_API1 || process.env.PORT || 5009; // Intenta PORT_API1, luego PORT, luego 5009
const portApi3 = process.env.PORT_API3 || 5010; // Intenta PORT_API3, luego 5010
const portApi2 = process.env.PORT_API2 || 5011; // Intenta PORT_API2, luego 5011 (puerto para la nueva API)

// Iniciar la API de Profesores/Asistencias (API 1)
// Your original main Express app setup
import reporteRoutes from './routes/reporte.js';
import periodoRoutes from './routes/periodos.js';
import saveRoutes from './routes/save.js';
import cors from 'cors'


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:5173'
}));

app.get('/', (req, res) => {
    res.send('Hola!');
});

app.use(express.json());
app.use('/',reporteRoutes);
app.use('/',periodoRoutes);
app.use('/',saveRoutes);

app.listen(PORT, () => {
    console.log(chalk.blue(`\n=================================================`));
    console.log(chalk.blue(`[Servidor Principal General] Corriendo en puerto ${PORT}`));
    console.log(chalk.blue(`=================================================\n`));
});

//-----------------------------------
//-----------------------------------
// --- INICIO DE api1 ---
//-----------------------------------
//-----------------------------------
appApi1.listen(portApi1, () => {
    console.log(chalk.green(`\n=================================================`));
    console.log(chalk.green(`[API 1 - Principal] Servidor escuchando en http://localhost:${portApi1}`));
    console.log(chalk.green(`[API 1 - Principal] (Rutas de Profesores, Asistencias, Horarios, Feriados)`));
    console.log(chalk.green(`=================================================\n`));

    // Listar las rutas específicas de API1
    console.log(chalk.green('Rutas disponibles para EXTRAER (GET) en API 1:'));
    console.log(chalk.green(`- http://localhost:${portApi1}/profesores`));
    console.log(chalk.green(`- http://localhost:${portApi1}/profesores/buscar?q=...`));
    console.log(chalk.green(`- http://localhost:${portApi1}/profesores/:id`));
    console.log(chalk.green(`- http://localhost:${portApi1}/asistencias`));
    console.log(chalk.green(`- http://localhost:${portApi1}/horarios/profesor/:id_profesor`));
    console.log(chalk.green(`- http://localhost:${portApi1}/feriados`));
    console.log(chalk.green('\nRutas disponibles para INSERTAR (POST) en API 1:'));
    console.log(chalk.green(`- http://localhost:${portApi1}/profesores`));
    console.log(chalk.green(`- http://localhost:${portApi1}/asistencias`));
    console.log(chalk.green(`- http://localhost:${portApi1}/feriados`));
    console.log(chalk.green(`- http://localhost:${portApi1}/horarios`));
    console.log(chalk.green('\nRutas disponibles para ACTUALIZAR (PUT) en API 1:'));
    console.log(chalk.green(`- http://localhost:${portApi1}/profesores/:id`));
    console.log(chalk.green('\nRutas disponibles para ELIMINAR (DELETE) en API 1:'));
    console.log(chalk.green(`- http://localhost:${portApi1}/profesores/:id`));
});

//-----------------------------------
//-----------------------------------
// --- INICIO DE api2 ---
//-----------------------------------
//-----------------------------------
appApi2.listen(portApi2, () => {
    console.log(chalk.blue(`\n=================================================`)); // Changed from chalk.red to chalk.blue
    console.log(chalk.blue(`[API 2 - Horarios] Servidor escuchando en http://localhost:${portApi2}`)); // Changed from chalk.red to chalk.blue
    console.log(chalk.blue(`[API 2 - Horarios] (Rutas de Gestión de Horarios)`)); // Changed from chalk.red to chalk.blue
    console.log(chalk.blue(`=================================================\n`)); // Changed from chalk.red to chalk.blue

    // Listar las rutas específicas de API2
    console.log(chalk.blue('Rutas disponibles para EXTRAER (GET) en API 2:')); // Changed from chalk.red to chalk.blue
    console.log(chalk.blue(`- http://localhost:${portApi2}/api/horarios`)); // Changed from chalk.red to chalk.blue
    console.log(chalk.blue('\nRutas disponibles para INSERTAR (POST) en API 2:')); // Changed from chalk.red to chalk.blue
    console.log(chalk.blue(`- http://localhost:${portApi2}/api/horarios`)); // Changed from chalk.red to chalk.blue
    console.log(chalk.blue('\nRutas disponibles para ELIMINAR (DELETE) en API 2:')); // Changed from chalk.red to chalk.blue
    console.log(chalk.blue(`- http://localhost:${portApi2}/api/horarios/:id`)); // Changed from chalk.red to chalk.blue
});

//-----------------------------------
//-----------------------------------
// --- INICIO DE api3 ---
//-----------------------------------
//-----------------------------------
appApi3.listen(portApi3, () => {
    console.log(chalk.yellow(`\n=================================================`));
    console.log(chalk.yellow(`[API 3 - Autenticación] Servidor escuchando en http://localhost:${portApi3}`));
    console.log(chalk.yellow(`[API 3 - Autenticación] (Rutas de Autenticación, Usuarios)`));
    console.log(chalk.yellow(`=================================================\n`));

    // Listar las rutas específicas de API3
    console.log(chalk.yellow('--- Rutas Disponibles para API 3 ---'));
    console.log(chalk.yellow(`Autenticación (Base URL: http://localhost:${portApi3}/api/auth):`));
    console.log(chalk.yellow(' - POST /login:  Iniciar sesión de usuario (body: {username, password})'));
    console.log(chalk.yellow(' - POST /register: Registrar un nuevo usuario (body: {username, password, rol})'));
    console.log(chalk.yellow(' '));
    console.log(chalk.yellow(`Gestión de Usuarios (Base URL: http://localhost:${portApi3}/api/users):`));
    console.log(chalk.yellow(' - GET /:  Obtener todos los usuarios (requiere token JWT, roles: admin, reportes)'));
    console.log(chalk.yellow(' - PUT /:id: Actualizar un usuario por ID (requiere token JWT, rol: admin, body: {username, rol, activo})'));
    console.log(chalk.yellow(' - PATCH /:id/toggle-status: Cambiar estado activo/inactivo (requiere token JWT, rol: admin, body: {activo: boolean})'));
    console.log(chalk.yellow(' - DELETE /:id:  Eliminar un usuario por ID (requiere token JWT, rol: admin)'));
    console.log(chalk.yellow(' '));
    console.log(chalk.yellow('Ruta de Prueba General:'));
    console.log(chalk.yellow(` - GET /:  Ruta de prueba del servidor API 3`));
    console.log(chalk.yellow(' '));
    console.log(chalk.yellow('-------------------------------------------------'));
});

// Manejo de la señal SIGINT para cerrar el servidor
process.on('SIGINT', () => {
    console.log(chalk.magenta('\n[Servidor Principal] Señal SIGINT recibida. Apagando servidores...'));
    process.exit(0);
});
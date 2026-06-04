import './load-env.js';

import express from 'express';
import cors from 'cors';
import chalk from 'chalk';

import profesorRoutes from './routes/profesorRoutes.js';
import asistenciaRoutes from './routes/asistenciaRoutes.js';
import horarioFeriadoRoutes from './routes/horarioFeriadoRoutes.js';
import horariosRoutes from './routes/horario.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import reporteRoutes from './routes/reporte.js';
import periodoRoutes from './routes/periodos.js';
import saveRoutes from './routes/save.js';

import { getDatabasePool } from './db.js';

const app = express();
const PORT = process.env.PORT || 3044;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3044',
    'https://frontend-orpin-six-72.vercel.app'
  ]
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API Unificada Sector-7 funcionando!');
});

app.use(profesorRoutes);
app.use(asistenciaRoutes);
app.use(horarioFeriadoRoutes);
app.use('/api/horarios', horariosRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use(reporteRoutes);
app.use(periodoRoutes);
app.use(saveRoutes);

(async () => {
  try {
    await getDatabasePool();
    console.log(chalk.green('[DB] Conexión a la base de datos verificada.'));
  } catch (error) {
    console.error(chalk.red('[DB] Falló la verificación de conexión a la base de datos:'), error);
  }
})();

app.listen(PORT, () => {
  console.log(chalk.blue('\n================================================='));
  console.log(chalk.blue(`[Servidor Unificado] Corriendo en puerto ${PORT}`));
  console.log(chalk.blue('=================================================\n'));

  console.log(chalk.green('Rutas disponibles:'));
  console.log(chalk.green('  GET /  - Ruta de prueba'));
  console.log(chalk.green('  API 1 (Profesores, Asistencias, Horarios, Feriados):'));
  console.log(chalk.green('    GET/POST    /profesores'));
  console.log(chalk.green('    GET         /profesores/buscar?q=...'));
  console.log(chalk.green('    GET/PUT/DEL /profesores/:id'));
  console.log(chalk.green('    GET/POST    /asistencias'));
  console.log(chalk.green('    GET         /horarios/profesor/:id_profesor'));
  console.log(chalk.green('    POST        /horarios'));
  console.log(chalk.green('    GET/POST    /feriados'));
  console.log(chalk.green('  API 2 (Gestión de Horarios):'));
  console.log(chalk.green('    GET/POST    /api/horarios'));
  console.log(chalk.green('    DELETE      /api/horarios/:id'));
  console.log(chalk.green('  API 3 (Autenticación y Usuarios):'));
  console.log(chalk.green('    POST        /api/auth/login'));
  console.log(chalk.green('    POST        /api/auth/register'));
  console.log(chalk.green('    GET         /api/auth/protected'));
  console.log(chalk.green('    GET         /api/users'));
  console.log(chalk.green('    GET         /api/users/count'));
  console.log(chalk.green('    PUT         /api/users/:id'));
  console.log(chalk.green('    PATCH       /api/users/:id/toggle-status'));
  console.log(chalk.green('    DELETE      /api/users/:id'));
  console.log(chalk.green('  Reportes (General):'));
  console.log(chalk.green('    GET         /reporte-asistencia'));
  console.log(chalk.green('    GET         /reporte-asistencia/periodos'));
  console.log(chalk.green('    GET         /reporte-asistencia/semanas'));
  console.log(chalk.green('    POST        /reporte-asistencia/guardar'));
  console.log(chalk.green('    GET         /generar-informe'));
});

process.on('SIGINT', () => {
  console.log(chalk.magenta('\n[Servidor] Señal SIGINT recibida. Apagando servidor...'));
  process.exit(0);
});

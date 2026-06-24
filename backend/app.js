import express from 'express';
import cors from 'cors';

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

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3044',
  'https://frontend-orpin-six-72.vercel.app',
];

if (process.env.VERCEL_URL) {
  allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
}
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: allowedOrigins,
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
    console.log('[DB] Conexión a la base de datos verificada.');
  } catch (error) {
    console.error('[DB] Falló la verificación de conexión a la base de datos:', error);
  }
})();

export default app;

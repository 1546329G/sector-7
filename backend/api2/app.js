//archivo: app.js
// backend/api2/app.jss








import express from 'express';
import cors from 'cors';
import horariosRoutes from './routes/horario.js';

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/horarios', horariosRoutes); // Integrar las rutas de horarios


/*
app.listen(PORT, () => {
    console.log(`API 2 corriendo en http://localhost:${PORT}`);
});
*/

export default app;



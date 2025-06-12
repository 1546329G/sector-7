//archivo: app.js
// backend/api2/app.jss




// backend/api2/app.js (Modificado)

import express from 'express';
import cors from 'cors';
import horariosRoutes from './routes/horario.js'; // Importar las rutas de horarios

const app = express();
// No necesitas definir PORT aquí, ya que server.js lo manejará.
// const PORT = process.env.PORT_API2 || 3711; // <--- ELIMINA O COMENTA ESTA LÍNEA si no se usa para algo más aquí

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/horarios', horariosRoutes); // Integrar las rutas de horarios

// ¡IMPORTANTE! ELIMINA ESTE BLOQUE:
/*
app.listen(PORT, () => {
    console.log(`API 2 corriendo en http://localhost:${PORT}`);
});
*/

// Exportar la aplicación para que pueda ser utilizada en server.js
export default app; // Asegúrate de tener esta línea



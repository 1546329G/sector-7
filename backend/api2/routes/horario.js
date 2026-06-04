//api2/routes/horario.js

import express from 'express';
import { getHorarios, addHorario, deleteHorario } from '../controllers/horariosController.js'; // Asegúrate de que la ruta sea correcta

const router = express.Router();

// Obtener todos los horarios
router.get('/', getHorarios);

// Añadir un nuevo horario
router.post('/', addHorario);

// Eliminar un horario
router.delete('/:id', deleteHorario);
 
export default router;

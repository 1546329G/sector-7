import express from 'express';
import { getHorarios, addHorario, deleteHorario } from '../controllers/horariosController.js';

const router = express.Router();

router.get('/', getHorarios);

router.post('/', addHorario);

router.delete('/:id', deleteHorario);

export default router;

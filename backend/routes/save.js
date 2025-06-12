import express from 'express';
const router = express.Router();
import guardarAsistencia from '../services/guardarReporte.js';

router.post('/reporte-asistencia/guardar', async (req, res) => {
  try {
    const datos = req.body;

    if (!datos.id_profesor || !datos.fecha || !datos.horas) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const resultado = await guardarAsistencia(datos);
    res.status(200).json({ mensaje: 'Registro guardado correctamente', data: resultado });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar la asistencia' });
  }
});

export default router
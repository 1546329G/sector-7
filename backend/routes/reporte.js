import express from 'express';
import reporteProfesor from '../services/reporteProfesor.js';
import reporteSemana from '../services/reporteSemana.js';
import generarExcelAsistencia from '../services/genExcel.js';
import db from '../models/index.js';
import { Op } from 'sequelize';

const { getAsistenciaActual, getAsistenciaHistorica } = reporteProfesor;
const { getAsistenciaSemanaActual, getAsistenciaSemanaHistorico } = reporteSemana;
const router = express.Router();
const { Asistencia, Profesor, Horario } = db;

router.get('/reporte-asistencia', async (req, res) => {
  const { inicio, fin, modo, profesor_id } = req.query;
  try {
    let datos;

    if (!inicio || !fin || !modo) {
      return res.status(400).json({ error: 'Faltan parámetros obligatorios.' });
    }

    if (modo === 'actual') {
      datos = await getAsistenciaActual(inicio, fin, profesor_id);
    } else if (modo === 'historico') {
      datos = await getAsistenciaHistorica(inicio, fin, profesor_id);
    } else if (modo === 'periodo') {
      const registros = await Asistencia.count({
        where: {
          id_profesor: profesor_id,
          fecha: {
            [Op.between]: [inicio, fin]
          }
        }
      });

      if (registros > 0) {
        datos = await getAsistenciaHistorica(inicio, fin, profesor_id);
        datos.modo = 'historico';
      } else {
        datos = await getAsistenciaActual(inicio, fin, profesor_id);
        datos.modo = 'actual';
      }
    } else if (modo === 'semana_actual') {
      datos = await getAsistenciaSemanaActual(inicio, fin);
    } else if (modo === 'semana_historico') {
      datos = await getAsistenciaSemanaHistorico(inicio, fin);
    } else if (modo === 'semana') {
      const hayAsistencias = await Asistencia.count({
        where: {
          fecha: {
            [Op.between]: [inicio, fin]
          },
          ...(profesor_id && { id_profesor: profesor_id })
        }
      });

      if (hayAsistencias > 0) {
        datos = await getAsistenciaSemanaHistorico(inicio, fin);
      } else {
        datos = await getAsistenciaSemanaActual(inicio, fin);
      }
    } else {
      return res.status(400).json({ error: 'Modo inválido' });
    }

    res.json(datos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/generar-informe', async (req, res) => {
  const { inicio, fin } = req.query;
  if (!inicio || !fin) {
    return res.status(400).json({ error: 'Parámetros "inicio" y "fin" son obligatorios' });
  }
  try {
    let datos;
    datos = await generarExcelAsistencia(inicio, fin);
    res.json(datos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;

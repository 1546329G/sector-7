import express from 'express';
import db from '../models/index.js';
const router = express.Router();
const { Asistencia } = db;

import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat.js';
import es from 'dayjs/locale/es.js';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter.js';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js';

dayjs.extend(localizedFormat);
dayjs.locale(es);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

router.get('/reporte-asistencia/periodos', async (req, res) => {
  try {
    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

    const fechas = await Asistencia.findAll({
      attributes: [
        [Asistencia.sequelize.fn('MIN', Asistencia.sequelize.col('fecha')), 'minFecha'],
        [Asistencia.sequelize.fn('MAX', Asistencia.sequelize.col('fecha')), 'maxFecha'],
      ],
      raw: true,
    });

    const minFecha = dayjs(fechas[0].minFecha);
    const maxFecha = dayjs(fechas[0].maxFecha);

    if (!minFecha.isValid() || !maxFecha.isValid()) {
      return res.status(404).json({ error: 'No hay registros de asistencia' });
    }

    let inicio = minFecha.date() < 20
      ? minFecha.date(20)
      : minFecha.add(1, 'month').date(20);
    inicio = inicio.date(20);

    let fin = maxFecha.date() >= 20
      ? maxFecha.add(1, 'month').date(19)
      : maxFecha.date(19);

    const periodos = [];

    while (inicio.isBefore(fin) || inicio.isSame(fin)) {
      const finPeriodo = inicio.add(1, 'month').date(19);
      periodos.push({
        inicio: inicio.format('YYYY-MM-DD'),
        fin: finPeriodo.format('YYYY-MM-DD'),
        etiqueta: `${capitalize(inicio.format('MMM'))} - ${capitalize(finPeriodo.format('MMM'))} ${finPeriodo.format('YYYY')}`
      });

      inicio = inicio.add(1, 'month').date(20);
    }

    for (let i = 0; i < 6; i++) {
      const inicioFuturo = inicio;
      const finFuturo = inicioFuturo.add(1, 'month').date(19);
      periodos.push({
        inicio: inicioFuturo.format('YYYY-MM-DD'),
        fin: finFuturo.format('YYYY-MM-DD'),
        etiqueta: `${capitalize(inicioFuturo.format('MMM'))} - ${capitalize(finFuturo.format('MMM'))} ${finFuturo.format('YYYY')}`
      });

      inicio = inicio.add(1, 'month').date(20);
    }

    res.json(periodos);
  } catch (err) {
    console.error('Error generando períodos:', err);
    res.status(500).json({ error: 'Error generando períodos disponibles' });
  }
});

router.get('/reporte-asistencia/semanas', (req, res) => {
  const { periodo } = req.query;

  if (!periodo) {
    return res.status(400).json({ error: 'Falta el parámetro periodo' });
  }

  const [inicioStr, finStr] = periodo.split('_');
  const inicio = dayjs(inicioStr);
  const fin = dayjs(finStr);

  const semanas = [];
  let actual = inicio.startOf('week');
  let contador = 1;

  while (actual.isBefore(fin)) {
    const inicioSemana = actual;
    const finSemana = actual.endOf('week');

    if (finSemana.isAfter(inicio.subtract(1, 'day')) && inicioSemana.isBefore(fin.add(1, 'day'))) {
      semanas.push({
        nombre: `Semana ${contador}`,
        inicio: inicioSemana.format('YYYY-MM-DD'),
        fin: finSemana.format('YYYY-MM-DD')
      });
      contador++;
    }

    actual = actual.add(1, 'week');
  }

  res.json(semanas);
});

export default router;

import db from '../models/index.js';
import { Op } from 'sequelize';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat.js';
import es from 'dayjs/locale/es.js';
import isoWeek from 'dayjs/plugin/isoWeek.js';
import duration from 'dayjs/plugin/duration.js';

const { Asistencia, Profesor, Horario } = db;

dayjs.extend(localizedFormat);
dayjs.locale(es);
dayjs.extend(isoWeek);
dayjs.extend(duration);



// funciones auxiliares para obtener JSON estructurado
function agruparEnSemanas(dias) {
  const semanas = [];
  const agrupadas = {};

  dias.forEach(d => {
    const inicio = d.startOf('isoWeek');
    const fin = d.endOf('isoWeek');
    const key = `${inicio.format('YYYY-MM-DD')}|${fin.format('YYYY-MM-DD')}`;
    if (!agrupadas[key]) agrupadas[key] = [];
    agrupadas[key].push(d);
  });

  let contador = 1;
  for (const key in agrupadas) {
    const [inicio, fin] = key.split('|');
    semanas.push({
      semana: `Semana ${contador++}`,
      inicio,
      fin,
      dias: agrupadas[key]
    });
  }

  return semanas;
}

function convertirHorasAMinutos(horasStr) {
  const [h, m] = horasStr.split(':').map(Number);
  return h * 60 + m;
}

function formatoHoras(minutos) {
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  return `${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// Obtener reporte de lo ya guardado en BD
async function getAsistenciaHistorica(inicio, fin, profesorId) {
  const where = {
    fecha: {
      [Op.between]: [inicio, fin]
    }
  };
  if (profesorId) where.id_profesor = profesorId;

  const asistencias = await Asistencia.findAll({
    where,
    include: [{
      model: Profesor,
      attributes: ['id', 'nombre', 'horas_segun_contrato']
    }],
    order: [['fecha', 'ASC']]
  });

  // Generar rango de días
  const dias = [];
  let cursor = dayjs(inicio);
  const limite = dayjs(fin);
  while (cursor.isSameOrBefore(limite)) {
    dias.push(cursor);
    cursor = cursor.add(1, 'day');
  }

  const semanas = agruparEnSemanas(dias);
  const semanas_disponibles = semanas.map(({ semana, inicio, fin }) => ({
    semana, inicio, fin
  }));

  // Agrupar asistencias por profesor
  const porProfesor = {};

  asistencias.forEach(a => {
    const id = a.id_profesor;
    if (!porProfesor[id]) {
      porProfesor[id] = {
        id_profesor: id,
        nombre: a.Profesor.nombre,
        horas_contrato: a.Profesor.horas_segun_contrato,
        asistencias: []
      };
    }

    porProfesor[id].asistencias.push({
      fecha: a.fecha,
      minutos: convertirHorasAMinutos(a.horas)
    });
  });

  // Armar reporte estructurado por semanas
  const datos = Object.values(porProfesor).map(p => {
    let totalMes = 0;

    const semanasData = semanas.map(({ semana, inicio, fin, dias }) => {
      let totalSemana = 0;
      const diasData = [];

      dias.forEach(d => {
        const fecha = d.format('YYYY-MM-DD');
        const asistencia = p.asistencias.find(a => a.fecha === fecha);
        if (asistencia) {
          diasData.push({
            fecha,
            horas: formatoHoras(asistencia.minutos)
          });
          totalSemana += asistencia.minutos;
        }
      });

      totalMes += totalSemana;

      return {
        semana,
        inicio,
        fin,
        dias: diasData,
        total_semana: formatoHoras(totalSemana)
      };
    });

    return {
      id_profesor: p.id_profesor,
      nombre: p.nombre,
      horas_contrato: p.horas_contrato,
      semanas: semanasData,
      total_mes: formatoHoras(totalMes)
    };
  });

  return {
    datos
  };
}

//Obtener el reporte calculando horarios
async function getAsistenciaActual(inicio, fin, profesorId) {
  const where = {};
  if (profesorId) where.id = profesorId;

  const profesores = await Profesor.findAll({
    where,
    include: [{ model: Horario }]
  });

  const dias = [];
  let cursor = dayjs(inicio);
  const limite = dayjs(fin);

  while (cursor.isBefore(limite) || cursor.isSame(limite)) {
    dias.push(cursor);
    cursor = cursor.add(1, 'day');
  }

  const semanas = agruparEnSemanas(dias);

  const semanas_disponibles = semanas.map(({ semana, inicio, fin }) => ({
    semana, inicio, fin
  }));

  const datos = profesores.map(prof => {
    let totalMes = 0;

    const semanasData = semanas.map(({ semana, inicio, fin, dias }) => {
      const diasData = [];
      let totalSemana = 0;

      dias.forEach(d => {
        const dia = d.format('dddd').toLowerCase();
        const horario = prof.Horarios.find(h => h.dia_semana === dia);

        if (horario) {
          const entrada = dayjs(`${d.format('YYYY-MM-DD')}T${horario.hora_entrada}`);
          const salida = dayjs(`${d.format('YYYY-MM-DD')}T${horario.hora_salida}`);
          const duracion = salida.diff(entrada, 'minute');
          totalSemana += duracion;
          diasData.push({
            fecha: d.format('YYYY-MM-DD'),
            horas: formatoHoras(duracion)
          });
        }
      });

      totalMes += totalSemana;

      return {
        semana,
        inicio,
        fin,
        dias: diasData,
        total_semana: formatoHoras(totalSemana)
      };
    });

    return {
      id_profesor: prof.id,
      nombre: prof.nombre,
      horas_contrato: prof.horas_segun_contrato,
      semanas: semanasData,
      total_mes: formatoHoras(totalMes)
    };
  });

  return {
    datos
  };
}

export default {
  getAsistenciaActual,
  getAsistenciaHistorica
}
import dayjs from 'dayjs';
import db from '../models/index.js';
const { Profesor, Asistencia } = db;
import { Op } from 'sequelize';

const diasSemana = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function obtenerNombreDia(fecha) {
  const day = dayjs(fecha).day();
  return diasSemana[(day + 6) % 7];
}

function sumarHoras(horasArray) {
  let totalMin = 0;
  for (const h of horasArray) {
    if (!h) continue;
    const [hh, mm] = h.split(':').map(Number);
    totalMin += hh * 60 + mm;
  }
  const horas = Math.floor(totalMin / 60).toString().padStart(2, '0');
  const minutos = (totalMin % 60).toString().padStart(2, '0');
  return `${horas}:${minutos}`;
}

async function generarExcelAsistencia(inicio, fin) {
  const profesores = await Profesor.findAll();
  const asistencias = await Asistencia.findAll({
    where: {
      fecha: {
        [Op.between]: [inicio, fin]
      }
    }
  });

  const semanas = [];
  let actual = dayjs(inicio).startOf('week');
  while (actual.isBefore(fin)) {
    const inicioSemana = actual;
    const finSemana = actual.endOf('week');
    semanas.push({
      nombre: `Semana ${semanas.length + 1}`,
      inicio: inicioSemana.format('YYYY-MM-DD'),
      fin: finSemana.format('YYYY-MM-DD')
    });
    actual = actual.add(1, 'week');
  }

  const resultado = [];

  for (const prof of profesores) {
    const data = {
      id: prof.id,
      nombre: prof.nombre,
      horas_contrato: prof.horas_contrato || '0',
      semanas: {},
      total_horas: '00:00',
      tardanzas: 0,
      horas_a_ingresar: '00:00'
    };

    let totalHorasPeriodo = [];

    for (const semana of semanas) {
      const dias = {
        L: null, M: null, X: null, J: null, V: null, S: null, D: null
      };

      const registros = asistencias.filter(a =>
        a.id_profesor === prof.id &&
        dayjs(a.fecha).isBetween(semana.inicio, semana.fin, 'day', '[]')
      );

      for (const r of registros) {
        const dia = obtenerNombreDia(r.fecha);
        dias[dia] = r.horas;
      }

      const totalSemana = sumarHoras(Object.values(dias));
      data.semanas[semana.nombre] = {
        ...dias,
        total: totalSemana
      };
      totalHorasPeriodo.push(totalSemana);
    }

    data.total_horas = sumarHoras(totalHorasPeriodo);
    data.horas_a_ingresar = data.total_horas;

    resultado.push(data);
  }

  return resultado;
}

export default generarExcelAsistencia;

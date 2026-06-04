import db from '../models/index.js';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

const { Asistencia } = db;

async function guardarAsistencia(datos) {
  const { id_profesor, fecha, horas, tardanza, justificacion } = datos;

  const [registro, creado] = await Asistencia.findOrCreate({
    where: {
      id_profesor,
      fecha
    },
    defaults: {
      id: uuidv4(),
      horas,
      tardanza,
      justificacion,
      estado: 'A',
      fecha_registro: dayjs().toDate(),
      fecha_modificacion: dayjs().toDate()
    }
  });

  if (!creado) {
    registro.horas = horas;
    registro.tardanza = tardanza;
    registro.justificacion = justificacion;
    registro.fecha_modificacion = dayjs().toDate();
    await registro.save();
  }

  return registro;
}

export default guardarAsistencia;

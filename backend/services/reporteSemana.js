import db from '../models/index.js';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat.js';
import es from 'dayjs/locale/es.js';
import isBetween from 'dayjs/plugin/isBetween.js';
import duration from 'dayjs/plugin/duration.js';
import { Op } from 'sequelize';


const { Asistencia, Profesor, Horario } = db;

dayjs.extend(localizedFormat);
dayjs.locale(es);
dayjs.extend(isBetween);
dayjs.extend(duration);


// utilidad para sumar horas como strings "HH:mm"||Funcion de utilidad
function sumarHoras(arrayHoras) {
    let total = dayjs.duration();
    arrayHoras.forEach(h => {
        const [horas, minutos] = h.split(':').map(Number);
        total = total.add(dayjs.duration({ hours: horas, minutes: minutos }));
    });
    const h = String(Math.floor(total.asHours())).padStart(2, '0');
    const m = String(total.minutes()).padStart(2, '0');
    return `${h}:${m}`;
}

// genera las semanas dentro de un periodo (del 20 al 19 del siguiente mes)||Funcion de utilidad
function generarSemanasDelPeriodo(inicioPeriodo, finPeriodo) {
    const semanas = [];
    let actual = inicioPeriodo.clone().startOf('week');
    let contador = 1;

    while (actual.isBefore(finPeriodo)) {
        const inicio = actual;
        const fin = actual.endOf('week');
        semanas.push({
            nombre: `Semana ${contador++}`,
            inicio: inicio.format('YYYY-MM-DD'),
            fin: fin.format('YYYY-MM-DD')
        });
        actual = actual.add(1, 'week');
    }

    return semanas.filter(sem =>
        dayjs(sem.inicio).isBetween(inicioPeriodo.clone().subtract(1, 'day'), finPeriodo.clone().add(1, 'day'), null, '[]')
    );

}

async function getAsistenciaSemanaActual(inicio, fin) {
    const fechaInicio = dayjs(inicio);
    const fechaFin = dayjs(fin);

    const periodoInicio = fechaInicio.date() >= 20 ? fechaInicio.clone().date(20) : fechaInicio.clone().subtract(1, 'month').date(20);
    const periodoFin = periodoInicio.clone().add(1, 'month').date(19);

    const semanasPeriodo = generarSemanasDelPeriodo(periodoInicio, periodoFin);

    const semanaSeleccionada = semanasPeriodo.find(s =>
        s.inicio === fechaInicio.format('YYYY-MM-DD') && s.fin === fechaFin.format('YYYY-MM-DD')
    ) || {
        nombre: 'Fuera de período',
        inicio: fechaInicio.format('YYYY-MM-DD'),
        fin: fechaFin.format('YYYY-MM-DD'),
        numero: null
    };


    const profesores = await Profesor.findAll({
        include: [{ model: Horario }]
    });

    const datos = profesores.map(profesor => {
        const dias = [];
        const horasPorDia = [];

        for (let d = 0; d < 7; d++) {
            const fechaDia = fechaInicio.add(d, 'day');
            if (fechaDia.isAfter(fechaFin)) break;

            const nombreDia = fechaDia.format('dddd').toLowerCase(); // ej. 'monday'
            const horariosDia = profesor.Horarios.filter(h => h.dia_semana.toLowerCase() === nombreDia);

            const horas = horariosDia.map(h => {
                const entrada = dayjs(`2000-01-01T${h.hora_entrada}`);
                const salida = dayjs(`2000-01-01T${h.hora_salida}`);
                return dayjs.duration(salida.diff(entrada));
            });

            const totalDuracion = horas.reduce((acc, h) => acc.add(h), dayjs.duration());
            const horasStr = `${String(Math.floor(totalDuracion.asHours())).padStart(2, '0')}:${String(totalDuracion.minutes()).padStart(2, '0')}`;

            horasPorDia.push(horasStr);
            dias.push({ fecha: fechaDia.format('YYYY-MM-DD'), horas: horasStr });
        }

        return {
            id_profesor: profesor.id,
            nombre: profesor.nombre,
            horas_contrato: profesor.horas_segun_contrato,
            dias,
            total_semana: sumarHoras(horasPorDia)
        };
    });

    return {
        semana: semanaSeleccionada,
        datos
    };
}

async function getAsistenciaSemanaHistorico(inicio, fin) {
    const fechaInicio = dayjs(inicio);
    const fechaFin = dayjs(fin);

    const periodoInicio = fechaInicio.date() >= 20 ? fechaInicio.date(20) : fechaInicio.subtract(1, 'month').date(20);
    const periodoFin = periodoInicio.add(1, 'month').date(19);
    const semanasPeriodo = generarSemanasDelPeriodo(periodoInicio, periodoFin);

    const semanaSeleccionada = semanasPeriodo.find(s => s.inicio === fechaInicio.format('YYYY-MM-DD') && s.fin === fechaFin.format('YYYY-MM-DD')) || {
        nombre: `Semana seleccionada`,
        inicio: fechaInicio.format('YYYY-MM-DD'),
        fin: fechaFin.format('YYYY-MM-DD')
    };

    if (!semanaSeleccionada.numero) {
        const index = semanasPeriodo.findIndex(s => s.inicio === semanaSeleccionada.inicio && s.fin === semanaSeleccionada.fin);
        if (index !== -1) semanaSeleccionada.nombre = `Semana ${index + 1}`;
    }

    const asistencias = await Asistencia.findAll({
        where: {
            fecha: {
                [Op.between]: [inicio, fin]

            }
        },
        include: [{ model: Profesor }]
    });

    const profesoresMap = {};

    asistencias.forEach(a => {
        const id = a.id_profesor;
        if (!profesoresMap[id]) {
            profesoresMap[id] = {
                id_profesor: id,
                nombre: a.Profesor.nombre,
                horas_contrato: a.Profesor.horas_contrato,
                dias: [],
                horasTotales: []
            };
        }
        profesoresMap[id].dias.push({
            fecha: dayjs(a.fecha).format('YYYY-MM-DD'),
            horas: a.horas || '00:00'
        });
        profesoresMap[id].horasTotales.push(a.horas || '00:00');
    });

    const datos = Object.values(profesoresMap).map(p => ({
        id_profesor: p.id_profesor,
        nombre: p.nombre,
        horas_contrato: p.horas_contrato,
        dias: p.dias,
        total_semana: sumarHoras(p.horasTotales)
    }));

    return {
        semana: semanaSeleccionada,
        datos
    };
}

export default { getAsistenciaSemanaActual, getAsistenciaSemanaHistorico }
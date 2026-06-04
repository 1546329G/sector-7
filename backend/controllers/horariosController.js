import { getDatabasePool } from '../db.js';

export const getHorarios = async (req, res) => {
    const db = await getDatabasePool();
    try {
        const [results] = await db.query('SELECT * FROM horario WHERE estado = "Activo"');
        res.json(results);
    } catch (err) {
        console.error('Error al obtener horarios:', err);
        return res.status(500).json({ message: 'Error al obtener horarios' });
    }
};

export const addHorario = async (req, res) => {
    const { id_profesor, dia_semana, hora_entrada, hora_salida, aula } = req.body;

    if (!id_profesor || !dia_semana || !hora_entrada || !hora_salida || !aula) {
        console.warn('Error de validación: Faltan campos obligatorios para añadir horario.');
        return res.status(400).json({ message: 'Todos los campos son obligatorios (profesor, día, hora inicio, hora fin, aula).' });
    }

    const prefix = 'HR';
    const timestampEnd = Date.now().toString().slice(-5);
    const randomChars = Math.random().toString(36).substr(2, 3).toUpperCase();

    const generatedId = `${prefix}${timestampEnd}${randomChars}`;

    const newHorario = {
        id: generatedId,
        id_profesor: id_profesor,
        dia_semana: dia_semana,
        hora_entrada: hora_entrada,
        hora_salida: hora_salida,
        aula: aula,
        estado: 'Activo',
        fecha_registro: new Date(),
        fecha_modificacion: new Date(),
    };

    const db = await getDatabasePool();
    try {
        const [profesorCheck] = await db.query('SELECT id FROM profesor WHERE id = ?', [id_profesor]);
        if (profesorCheck.length === 0) {
            console.warn(`Profesor con ID ${id_profesor} no encontrado en la base de datos.`);
            return res.status(400).json({ message: 'El ID de profesor especificado no existe.' });
        }
        const [conflictCheck] = await db.query(
            `SELECT * FROM horario
             WHERE dia_semana = ?
               AND (
                   (id_profesor = ? AND (
                       (hora_entrada < ? AND hora_salida > ?) OR
                       (hora_entrada >= ? AND hora_entrada < ?) OR
                       (hora_salida > ? AND hora_salida <= ?) OR
                       (hora_entrada = ? AND hora_salida = ?)
                   ))
                   OR
                   (aula = ? AND (
                       (hora_entrada < ? AND hora_salida > ?) OR
                       (hora_entrada >= ? AND hora_entrada < ?) OR
                       (hora_salida > ? AND hora_salida <= ?) OR
                       (hora_entrada = ? AND hora_salida = ?)
                   ))
               )`,
            [
                dia_semana,
                id_profesor, hora_salida, hora_entrada, hora_entrada, hora_salida, hora_entrada, hora_salida, hora_entrada, hora_salida,
                aula, hora_salida, hora_entrada, hora_entrada, hora_salida, hora_entrada, hora_salida, hora_entrada, hora_salida
            ]
        );

        if (conflictCheck.length > 0) {
            console.warn('Conflicto de horario detectado:', conflictCheck);
            return res.status(409).json({ message: 'Conflicto de horario. El profesor o el aula ya están ocupados en el horario especificado.' });
        }

        await db.query('INSERT INTO horario SET ?', newHorario);
        res.status(201).json(newHorario);

    } catch (err) {
        console.error('Error FATAL al añadir horario:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Error de entrada duplicada. Posiblemente un ID de horario ya existe.' });
        }
        if (err.code === 'ER_BAD_FIELD_ERROR') {
            return res.status(500).json({ message: `Error de columna en la base de datos: ${err.sqlMessage}.` });
        }
        return res.status(500).json({ message: 'Error interno del servidor al añadir horario.' });
    }
};

export const deleteHorario = async (req, res) => {
    const { id } = req.params;
    const db = await getDatabasePool();
    try {
        const [results] = await db.query('DELETE FROM horario WHERE id = ?', [id]);
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Horario no encontrado' });
        }
        res.status(204).send();
    } catch (err) {
        console.error('Error al eliminar horario:', err);
        return res.status(500).json({ message: 'Error al eliminar horario' });
    }
};

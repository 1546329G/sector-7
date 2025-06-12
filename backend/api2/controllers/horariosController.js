// Controlador para manejar las operaciones de horarios
// backend/api2/controllers/horariosController.js



import { getDatabasePool } from '../../db.js'; // Asegúrate de que la ruta sea correcta

// Obtener todos los horarios
export const getHorarios = async (req, res) => {
    const db = await getDatabasePool();
    try {
        const [results] = await db.query('SELECT * FROM horario WHERE estado = "Activo"');
        res.json(results);
    } catch (err) {
        return res.status(500).json({ message: 'Error al obtener horarios' });
    }
};

// Añadir un nuevo horario
export const addHorario = async (req, res) => {
    const { profesor_id, dia_semana, hora_inicio, hora_fin, aula } = req.body;
    const newHorario = {
        id: `HORA${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        id_profesor: profesor_id,
        dia_semana,
        hora_entrada: hora_inicio,
        hora_salida: hora_fin,
        aula,
        estado: 'Activo',
        fecha_registro: new Date(),
        fecha_modificacion: new Date(),
    };

    const db = await getDatabasePool();
    try {
        await db.query('INSERT INTO horario SET ?', newHorario);
        res.status(201).json(newHorario);
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Conflicto de horario. El profesor o el aula ya están ocupados en ese lapso.' });
        }
        return res.status(500).json({ message: 'Error al añadir horario' });
    }
};

// Eliminar un horario
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
        return res.status(500).json({ message: 'Error al eliminar horario' });
    }
};

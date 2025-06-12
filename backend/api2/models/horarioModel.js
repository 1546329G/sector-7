//archivo: backend/api2/models/horarioModel.js
// backend/api2/models/horarioModel.js









import { getDatabasePool } from '../../db.js'; // Asegúrate de que la ruta sea correcta

const HorarioModel = {
    getAll: async () => {
        const db = await getDatabasePool();
        const [results] = await db.query('SELECT * FROM horario WHERE estado = "Activo"');
        return results;
    },
    add: async (newHorario) => {
        const db = await getDatabasePool();
        await db.query('INSERT INTO horario SET ?', newHorario);
        return newHorario;
    },
    delete: async (id) => {
        const db = await getDatabasePool();
        const [results] = await db.query('DELETE FROM horario WHERE id = ?', [id]);
        if (results.affectedRows === 0) throw new Error('Horario no encontrado');
    },
};

export default HorarioModel;

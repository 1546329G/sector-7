// backend/routes/asistenciaRoutes.js (AHORA SÍ CON EXPORTACIÓN CORRECTA)

import express from 'express';
import { getDatabasePool } from '../../db.js'; // Asegúrate del .js al final
const router = express.Router();

let dbPool;
(async () => {
    try {
        dbPool = await getDatabasePool();
    } catch (error) {
        console.error('No se pudo establecer la conexión a la base de datos para las rutas de asistencias. Terminando...', error);
        process.exit(1);
    }
})();

// ----------------------------------------------------------------
// RUTAS DE ASISTENCIAS
// ----------------------------------------------------------------

// Ruta para obtener todas las asistencias con detalles del profesor (JOIN)
router.get('/asistencias', async (req, res) => {
    if (!dbPool) { return res.status(500).json({ message: 'Error: La conexión a la base de datos no está establecida.' }); }
    let connection;
    try {
        connection = await dbPool.getConnection();
        const query = `
            SELECT
                a.id,
                a.fecha,
                a.horas,
                a.tardanza,
                a.justificacion,
                a.estado,
                p.nombre AS nombre_profesor,
                p.id AS id_profesor
            FROM asistencia a
            JOIN profesor p ON a.id_profesor = p.id
            ORDER BY a.fecha DESC;
        `;
        const [rows] = await connection.execute(query);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener asistencias:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener asistencias.' });
    } finally {
        if (connection) connection.release();
    }
});

// Ruta para insertar una nueva asistencia
router.post('/asistencias', async (req, res) => {
    if (!dbPool) { return res.status(500).json({ message: 'Error: La conexión a la base de datos no está establecida.' }); }
    const { id, fecha, horas, tardanza, justificacion, estado } = req.body;
    const fecha_registro = new Date().toISOString().slice(0, 10);
    const fecha_modificacion = fecha_registro;

    if (!id || !fecha || !horas) {
        return res.status(400).json({ message: 'ID, Fecha y Horas de asistencia son obligatorios.' });
    }

    let connection;
    try {
        connection = await dbPool.getConnection();
        const [result] = await connection.execute(
            'INSERT INTO asistencia (id, fecha, horas, tardanza, justificacion, estado, fecha_registro, fecha_modificacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, fecha, horas, tardanza, justificacion, estado, fecha_registro, fecha_modificacion]
        );
        res.status(201).json({ message: 'Asistencia registrada con éxito', id: id, affectedRows: result.affectedRows });
    } catch (error) {
        console.error('Error al registrar asistencia:', error);
        if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_NO_REFERENCED_ROW') {
            return res.status(400).json({ message: 'Error: El ID del profesor no existe.', error: error.message });
        }
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Error: La ID de asistencia ya existe.', error: error.message });
        }
        res.status(500).json({ message: 'Error interno del servidor al registrar asistencia.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

export default router; // <-- ¡ESTO ES LO QUE DEBE CAMBIAR!
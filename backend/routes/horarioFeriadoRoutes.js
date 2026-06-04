import express from 'express';
import { getDatabasePool } from '../db.js';

const router = express.Router();

let dbPool;
(async () => {
    try {
        dbPool = await getDatabasePool();
    } catch (error) {
        console.error('No se pudo establecer la conexión a la base de datos para las rutas de horarios/feriados. Terminando...', error);
        process.exit(1);
    }
})();

router.get('/horarios/profesor/:id_profesor', async (req, res) => {
    if (!dbPool) { return res.status(500).json({ message: 'Error: La conexión a la base de datos no está establecida.' }); }
    const { id_profesor } = req.params;
    let connection;
    try {
        connection = await dbPool.getConnection();
        const [rows] = await connection.execute('SELECT * FROM horario WHERE id_profesor = ? ORDER BY hora_entrada', [id_profesor]);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener horarios del profesor:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener horarios.' });
    } finally {
        if (connection) connection.release();
    }
});

router.get('/feriados', async (req, res) => {
    if (!dbPool) { return res.status(500).json({ message: 'Error: La conexión a la base de datos no está establecida.' }); }
    let connection;
    try {
        connection = await dbPool.getConnection();
        const [rows] = await connection.execute('SELECT * FROM feriados ORDER BY fecha ASC');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener feriados:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener feriados.' });
    } finally {
        if (connection) connection.release();
    }
});

router.post('/feriados', async (req, res) => {
    if (!dbPool) { return res.status(500).json({ message: 'Error: La conexión a la base de datos no está establecida.' }); }
    const { id, fecha, descripcion, estado } = req.body;
    const fecha_registro = new Date().toISOString().slice(0, 10);
    const fecha_modificacion = fecha_registro;

    if (!id || !fecha || !descripcion) {
        return res.status(400).json({ message: 'ID, Fecha y Descripción del feriado son obligatorios.' });
    }

    let connection;
    try {
        connection = await dbPool.getConnection();
        const [result] = await connection.execute(
            'INSERT INTO feriados (id, fecha, descripcion, estado, fecha_registro, fecha_modificacion) VALUES (?, ?, ?, ?, ?, ?)',
            [id, fecha, descripcion, estado, fecha_registro, fecha_modificacion]
        );
        res.status(201).json({ message: 'Feriado insertado con éxito', id: id, affectedRows: result.affectedRows });
    } catch (error) {
        console.error('Error al insertar feriado:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Error: La ID del feriado ya existe.', error: error.message });
        }
        res.status(500).json({ message: 'Error interno del servidor al insertar feriado.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

router.post('/horarios', async (req, res) => {
    if (!dbPool) { return res.status(500).json({ message: 'Error: La conexión a la base de datos no está establecida.' }); }
    const { id, id_profesor, hora_entrada, hora_salida, estado } = req.body;
    const fecha_registro = new Date().toISOString().slice(0, 10);
    const fecha_modificacion = fecha_registro;

    if (!id || !id_profesor || !hora_entrada || !hora_salida) {
        return res.status(400).json({ message: 'ID, ID Profesor, Hora de Entrada y Hora de Salida son obligatorios.' });
    }

    let connection;
    try {
        connection = await dbPool.getConnection();
        const [result] = await connection.execute(
            'INSERT INTO horario (id, id_profesor, hora_entrada, hora_salida, estado, fecha_registro, fecha_modificacion) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, id_profesor, hora_entrada, hora_salida, estado, fecha_registro, fecha_modificacion]
        );
        res.status(201).json({ message: 'Horario insertado con éxito', id: id, affectedRows: result.affectedRows });
    } catch (error) {
        console.error('Error al insertar horario:', error);
        if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_NO_REFERENCED_ROW') {
            return res.status(400).json({ message: 'Error: El ID del profesor no existe.', error: error.message });
        }
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Error: La ID de horario ya existe.', error: error.message });
        }
        res.status(500).json({ message: 'Error interno del servidor al insertar horario.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

export default router;

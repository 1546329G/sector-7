// backend/routes/profesorRoutes.js (AHORA SÍ CON EXPORTACIÓN CORRECTA)

import express from 'express';
// Asegúrate de que la ruta a db.js es correcta desde la ubicación de este archivo.
// Si este archivo está en backend/api1/routes/, y db.js está en backend/, la ruta es '../../../db.js'.
// Si este archivo está en backend/routes/, y db.js está en backend/, la ruta es '../../db.js'.
// Basado en los errores anteriores, la ruta '../../../db.js' en db.js dentro de horarioFeriadoRoutes.js no funcionaba.
// El error más reciente de db.js era 'backend/db', lo que sugiere que '../../db.js' es la correcta para ir desde
// 'backend/api1/routes/' a 'backend/db.js'. ¡Así que la ruta actual '../../db.js' aquí es PROBABLEMENTE CORRECTA!
import { getDatabasePool } from '../../db.js'; // Esta ruta debería ser correcta si db.js está en backend/db.js

const router = express.Router(); // Usa el Router de Express

// Función para obtener el pool de conexiones (se inicializará una vez)
let dbPool;
(async () => {
    try {
        dbPool = await getDatabasePool();
    } catch (error) {
        console.error('No se pudo establecer la conexión a la base de datos para las rutas de profesores. Terminando...', error);
        process.exit(1);
    }
})();


// ----------------------------------------------------------------
// RUTAS DE PROFESORES
// ----------------------------------------------------------------

// Ruta para obtener todos los profesores
router.get('/profesores', async (req, res) => {
    if (!dbPool) { return res.status(500).json({ message: 'Error: La conexión a la base de datos no está establecida.' }); }
    let connection;
    try {
        connection = await dbPool.getConnection();
        const [rows] = await connection.execute('SELECT id, nombre, horas_segun_contrato, estado, id_institucional, fecha_registro, fecha_modificacion FROM profesor');
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener profesores:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener profesores.' });
    } finally {
        if (connection) connection.release();
    }
});

// Ruta para buscar profesores por ID o nombre
router.get('/profesores/buscar', async (req, res) => {
    if (!dbPool) { return res.status(500).json({ message: 'Error: La conexión a la base de datos no está establecida.' }); }
    const searchTerm = req.query.q;

    if (!searchTerm) {
        return res.status(400).json({ message: 'El término de búsqueda (q) es requerido.' });
    }

    let connection;
    try {
        connection = await dbPool.getConnection();
        const [rows] = await connection.execute(
            `SELECT id, nombre, horas_segun_contrato, estado, id_institucional, fecha_registro, fecha_modificacion FROM profesor
             WHERE id = ? OR nombre LIKE ? OR id_institucional LIKE ?`,
            [searchTerm, `%${searchTerm}%`, `%${searchTerm}%`]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'No se encontraron profesores con ese término de búsqueda.' });
        }

        res.json(rows);
    } catch (error) {
        console.error('Error al buscar profesores:', error);
        res.status(500).json({ message: 'Error interno del servidor al buscar profesores.' });
    } finally {
        if (connection) connection.release();
    }
});

// Ruta para obtener un profesor por ID
router.get('/profesores/:id', async (req, res) => {
    if (!dbPool) { return res.status(500).json({ message: 'Error: La conexión a la base de datos no está establecida.' }); }
    const { id } = req.params;
    let connection;
    try {
        connection = await dbPool.getConnection();
        const [rows] = await connection.execute('SELECT id, nombre, horas_segun_contrato, estado, id_institucional, fecha_registro, fecha_modificacion FROM profesor WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Profesor no encontrado.' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error al obtener profesor por ID:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener profesor.' });
    } finally {
        if (connection) connection.release();
    }
});

// Ruta para insertar un nuevo profesor
router.post('/profesores', async (req, res) => {
    if (!dbPool) { return res.status(500).json({ message: 'Error: La conexión a la base de datos no está establecida.' }); }
    const { nombre, horas_segun_contrato, estado, id_institucional } = req.body;
    const fecha_registro = new Date().toISOString().slice(0, 10);
    const fecha_modificacion = fecha_registro;

    if (!nombre || !id_institucional) {
        return res.status(400).json({ message: 'El nombre y el ID Institucional del profesor son obligatorios.' });
    }

    let connection;
    try {
        connection = await dbPool.getConnection();
        const [result] = await connection.execute(
            'INSERT INTO profesor (nombre, horas_segun_contrato, estado, id_institucional, fecha_registro, fecha_modificacion) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, horas_segun_contrato, estado, id_institucional, fecha_registro, fecha_modificacion]
        );
        res.status(201).json({ message: 'Profesor insertado con éxito', id: result.insertId, affectedRows: result.affectedRows });
    } catch (error) {
        console.error('Error al insertar profesor:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Error: El ID Institucional ya existe o hay un valor duplicado.', error: error.message });
        }
        res.status(500).json({ message: 'Error interno del servidor al insertar profesor.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

// Ruta para actualizar un profesor
router.put('/profesores/:id', async (req, res) => {
    if (!dbPool) { return res.status(500).json({ message: 'Error: La conexión a la base de datos no está establecida.' }); }
    const { id } = req.params;
    const { nombre, horas_segun_contrato, estado, id_institucional } = req.body;
    const fecha_modificacion = new Date().toISOString().slice(0, 10);

    if (!nombre && !horas_segun_contrato && !estado && !id_institucional) {
        return res.status(400).json({ message: 'Se requiere al menos un campo (nombre, horas_segun_contrato, estado, o id_institucional) para actualizar.' });
    }

    let connection;
    try {
        connection = await dbPool.getConnection();
        const [result] = await connection.execute(
            'UPDATE profesor SET nombre = ?, horas_segun_contrato = ?, estado = ?, id_institucional = ?, fecha_modificacion = ? WHERE id = ?',
            [nombre, horas_segun_contrato, estado, id_institucional, fecha_modificacion, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Profesor no encontrado para actualizar.' });
        }
        res.json({ message: 'Profesor actualizado con éxito', affectedRows: result.affectedRows });
    } catch (error) {
        console.error('Error al actualizar profesor:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Error: El ID Institucional ya existe.', error: error.message });
        }
        res.status(500).json({ message: 'Error interno del servidor al actualizar profesor.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

// Ruta para eliminar un profesor
router.delete('/profesores/:id', async (req, res) => {
    if (!dbPool) { return res.status(500).json({ message: 'Error: La conexión a la base de datos no está establecida.' }); }
    const { id } = req.params;
    let connection;
    try {
        connection = await dbPool.getConnection();
        const [result] = await connection.execute('DELETE FROM profesor WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Profesor no encontrado para eliminar.' });
        }
        res.json({ message: 'Profesor eliminado con éxito', affectedRows: result.affectedRows });
    } catch (error) {
        console.error('Error al eliminar profesor:', error);
        res.status(500).json({ message: 'Error interno del servidor al eliminar profesor.', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

export default router; // <-- ¡ESTO ES LO QUE DEBE ESTAR!
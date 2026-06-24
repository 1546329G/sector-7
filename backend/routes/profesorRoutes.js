import express from 'express';
import { getDatabasePool } from '../db.js';

const router = express.Router();

let dbPool;
(async () => {
    try {
        dbPool = await getDatabasePool();
        console.log('[profesorRoutes] Conexión a la base de datos para profesores establecida.');
    } catch (error) {
        console.error('[profesorRoutes] No se pudo establecer la conexión a la base de datos:', error);
    }
})();

router.use((req, res, next) => {
    if (!dbPool) {
        return res.status(500).json({ message: 'Error: La conexión a la base de datos no está establecida para profesores.' });
    }
    next();
});

router.get('/profesores', async (req, res) => {
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

router.get('/profesores/buscar', async (req, res) => {
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

router.get('/profesores/:id', async (req, res) => {
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

router.post('/profesores', async (req, res) => {
    const { nombre, horas_segun_contrato, estado, id_institucional } = req.body;
    const fecha_registro = new Date().toISOString().slice(0, 10);
    const fecha_modificacion = fecha_registro;

    if (!nombre || !id_institucional || horas_segun_contrato === undefined) {
        return res.status(400).json({ message: 'El nombre, ID Institucional y Horas Contrato del profesor son obligatorios.' });
    }

    if (estado && !['Activo', 'Inactivo'].includes(estado)) {
        return res.status(400).json({ message: 'El estado debe ser "Activo" o "Inactivo".' });
    }

    let connection;
    try {
        connection = await dbPool.getConnection();
        const [result] = await connection.execute(
            'INSERT INTO profesor (nombre, horas_segun_contrato, estado, id_institucional, fecha_registro, fecha_modificacion) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, horas_segun_contrato, estado || 'Activo', id_institucional, fecha_registro, fecha_modificacion]
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

router.put('/profesores/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'Se requiere al menos un campo para actualizar (nombre, horas_segun_contrato, estado, id_institucional).' });
    }

    let connection;
    try {
        connection = await dbPool.getConnection();

        const setClauses = [];
        const params = [];

        for (const key in updates) {
            if (updates.hasOwnProperty(key)) {
                if (key === 'estado') {
                    if (!['Activo', 'Inactivo'].includes(updates[key])) {
                        connection.release();
                        return res.status(400).json({ message: 'El estado debe ser "Activo" o "Inactivo".' });
                    }
                    setClauses.push(`${key} = ?`);
                    params.push(updates[key]);
                } else if (key === 'horario') {
                    setClauses.push(`${key} = ?`);
                    params.push(updates[key] === null ? null : JSON.stringify(updates[key]));
                } else {
                    setClauses.push(`${key} = ?`);
                    params.push(updates[key] === undefined ? null : updates[key]);
                }
            }
        }

        setClauses.push('fecha_modificacion = ?');
        params.push(new Date().toISOString().slice(0, 10));

        const query = `UPDATE profesor SET ${setClauses.join(', ')} WHERE id = ?`;
        params.push(id);

        const [result] = await connection.execute(query, params);

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

router.delete('/profesores/:id', async (req, res) => {
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

export default router;

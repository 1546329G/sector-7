// backend/api1/routes/profesorRoutes.js

import express from 'express';
// Importa la función para obtener el pool de conexiones a la base de datos.
// Ajusta la ruta si tu archivo db.js (o config/db.js) está en otra ubicación.
// Por ejemplo, si db.js está directamente en la carpeta 'backend', usarías '../db.js'.
// Si está en 'backend/config/db.js', usarías '../config/db.js'.
// Dada la salida de tu consola, '../../db.js' parece ser la correcta
// si este archivo está en 'backend/api1/routes/'.
import { getDatabasePool } from '../../db.js'; 

const router = express.Router(); // Usa el Router de Express

// Función para obtener el pool de conexiones (se inicializará una vez)
let dbPool;
(async () => {
    try {
        dbPool = await getDatabasePool();
        console.log('[profesorRoutes] Conexión a la base de datos para profesores establecida.');
    } catch (error) {
        console.error('[profesorRoutes] No se pudo establecer la conexión a la base de datos para las rutas de profesores. Terminando...', error);
        // Podrías decidir no terminar el proceso aquí si otras partes de la API no dependen de esto.
        // Pero para funciones críticas de DB, salir es una opción.
        process.exit(1); 
    }
})();

// Middleware para verificar la conexión a la base de datos antes de cada ruta
router.use((req, res, next) => {
    if (!dbPool) {
        return res.status(500).json({ message: 'Error: La conexión a la base de datos no está establecida para profesores.' });
    }
    next();
});


// ----------------------------------------------------------------
// RUTAS DE PROFESORES
// ----------------------------------------------------------------

// Ruta para obtener todos los profesores
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

// Ruta para buscar profesores por ID o nombre
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

// Ruta para obtener un profesor por ID
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

// Ruta para insertar un nuevo profesor
router.post('/profesores', async (req, res) => {
    const { nombre, horas_segun_contrato, estado, id_institucional } = req.body;
    const fecha_registro = new Date().toISOString().slice(0, 10);
    const fecha_modificacion = fecha_registro; // Inicialmente, la fecha de modificación es la misma que la de registro

    if (!nombre || !id_institucional || horas_segun_contrato === undefined) { // Asegúrate de que horas_segun_contrato no sea undefined
        return res.status(400).json({ message: 'El nombre, ID Institucional y Horas Contrato del profesor son obligatorios.' });
    }

    // Validación de estado si se envía
    if (estado && !['Activo', 'Inactivo'].includes(estado)) {
        return res.status(400).json({ message: 'El estado debe ser "Activo" o "Inactivo".' });
    }

    let connection;
    try {
        connection = await dbPool.getConnection();
        const [result] = await connection.execute(
            'INSERT INTO profesor (nombre, horas_segun_contrato, estado, id_institucional, fecha_registro, fecha_modificacion) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, horas_segun_contrato, estado || 'Activo', id_institucional, fecha_registro, fecha_modificacion] // Si estado no se envía, por defecto 'Activo'
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

// Ruta para actualizar un profesor (IMPLEMENTACIÓN DINÁMICA - OPCIÓN 1)
router.put('/profesores/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body; // Captura todo el cuerpo de la solicitud

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'Se requiere al menos un campo para actualizar (nombre, horas_segun_contrato, estado, id_institucional).' });
    }

    let connection;
    try {
        connection = await dbPool.getConnection();

        const setClauses = [];
        const params = [];

        // Construye dinámicamente la parte SET de la consulta
        for (const key in updates) {
            if (updates.hasOwnProperty(key)) {
                // Validación específica para el campo 'estado'
                if (key === 'estado') {
                    if (!['Activo', 'Inactivo'].includes(updates[key])) {
                        connection.release();
                        return res.status(400).json({ message: 'El estado debe ser "Activo" o "Inactivo".' });
                    }
                    setClauses.push(`${key} = ?`);
                    params.push(updates[key]);
                } 
                // Si tienes un campo 'horario' que se guarda como JSON string (si lo añades en el futuro)
                else if (key === 'horario') {
                    setClauses.push(`${key} = ?`);
                    // Asegúrate de que horario sea un array o null para JSON.stringify
                    params.push(updates[key] === null ? null : JSON.stringify(updates[key]));
                } 
                // Manejar otros campos
                else {
                    setClauses.push(`${key} = ?`);
                    // Importante: Si un campo puede ser null en la DB, y el frontend lo envía como null (no undefined),
                    // asegúrate de que se pase null. Si el frontend envía undefined, convertir a null si la DB lo permite.
                    params.push(updates[key] === undefined ? null : updates[key]);
                }
            }
        }

        // Siempre actualiza la fecha_modificacion al final
        setClauses.push('fecha_modificacion = ?');
        params.push(new Date().toISOString().slice(0, 10));

        // Construye la consulta final
        const query = `UPDATE profesor SET ${setClauses.join(', ')} WHERE id = ?`;
        params.push(id); // Añade el ID al final de los parámetros

        console.log('[DEBUG] UPDATE Query:', query);
        console.log('[DEBUG] UPDATE Parameters:', params);

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

// Ruta para eliminar un profesor
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

export default router; // Exporta el router para que pueda ser usado en tu app principal
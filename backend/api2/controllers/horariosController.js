import { getDatabasePool } from '../../db.js';

// Obtener todos los horarios
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

// Añadir un nuevo horario
export const addHorario = async (req, res) => {
    console.log('--- INTENTO DE AÑADIR HORARIO ---');
    console.log('Datos recibidos desde el frontend:', req.body); 

    // Desestructurar los datos del cuerpo de la solicitud (req.body)
    // Asegúrate de que estos nombres de campo coincidan con lo que tu frontend envía
    const { id_profesor, dia_semana, hora_entrada, hora_salida, aula } = req.body;

    // Validaciones básicas de los datos recibidos
    if (!id_profesor || !dia_semana || !hora_entrada || !hora_salida || !aula) {
        console.warn('Error de validación: Faltan campos obligatorios para añadir horario.');
        return res.status(400).json({ message: 'Todos los campos son obligatorios (profesor, día, hora inicio, hora fin, aula).' });
    }

    // --- NUEVA LÓGICA PARA GENERAR ID MÁS CORTO (10 caracteres) ---
    // Prefijo "HR" para Horario
    const prefix = 'HR';
    // Últimos 5 dígitos del timestamp (ej: 70980)
    const timestampEnd = Date.now().toString().slice(-5);
    // 3 caracteres aleatorios (ej: R82)
    const randomChars = Math.random().toString(36).substr(2, 3).toUpperCase();

    const generatedId = `${prefix}${timestampEnd}${randomChars}`; // Ej: HR70980R82 (10 caracteres)
    // --- FIN DE LA LÓGICA DE GENERACIÓN DE ID ---












    // Crear el objeto del nuevo horario para la inserción en la base de datos
    const newHorario = {
        id: generatedId, // Usar el ID más corto generado aquí
        id_profesor: id_profesor,
        dia_semana: dia_semana,
        hora_entrada: hora_entrada,
        hora_salida: hora_salida,
        aula: aula,
        estado: 'Activo', // Asignar un estado por defecto
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
        console.log(`Profesor ID ${id_profesor} verificado.`);
        const [conflictCheck] = await db.query(
            `SELECT * FROM horario
             WHERE dia_semana = ?
               AND (
                   (id_profesor = ? AND (
                       (hora_entrada < ? AND hora_salida > ?) OR  -- Nuevo horario empieza antes y termina después de uno existente
                       (hora_entrada >= ? AND hora_entrada < ?) OR  -- Nuevo horario empieza dentro de uno existente (o justo en el borde)
                       (hora_salida > ? AND hora_salida <= ?) OR    -- Nuevo horario termina dentro de uno existente (o justo en el borde)
                       (hora_entrada = ? AND hora_salida = ?)     -- Nuevo horario es idéntico a uno existente
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
        console.log('No se encontraron conflictos de horario.');

        // nuevo horario en la base de datos :)
        await db.query('INSERT INTO horario SET ?', newHorario);
        console.log(`Horario añadido exitosamente: ID: ${generatedId}, Profesor ID: ${id_profesor}, Día: ${dia_semana}, Hora: ${hora_entrada}-${hora_salida}, Aula: ${aula}`);
        res.status(201).json(newHorario); // Devolver el objeto creado con su ID generado

    } catch (err) {
        console.error('Error FATAL al añadir horario:', err); 
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Error de entrada duplicada. Posiblemente un ID de horario ya existe.' });
        }
        if (err.code === 'ER_BAD_FIELD_ERROR') {
            return res.status(500).json({ message: `Error de columna en la base de datos: ${err.sqlMessage}.` });
        }
        
        return res.status(500).json({ message: 'Error interno del servidor al añadir horario. Consulte los logs del servidor para más detalles.' });
    }
};

// Eliminar un horario
export const deleteHorario = async (req, res) => {
    const { id } = req.params;
    const db = await getDatabasePool();
    try {
        const [results] = await db.query('DELETE FROM horario WHERE id = ?', [id]);
        if (results.affectedRows === 0) {
            console.warn(`Intento de eliminar horario con ID ${id}: No encontrado.`);
            return res.status(404).json({ message: 'Horario no encontrado' });
        }
        console.log(`Horario con ID ${id} eliminado exitosamente.`);
        res.status(204).send(); 
    } catch (err) {
        console.error('Error al eliminar horario:', err);
        return res.status(500).json({ message: 'Error al eliminar horario' });
    }
};
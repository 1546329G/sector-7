import React, { useState, useEffect, useCallback } from 'react';
import '../css/AdministrarAsistencia.css'; // Asegúrate de tener este CSS

// --- Tipos de Datos (Interfaces) ---

/**
 * Tipo para un profesor básico, usado para obtener su ID y nombre.
 */
interface ProfesorBasico {
    id: string;
    nombre: string;
}

/**
 * Tipo para un registro de asistencia diario tal como vendría del backend
 * (Este es el que se usa en el mock y el que se enviaría al guardar).
 */
interface DailyAttendanceRecord {
    profesorId: string;
    date: string; // Formato 'YYYY-MM-DD'
    hours: number;
}

/**
 * Tipo para almacenar las horas de un día específico.
 */
interface DailyHours {
    date: string; // Formato 'YYYY-MM-DD'
    hours: number | ''; // Permite vacío para inputs no llenados
}

/**
 * Tipo para almacenar las horas diarias de una semana para un profesor.
 */
interface WeeklyAttendance {
    weekStartDate: string; // Formato 'YYYY-MM-DD' para el inicio de la semana (Lunes)
    days: DailyHours[]; // Array de 7 elementos para Lunes a Domingo
    weeklyTotal: number; // Total calculado automáticamente
}

/**
 * Tipo para el estado de asistencia de un profesor en el rango de fechas.
 * Utilizado para mostrar los datos en la tabla de administración.
 */
interface ProfesorAttendanceDisplay {
    id: string; // ID del profesor
    nombre: string;
    weeks: WeeklyAttendance[]; // Array de semanas dentro del rango seleccionado
    rangeTotal: number; // Total de horas para todo el rango
}

/**
 * Tipo para un registro de asistencia resumido (para la vista de reporte).
 */
interface AsistenciaRegistroResumen {
    id: string;
    nombre: string;
    horasSem: number;
    mes: string; // O puedes usar Date si prefieres manejar fechas más rígidamente
}

const AdministrarAsistencia: React.FC = () => {
    // --- Estados Compartidos ---
    const [fechaInicio, setFechaInicio] = useState<string>('');
    const [fechaFin, setFechaFin] = useState<string>('');
    const [message, setMessage] = useState<{ type: 'info' | 'error' | 'success', text: string } | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false); // Estado para indicar si se están cargando datos
    const [isSaving, setIsSaving] = useState<boolean>(false); // Estado para indicar si se están guardando datos

    // --- Estados para la Vista de Administración (Edición Diaria) ---
    const [profesores, setProfesores] = useState<ProfesorBasico[]>([]); // Lista de docentes
    const [profesorAttendanceData, setProfesorAttendanceData] = useState<ProfesorAttendanceDisplay[]>([]); // Datos de asistencia por docente

    // --- Estados para la Vista de Reporte (Resumen Mensual) ---
    const [registrosAsistenciaResumen, setRegistrosAsistenciaResumen] = useState<AsistenciaRegistroResumen[]>([]);

    // --- Estado para la selección de vista ---
    const [vistaActual, setVistaActual] = useState<'administrar' | 'reporte'>('administrar');

    // --- Constantes ---
    const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    // --- Funciones de Utilidad de Fecha ---

    /**
     * Obtiene una lista de todas las semanas (fechas de inicio de semana, Lunes)
     * entre dos fechas dadas.
     * @param start Fecha de inicio del rango (YYYY-MM-DD).
     * @param end Fecha de fin del rango (YYYY-MM-DD).
     * @returns Array de strings con las fechas de inicio de cada semana (Lunes).
     */
    const getWeeksInRange = (start: string, end: string): string[] => {
        const weeks: string[] = [];
        let currentDate = new Date(start + 'T00:00:00');
        const endDate = new Date(end + 'T00:00:00');

        // Retrocede hasta el Lunes de la semana de inicio
        const dayOfWeekStart = currentDate.getDay(); // 0 = Domingo, 1 = Lunes
        const daysToSubtract = dayOfWeekStart === 0 ? 6 : dayOfWeekStart - 1;
        currentDate.setDate(currentDate.getDate() - daysToSubtract);

        // Ajustar el final del rango para asegurar que la última semana completa esté incluida
        const adjustedEndDate = new Date(endDate);
        const dayOfWeekEnd = adjustedEndDate.getDay();
        const daysToAddForEndOfWeek = dayOfWeekEnd === 0 ? 0 : 7 - dayOfWeekEnd; // Si es domingo (0), no sumamos nada; si no, hasta el domingo de esa semana
        adjustedEndDate.setDate(adjustedEndDate.getDate() + daysToAddForEndOfWeek);


        while (currentDate.getTime() <= adjustedEndDate.getTime()) {
            weeks.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 7);
        }
        return weeks;
    };


    /**
     * Obtiene los 7 días de una semana dado su Lunes de inicio.
     * @param weekStartDate Fecha de inicio de la semana (Lunes) en formato YYYY-MM-DD.
     * @returns Array de objetos DailyHours para la semana.
     */
    const getDaysOfWeek = (weekStartDate: string): DailyHours[] => {
        const start = new Date(weekStartDate + 'T00:00:00');
        const days: DailyHours[] = [];
        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(start);
            currentDay.setDate(start.getDate() + i);
            days.push({
                date: currentDay.toISOString().split('T')[0],
                hours: '' // Inicialmente vacío para la entrada
            });
        }
        return days;
    };

    // --- Carga de Datos (Simulada con `useCallback`) para AMBAS vistas ---

    /**
     * Carga los datos de docentes y asistencia para la vista de administración.
     * Simula llamadas a una API para datos detallados.
     */
    const fetchAdminData = useCallback(async () => {
        setIsLoading(true);
        setMessage(null);
        setProfesores([]);
        setProfesorAttendanceData([]);

        try {
            if (fechaInicio && fechaFin && new Date(fechaInicio) > new Date(fechaFin)) {
                setMessage({ type: 'error', text: 'La fecha de inicio no puede ser posterior a la fecha fin.' });
                setIsLoading(false);
                return;
            }

            // --- SIMULACIÓN DE LLAMADAS AL BACKEND para datos detallados ---
            await new Promise(resolve => setTimeout(resolve, 800)); // Simular retraso de API

            const mockProfesores: ProfesorBasico[] = [
                { id: '101', nombre: 'Juan Pérez' },
                { id: '102', nombre: 'María García' },
                { id: '103', nombre: 'Carlos Ruiz' },
                { id: '104', nombre: 'Ana López' },
            ];
            setProfesores(mockProfesores);

            const mockDailyAttendance: DailyAttendanceRecord[] = [];
            if (fechaInicio && fechaFin) {
                mockProfesores.forEach(prof => {
                    const weeks = getWeeksInRange(fechaInicio, fechaFin);
                    weeks.forEach(weekStart => {
                        const days = getDaysOfWeek(weekStart);
                        days.forEach(day => {
                            const dayDate = new Date(day.date + 'T00:00:00');
                            const startRange = new Date(fechaInicio + 'T00:00:00');
                            const endRange = new Date(fechaFin + 'T00:00:00');

                            if (dayDate >= startRange && dayDate <= endRange) {
                                if (Math.random() > 0.6) { // 40% de probabilidad de tener horas
                                    mockDailyAttendance.push({
                                        profesorId: prof.id,
                                        date: day.date,
                                        hours: Math.floor(Math.random() * 8) + 1 // Horas entre 1 y 8
                                    });
                                }
                            }
                        });
                    });
                });
            }
            // --- FIN SIMULACIÓN DE LLAMADAS AL BACKEND ---

            // Procesar los datos crudos para la visualización en la tabla de administración
            const processedAttendance: ProfesorAttendanceDisplay[] = mockProfesores.map(prof => {
                const weeklyAttendanceMap: { [weekStartDate: string]: WeeklyAttendance } = {};
                const weeksInDisplayRange = (fechaInicio && fechaFin) ? getWeeksInRange(fechaInicio, fechaFin) : [];

                // Inicializar todas las semanas y días dentro del rango
                weeksInDisplayRange.forEach(weekStart => {
                    const daysOfWeek = getDaysOfWeek(weekStart);
                    const weekData: WeeklyAttendance = {
                        weekStartDate: weekStart,
                        days: daysOfWeek.map(day => ({
                            date: day.date,
                            hours: '' // Inicialmente vacío
                        })),
                        weeklyTotal: 0
                    };
                    weeklyAttendanceMap[weekStart] = weekData;
                });

                // Llenar con los datos mock de asistencia
                mockDailyAttendance.forEach(record => {
                    if (record.profesorId === prof.id) {
                        const recordDate = new Date(record.date + 'T00:00:00');
                        const dayOfWeek = recordDate.getDay();
                        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                        const weekStart = new Date(recordDate);
                        weekStart.setDate(recordDate.getDate() - daysToSubtract);
                        const weekStartDateStr = weekStart.toISOString().split('T')[0];

                        if (weeklyAttendanceMap[weekStartDateStr]) {
                            const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0 (Domingo) -> 6, 1 (Lunes) -> 0
                            weeklyAttendanceMap[weekStartDateStr].days[dayIndex].hours = record.hours;
                        }
                    }
                });

                // Calcular totales
                let totalRangeHours = 0;
                const sortedWeeks = Object.values(weeklyAttendanceMap).sort((a, b) => new Date(a.weekStartDate).getTime() - new Date(b.weekStartDate).getTime());

                sortedWeeks.forEach(week => {
                    week.weeklyTotal = week.days.reduce((sum, day) => sum + (Number(day.hours) || 0), 0);
                    totalRangeHours += week.weeklyTotal;
                });

                return {
                    id: prof.id,
                    nombre: prof.nombre,
                    weeks: sortedWeeks,
                    rangeTotal: totalRangeHours
                };
            });

            setProfesorAttendanceData(processedAttendance);
            if (mockProfesores.length > 0) {
                setMessage({ type: 'success', text: `Lista de asistencia actualizada. ${processedAttendance.length} docentes con registros.` });
            } else {
                setMessage({ type: 'info', text: 'No se encontraron docentes.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error al cargar datos de administración. Inténtalo de nuevo.' });
            console.error('Error al cargar asistencia de administración:', error);
            setProfesores([]);
            setProfesorAttendanceData([]);
        } finally {
            setIsLoading(false);
        }
    }, [fechaInicio, fechaFin]);

    /**
     * Carga los datos de asistencia para la vista de reporte (resumen).
     * Simula llamadas a una API para datos resumidos.
     */
    const fetchReporteData = useCallback(async () => {
        setIsLoading(true);
        setMessage(null);
        setRegistrosAsistenciaResumen([]);

        try {
            if (fechaInicio && fechaFin && new Date(fechaInicio) > new Date(fechaFin)) {
                setMessage({ type: 'error', text: 'La fecha de inicio no puede ser posterior a la fecha fin.' });
                setIsLoading(false);
                return;
            }

            // --- SIMULACIÓN DE LLAMADAS AL BACKEND para datos resumidos ---
            await new Promise(resolve => setTimeout(resolve, 800)); // Simular retraso de API

            const mockReporte: AsistenciaRegistroResumen[] = [];
            const mockProfesoresBase: ProfesorBasico[] = [ // Usamos una base de profesores similar
                { id: '101', nombre: 'Juan Pérez' },
                { id: '102', nombre: 'María García' },
                { id: '103', nombre: 'Carlos Ruiz' },
                { id: '104', nombre: 'Ana López' },
            ];

            const start = fechaInicio ? new Date(fechaInicio + 'T00:00:00') : new Date('2024-01-01T00:00:00'); // Default para simulación
            const end = fechaFin ? new Date(fechaFin + 'T00:00:00') : new Date('2024-12-31T00:00:00'); // Default para simulación

            mockProfesoresBase.forEach(prof => {
                let currentMonth = new Date(start);
                while (currentMonth <= end) {
                    // Simula horas semanales para el mes
                    const horasSem = Math.floor(Math.random() * 30) + 10; // Horas entre 10 y 40
                    mockReporte.push({
                        id: prof.id,
                        nombre: prof.nombre,
                        horasSem: horasSem,
                        mes: currentMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()
                    });

                    // Avanzar al siguiente mes
                    currentMonth.setMonth(currentMonth.getMonth() + 1);
                    // Asegura que no se salte el día si el mes actual tiene menos días que el original
                    if (currentMonth.getDate() !== start.getDate()) {
                        currentMonth.setDate(0); // Va al último día del mes anterior
                        currentMonth.setDate(start.getDate()); // Vuelve al día original o al último día del mes si no existe
                    }
                }
            });
            // Filtrar y procesar para el rango real si existen fechas
            const filteredReporte = mockReporte.filter(record => {
                if (!fechaInicio || !fechaFin) return true; // Si no hay filtro de fechas, muestra todo
                const recordDate = new Date(`01 ${record.mes.replace('DE ', '')}`); // Crear fecha para comparación (ej. '01 ENERO 2024')
                return recordDate >= start && recordDate <= end;
            });


            setRegistrosAsistenciaResumen(filteredReporte);
            if (filteredReporte.length > 0) {
                setMessage({ type: 'success', text: `Reporte de asistencia actualizado. ${filteredReporte.length} registros encontrados.` });
            } else {
                setMessage({ type: 'info', text: 'No se encontraron registros de reporte para el rango seleccionado.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error al cargar datos de reporte. Inténtalo de nuevo.' });
            console.error('Error al cargar asistencia de reporte:', error);
            setRegistrosAsistenciaResumen([]);
        } finally {
            setIsLoading(false);
        }
    }, [fechaInicio, fechaFin]);


    // --- Efecto para cargar datos al cambiar la vista o las fechas ---
    useEffect(() => {
        // Ejecuta la carga de datos relevante solo cuando cambian las fechas o la vista
        if (vistaActual === 'administrar') {
            fetchAdminData();
        } else { // vistaActual === 'reporte'
            fetchReporteData();
        }
    }, [vistaActual, fechaInicio, fechaFin, fetchAdminData, fetchReporteData]); // Dependencias para recarga

    // --- Manejadores de Eventos Generales ---

    const handleFiltrarPorFecha = () => {
        if (!fechaInicio || !fechaFin) {
            setMessage({ type: 'error', text: 'Por favor, selecciona AMBAS fechas para filtrar por rango.' });
            return;
        }
        if (new Date(fechaInicio) > new Date(fechaFin)) {
            setMessage({ type: 'error', text: 'La fecha de inicio no puede ser posterior a la fecha fin.' });
            return;
        }
        setMessage({ type: 'info', text: `Filtrando asistencia en vista de ${vistaActual === 'administrar' ? 'administración' : 'reporte'}...` });
        // La recarga se maneja por el useEffect gracias a las dependencias de fecha.
        // No necesitamos llamar a fetchData o fetchReporteData aquí directamente.
    };

    const handleActualizarListaTotal = () => {
        setMessage({ type: 'info', text: `Actualizando la lista total en vista de ${vistaActual === 'administrar' ? 'administración' : 'reporte'}...` });
        setFechaInicio(''); // Limpiar filtro de fecha
        setFechaFin(''); // Limpiar filtro de fecha
        // La recarga se maneja por el useEffect gracias a las dependencias de fecha.
    };

    // --- Manejadores de Eventos para la Vista de Administración (Edición Diaria) ---

    /**
     * Maneja el cambio en las horas diarias de un input.
     * Actualiza el estado local y recalcula los totales semanal y del rango.
     */
    const handleDailyHoursChange = (
        profesorId: string,
        weekIndex: number,
        dayIndex: number,
        value: string
    ) => {
        setProfesorAttendanceData(prevData => {
            const newData = prevData.map(prof => {
                if (prof.id === profesorId) {
                    const newWeeks = [...prof.weeks];
                    const newDays = [...newWeeks[weekIndex].days];

                    // Asegúrate de que el valor sea un número o cadena vacía
                    const parsedValue = value === '' ? '' : Math.max(0, Math.min(24, Number(value)));

                    newDays[dayIndex] = { ...newDays[dayIndex], hours: parsedValue };

                    // Recalcular total semanal
                    const newWeeklyTotal = newDays.reduce((sum, day) => sum + (Number(day.hours) || 0), 0);
                    newWeeks[weekIndex] = { ...newWeeks[weekIndex], days: newDays, weeklyTotal: newWeeklyTotal };

                    // Recalcular total del rango
                    const newRangeTotal = newWeeks.reduce((sum, week) => sum + week.weeklyTotal, 0);

                    return { ...prof, weeks: newWeeks, rangeTotal: newRangeTotal };
                }
                return prof;
            });
            return newData;
        });
    };

    /**
     * Función para guardar los datos de asistencia.
     * Simula el envío de datos al backend.
     */
    const handleGuardarHoras = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            const attendanceToSave: DailyAttendanceRecord[] = [];
            profesorAttendanceData.forEach(prof => {
                prof.weeks.forEach(week => {
                    week.days.forEach(day => {
                        if (day.hours !== '' && typeof day.hours === 'number' && day.hours >= 0) {
                            attendanceToSave.push({
                                profesorId: prof.id,
                                date: day.date,
                                hours: day.hours
                            });
                        }
                    });
                });
            });

            console.log("Datos a enviar al backend:", attendanceToSave);

            // --- SIMULACIÓN DE LA LLAMADA POST/PUT AL BACKEND ---
            const response = await fetch('https://egratis.onrender.com/asistencia/guardar', { // URL de tu API para guardar
                method: 'POST', // O 'PUT' si actualizas registros existentes
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(attendanceToSave),
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Horas de asistencia guardadas exitosamente.' });
            } else {
                const errorData = await response.json();
                setMessage({ type: 'error', text: `Error al guardar horas: ${errorData.message || response.statusText}` });
            }
            // --- FIN SIMULACIÓN DE LLAMADA AL BACKEND ---

        } catch (error) {
            setMessage({ type: 'error', text: 'Error de conexión al guardar horas. Inténtalo de nuevo.' });
            console.error('Error al guardar asistencia:', error);
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage(null), 5000); // Borra mensaje después de 5 segundos
        }
    };


    // --- Renderizado ---

    // Las semanas a mostrar en las cabeceras de la tabla se recalculan con cada render
    const weeksInDisplay = fechaInicio && fechaFin ? getWeeksInRange(fechaInicio, fechaFin) : [];

    return (
        <div className="asistencia-container">
            <h2>GESTIÓN DE ASISTENCIA DOCENTE</h2>

            <div className="view-selector">
                <button
                    className={`button ${vistaActual === 'administrar' ? 'primary-button' : 'secondary-button'}`}
                    onClick={() => setVistaActual('administrar')}
                >
                    Administrar Horas Diarias
                </button>
                <button
                    className={`button ${vistaActual === 'reporte' ? 'primary-button' : 'secondary-button'}`}
                    onClick={() => setVistaActual('reporte')}
                >
                    Consultar Reportes Mensuales
                </button>
            </div>

            <div className="filtros-asistencia">
                <div className="rango-fechas-group">
                    <label>RANGO DE FECHAS:</label>
                    <input
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        className="date-input"
                        max={fechaFin || undefined}
                    />
                    <span>-</span>
                    <input
                        type="date"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                        className="date-input"
                        min={fechaInicio || undefined}
                    />
                </div>
                <button onClick={handleFiltrarPorFecha} className="button primary-button" disabled={isLoading}>
                    {isLoading ? 'Filtrando...' : 'FILTRAR'}
                </button>
                <button onClick={handleActualizarListaTotal} className="button secondary-button" disabled={isLoading}>
                    {isLoading ? 'Actualizando...' : 'ACTUALIZAR LISTA TOTAL'}
                </button>
                {vistaActual === 'administrar' && (
                    <button onClick={handleGuardarHoras} className="button success-button" disabled={isSaving || profesorAttendanceData.length === 0}>
                        {isSaving ? 'Guardando...' : 'GUARDAR HORAS'}
                    </button>
                )}
            </div>

            {message && (
                <p className={`message ${message.type}`}>
                    {message.text}
                </p>
            )}

            {isLoading ? (
                <p className="loading-message">Cargando registros de asistencia...</p>
            ) : (
                <>
                    {/* --- Vista de Administración de Asistencia (Edición Diaria) --- */}
                    {vistaActual === 'administrar' && (
                        <div className="asistencia-table-container">
                            {profesorAttendanceData.length === 0 && !message?.text.includes("Error") && !isLoading && (
                                <p className="no-data-message">
                                    Selecciona un rango de fechas o actualiza la lista para ver la asistencia diaria.
                                </p>
                            )}

                            {profesorAttendanceData.length > 0 && (
                                <table className="asistencia-table">
                                    <thead>
                                        <tr>
                                            <th rowSpan={2}>ID Docente</th>
                                            <th rowSpan={2}>Nombre</th>
                                            {/* Cabeceras de semanas dinámicas */}
                                            {weeksInDisplay.map((weekStart) => {
                                                const weekEnd = getDaysOfWeek(weekStart)[6].date;
                                                return (
                                                    <th key={weekStart} colSpan={7} className="week-header">
                                                        Semana: {weekStart} a {weekEnd}
                                                    </th>
                                                );
                                            })}
                                            <th rowSpan={2} className="total-column">Total Rango</th>
                                        </tr>
                                        <tr>
                                            {/* Cabeceras de días dinámicas */}
                                            {weeksInDisplay.map((weekStart) => (
                                                <React.Fragment key={`days-${weekStart}`}>
                                                    {dayNames.map(dayName => (
                                                        <th key={`${weekStart}-${dayName}`}>{dayName}</th>
                                                    ))}
                                                </React.Fragment>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {profesorAttendanceData.map((prof) => (
                                            <tr key={prof.id}>
                                                <td>{prof.id}</td>
                                                <td>{prof.nombre}</td>
                                                {prof.weeks.map((week, weekIndex) => (
                                                    <React.Fragment key={`${prof.id}-${week.weekStartDate}`}>
                                                        {week.days.map((day, dayIndex) => (
                                                            <td key={`${prof.id}-${day.date}`}>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="24"
                                                                    value={day.hours}
                                                                    onChange={(e) => handleDailyHoursChange(
                                                                        prof.id,
                                                                        weekIndex,
                                                                        dayIndex,
                                                                        e.target.value
                                                                    )}
                                                                    className="daily-hours-input"
                                                                    disabled={isSaving}
                                                                />
                                                            </td>
                                                        ))}
                                                        {/* No hay total semanal en la misma celda de entrada para evitar confusión */}
                                                    </React.Fragment>
                                                ))}
                                                {/* Aquí se calculan y muestran los totales semanales como una columna separada por semana */}
                                                {prof.weeks.map((week, weekIndex) => (
                                                    <td key={`weekly-total-${prof.id}-${weekIndex}`} className="weekly-total">
                                                        {week.weeklyTotal}
                                                    </td>
                                                ))}
                                                <td className="range-total">{prof.rangeTotal}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* --- Vista de Reporte de Asistencia (Resumen Mensual) --- */}
                    {vistaActual === 'reporte' && (
                        <div className="asistencia-table-container">
                            {registrosAsistenciaResumen.length === 0 && !message?.text.includes("Error") && !isLoading && (
                                <p className="no-data-message">
                                    No hay registros de reporte de asistencia para mostrar.
                                </p>
                            )}
                            {registrosAsistenciaResumen.length > 0 && (
                                <table className="asistencia-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>NOMBRE</th>
                                            <th>HORAS SEM</th>
                                            <th>MES</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {registrosAsistenciaResumen.map((registro, index) => (
                                            <tr key={registro.id + registro.mes + index}> {/* Usar una clave más robusta */}
                                                <td>{registro.id}</td>
                                                <td>{registro.nombre}</td>
                                                <td>{registro.horasSem}</td>
                                                <td>{registro.mes}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AdministrarAsistencia;
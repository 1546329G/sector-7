import React, { useState, useEffect } from 'react';
import '../css/AdministrarReporte.css';
interface MovilidadRegistro {

    total: number;
}
const AdministrarMovilidad: React.FC = () => {
    
    const [fechaInicio, setFechaInicio] = useState<string>('');
    const [fechaFin, setFechaFin] = useState<string>('');
    const [registrosMovilidad, setRegistrosMovilidad] = useState<MovilidadRegistro[]>([]);
    const [message, setMessage] = useState<{ type: 'info' | 'error', text: string } | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Función para cargar los datos de movilidad desde la API
    const fetchMovilidad = async () => {
        setIsLoading(true);
        setMessage(null);
        try {
            const apiUrl = 'https://egratis.onrender.com/movilidad';

            // Construir URL con parámetros de fecha si están presentes
            const queryParams = new URLSearchParams();
            if (fechaInicio) queryParams.append('fechaInicio', fechaInicio);
            if (fechaFin) queryParams.append('fechaFin', fechaFin);

            const fullUrl = `${apiUrl}?${queryParams.toString()}`;

            const response = await fetch(fullUrl);

            if (response.ok) {
                const data: MovilidadRegistro[] = await response.json();
                setRegistrosMovilidad(data);
                setMessage({ type: 'info', text: `Lista actualizada. ${data.length} registros encontrados.` });
            } else {
                const errorData = await response.json();
                setMessage({ type: 'error', text: `Error al cargar movilidad: ${errorData.message || response.statusText}` });
                setRegistrosMovilidad([]);
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error de conexión con el servidor. Inténtalo de nuevo.' });
            console.error('Error de red o servidor al cargar movilidad:', error);
        } finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
    }, []);

    const handleActualizarLista = () => {
        fetchMovilidad();
    };

    const handleFiltrarPorFecha = () => {
        if ((fechaInicio && !fechaFin) || (!fechaInicio && fechaFin)) {
            setMessage({ type: 'error', text: 'Por favor, selecciona ambas fechas para filtrar por rango.' });
            return;
        }
        if (fechaInicio && fechaFin && new Date(fechaInicio) > new Date(fechaFin)) {
            setMessage({ type: 'error', text: 'La fecha de inicio no puede ser posterior a la fecha fin.' });
            return;
        }
        fetchMovilidad();
    };

    return (
        <div className="movilidad-container">
            <h2>MOVILIDAD</h2>

            <div className="filtros-movilidad">
                <div className="rango-fechas-group">
                    <label>RANGO DE FECHAS</label>
                    <input
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        className="date-input"
                    />
                    <span>-</span>
                    <input
                        type="date"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                        className="date-input"
                    />
                </div>
                <button onClick={handleFiltrarPorFecha} className="button primary-button">CLICK</button>
                <button onClick={handleActualizarLista} className="button secondary-button actualizar-list-button">ACTUALIZAR LISTA</button>
            </div>

            {message && (
                <p className={`message ${message.type}`}>
                    {message.text}
                </p>
            )}

            {isLoading ? (
                <p className="loading-message">Cargando registros de movilidad...</p>
            ) : (
                <div className="movilidad-table-container">
                    <div className="movilidad-grid-header">
                        <span className="total-label">TOTAL</span>
                    </div>
                    <div className="movilidad-grid">
                        {registrosMovilidad.length > 0 ? (
                            registrosMovilidad.map((registro, index) => (
                                <div key={index} className="movilidad-grid-item">
                                    {registro.total}
                                </div>
                            ))
                        ) : (
                            <div className="no-data-message">
                                No hay registros de movilidad para mostrar.
                            </div>
                        )}
                        {/* Render empty cells to fill the grid if less than a certain amount, similar to the image */}
                        {registrosMovilidad.length < 20 && Array.from({ length: 20 - registrosMovilidad.length }).map((_, i) => (
                            <div key={`empty-${i}`} className="movilidad-grid-item empty-cell"></div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdministrarMovilidad;
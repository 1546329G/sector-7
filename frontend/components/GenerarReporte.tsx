import React, { useState, useRef } from 'react';
import '../css/GenerarReporte.css';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { API_URL } from '../src/config';

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const GenerarReporte: React.FC = () => {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [mensaje, setMensaje] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [cargando, setCargando] = useState(false);

  const handleDownloadExcel = async () => {
    setMensaje(null);
    setCargando(true);

    if (!fechaInicio || !fechaFin) {
      setMensaje({ type: 'error', text: 'Por favor, selecciona tanto la fecha de inicio como la de fin.' });
      setCargando(false);
      return;
    }

    const apiUrl = `${API_URL}/generar-informe?inicio=${fechaInicio}&fin=${fechaFin}`;

    try {
      // 1. Obtener los datos de tu API
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
      }
      const data = await response.json(); // Aquí está el JSON que mostraste

      if (!data || data.length === 0) {
        setMensaje({ type: 'error', text: 'No se encontraron datos para las fechas proporcionadas.' });
        setCargando(false);
        return;
      }

      // 2. Crear un nuevo libro de trabajo (workbook)
      const workbook = XLSX.utils.book_new();

      // --- Pestaña de Resumen General ---
      const resumenHeaders = ['ID', 'Nombre', 'Horas Contrato', 'Total Horas Registradas', 'Tardanzas', 'Horas a Ingresar'];
      const resumenData = [resumenHeaders]; // Añadir encabezados

      data.forEach((profesor: any) => {
        resumenData.push([
          profesor.id,
          profesor.nombre,
          profesor.horas_contrato,
          profesor.total_horas,
          profesor.tardanzas,
          profesor.horas_a_ingresar
        ]);
      });
      const resumenWorksheet = XLSX.utils.aoa_to_sheet(resumenData);
      XLSX.utils.book_append_sheet(workbook, resumenWorksheet, 'Resumen General');

      // --- Pestañas Individuales por Profesor ---
      data.forEach((profesor: any) => {
        // Generar nombre de la pestaña, truncando si es muy largo (límite de 31 caracteres en Excel)
        // También limpiamos caracteres que Excel no permite en los nombres de hojas
        let sheetName = `${profesor.id} - ${profesor.nombre}`;
        sheetName = sheetName.replace(/[\\/?*\[\]]/g, '').substring(0, 31); // Eliminar caracteres inválidos y truncar

        const profesorHeaders = ['Semana', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo', 'Total Semanal'];
        const profesorData = [profesorHeaders];

        for (const semanaKey in profesor.semanas) {
          if (profesor.semanas.hasOwnProperty(semanaKey)) {
            const semana = profesor.semanas[semanaKey];
            profesorData.push([
              semanaKey, // e.g., "Semana 1"
              semana.L || '', // Si es null, poner cadena vacía
              semana.M || '',
              semana.X || '',
              semana.J || '',
              semana.V || '',
              semana.S || '',
              semana.D || '',
              semana.total || ''
            ]);
          }
        }

        const profesorWorksheet = XLSX.utils.aoa_to_sheet(profesorData);
        XLSX.utils.book_append_sheet(workbook, profesorWorksheet, sheetName);
      });

      // 3. Escribir el archivo Excel y forzar la descarga en el navegador
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

      const fileName = `Informe_Profesores_${fechaInicio}_${fechaFin}.xlsx`;
      saveAs(blob, fileName); // Usar file-saver para descargar

      setMensaje({ type: 'success', text: 'Informe Excel generado y descargado correctamente.' });

    } catch (error: any) {
      console.error('Error al generar el informe de Excel:', error);
      setMensaje({ type: 'error', text: `Hubo un error al generar o descargar el informe: ${error.message}` });
    } finally {
      setCargando(false); // Desactivar estado de carga
    }
  };

  return (
    <div className="generar-reporte-container">
      <h1>Generar Informe de Asistencia de Profesores</h1>

      {mensaje && <div className={`message-box message-${mensaje.type}`}>{mensaje.text}</div>}

      <div className="form-section">
        <h2>Selecciona Rango de Fechas para el Informe</h2>
        <div className="form-group">
          <label htmlFor="fechaInicio">Fecha de Inicio:</label>
          <input
            type="date"
            id="fechaInicio"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="fechaFin">Fecha de Fin:</label>
          <input
            type="date"
            id="fechaFin"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
        </div>
        <button
          className="generate-button"
          onClick={handleDownloadExcel}
          disabled={cargando} // Deshabilitar el botón mientras se carga
        >
          {cargando ? 'Generando...' : 'Generar y Descargar Excel de Asistencia'}
        </button>
      </div>

      {/* Aquí podrías añadir secciones para previsualizaciones de gráficos, etc. si fueran parte del reporte */}
    </div>
  );
};

export default GenerarReporte;
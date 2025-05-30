import React, { useState } from 'react';
import '../css/GenerarReporte.css'; 

const GenerarReporte: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOption, setSelectedOption] = useState('');

  const handleDownloadExcel = () => {
    // Aquí iría la lógica para descargar el Excel
    // Podrías usar los valores de startDate, endDate y selectedOption
    console.log('Descargando Excel con:', { startDate, endDate, selectedOption });
    alert('Simulando descarga de Excel...');
    // Generalmente, harías una llamada a una API aquí:
    // fetch('/api/download-report', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ startDate, endDate, option: selectedOption }),
    // })
    // .then(response => response.blob()) // Para archivos, recibes un blob
    // .then(blob => {
    //   const url = window.URL.createObjectURL(blob);
    //   const a = document.createElement('a');
    //   a.href = url;
    //   a.download = 'reporte.xlsx';
    //   document.body.appendChild(a);
    //   a.click();
    //   a.remove();
    //   window.URL.revokeObjectURL(url);
    // })
    // .catch(error => console.error('Error al descargar el reporte:', error));
  };

  return (
    <div className="report-page-container">
      <h2 className="report-title">GENERAR REPORTE</h2>

      <div className="date-range-section">
        <label className="section-label">RANGO DE FECHAS</label>
        <div className="date-inputs">
          <div className="date-input-wrapper">
            <input
              type="date"
              className="date-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="calendar-icon">&#x1F4C5;</span> 
          </div>
          <span className="date-separator">-</span>
          <div className="date-input-wrapper">
            <input
              type="date"
              className="date-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <span className="calendar-icon">&#x1F4C5;</span>
          </div>
        </div>
      </div>

      <div className="options-section">
        <div className="select-wrapper">
          <select
            className="select-dropdown"
            value={selectedOption}
            onChange={(e) => setSelectedOption(e.target.value)}
          >
            <option value="">ELEGIR OPCION</option>
            <option value="option1">Asistencia</option>
            <option value="option2">Movilidad</option>
            <option value="option3">Ambos</option>
          </select>
          <div className="dropdown-arrow"></div>
        </div>

        <button
          className="download-button"
          onClick={handleDownloadExcel}
        >
          DESCARGAR EXCEL
        </button>
      </div>
    </div>
  );
};

export default GenerarReporte;
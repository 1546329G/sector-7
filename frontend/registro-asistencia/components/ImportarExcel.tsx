// src/components/ImportarExcel.tsx
import React, { useState, ChangeEvent, useCallback } from 'react';
import * as XLSX from 'xlsx';
import '../css/importar-exel.css'; // Asegúrate de que este archivo CSS existe y está bien definido.

// Tipo base para las filas de datos de Excel (genérico para cualquier archivo tabular)
interface ExcelDataRow {
  [key: string]: any;
}

// Estructura esperada para la importación de datos específicos de asistencia
interface SpecificAttendanceRow {
  ID_PROFESOR: string;
  NOMBRE_PROFESOR: string;
  HORAS_LUNES: number;
  HORAS_MARTES: number;
  HORAS_MIERCOLES: number;
  HORAS_JUEVES: number;
  HORAS_VIERNES: number;
  HORAS_SABADO: number;
  HORAS_DOMINGO: number;
  SEMANA_INICIO: string; // Formato YYYY-MM-DD
  SEMANA_FIN: string;    // Formato YYYY-MM-DD
  // Puedes añadir más campos específicos si los necesitas, como periodo, etc.
}

type ImportMode = 'general' | 'specific';

const ImportarExcel: React.FC = () => {
  const [importMode, setImportMode] = useState<ImportMode>('general');
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Estado para la vista previa de datos (primeras N filas)
  const [previewData, setPreviewData] = useState<ExcelDataRow[] | null>(null);
  // Estado para los datos completos importados, según el modo
  const [generalImportedData, setGeneralImportedData] = useState<ExcelDataRow[] | null>(null);
  const [specificImportedData, setSpecificImportedData] = useState<SpecificAttendanceRow[] | null>(null);

  // Cabeceras esperadas para la importación específica de asistencia
  const expectedSpecificHeaders = [
    'ID_PROFESOR',
    'NOMBRE_PROFESOR',
    'HORAS_LUNES',
    'HORAS_MARTES',
    'HORAS_MIERCOLES',
    'HORAS_JUEVES',
    'HORAS_VIERNES',
    'HORAS_SABADO',
    'HORAS_DOMINGO',
    'SEMANA_INICIO',
    'SEMANA_FIN',
  ];

  // Función para limpiar estados al cambiar de modo o al iniciar una nueva carga
  const resetStates = useCallback(() => {
    setFileName(null);
    setError(null);
    setMessage(null);
    setPreviewData(null);
    setGeneralImportedData(null);
    setSpecificImportedData(null);
  }, []);

  const handleFileUpload = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    resetStates(); // Limpiar todos los estados relevantes antes de una nueva carga

    const file = event.target.files?.[0];

    if (!file) {
      setError('No se seleccionó ningún archivo.');
      return;
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    // Tipos MIME y extensiones que serán aceptadas
    const acceptedMimeTypes = [ // <-- CORREGIDO: ERA acceptedMMimeTypes, AHORA acceptedMimeTypes
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/vnd.ms-excel.sheet.binary.macroenabled.12', // .xlsb
      'application/vnd.oasis.opendocument.spreadsheet', // .ods
      'text/csv', // .csv
      'text/tab-separated-values', // .tsv
      'text/plain', // a veces .csv o .tsv pueden ser detectados como text/plain
    ];
    const acceptedExtensions = ['xlsx', 'xls', 'xlsb', 'ods', 'csv', 'tsv'];

    // Validación del tipo de archivo usando MIME type y/o extensión
    const isValidFile = acceptedMimeTypes.includes(file.type) || acceptedExtensions.includes(fileExtension || ''); // <-- CORREGIDO AQUÍ TAMBIÉN

    if (!isValidFile) {
      setError('Por favor, selecciona un archivo tabular válido (.xlsx, .xls, .xlsb, .ods, .csv, .tsv).');
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const data = e.target?.result;
        // La biblioteca XLSX.read puede inferir el tipo de archivo automáticamente
        // para la mayoría de los formatos, pero siempre se le pasa type: 'array'
        const workbook = XLSX.read(data, { type: 'array' });

        // Para CSV/TSV, SheetJS por defecto lee la primera hoja.
        // Para ODS/XLSB, se comportan como Excel con múltiples hojas.
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convertir la hoja de trabajo a un array de objetos JSON
        const json: ExcelDataRow[] = XLSX.utils.sheet_to_json(worksheet);

        if (json.length === 0) {
          setError('El archivo está vacío o no contiene datos válidos en la primera hoja.');
          return;
        }

        // Mostrar vista previa para ambos modos
        setPreviewData(json.slice(0, 5)); // Siempre mostrar las primeras 5 filas

        if (importMode === 'general') {
          setGeneralImportedData(json);
          setMessage({ type: 'success', text: `Archivo "${file.name}" cargado con éxito. Se encontraron ${json.length} filas.` });
        } else { // importMode === 'specific'
          const validatedData: SpecificAttendanceRow[] = [];
          let validationErrors: string[] = [];

          // 1. Validar cabeceras
          const actualHeaders = Object.keys(json[0] || {});
          const missingHeaders = expectedSpecificHeaders.filter(header => !actualHeaders.includes(header));

          if (missingHeaders.length > 0) {
            setError(`Error: Faltan las siguientes columnas en el archivo para la importación específica: ${missingHeaders.join(', ')}. Por favor, usa la plantilla correcta.`);
            return;
          }

          // 2. Validar y mapear datos
          json.forEach((row, index) => {
            const rowNumber = index + 2; // +1 por índice base 0, +1 por fila de cabecera en Excel

            const idProfesor = String(row.ID_PROFESOR || '').trim();
            const nombreProfesor = String(row.NOMBRE_PROFESOR || '').trim();
            const semanaInicio = String(row.SEMANA_INICIO || '').trim();
            const semanaFin = String(row.SEMANA_FIN || '').trim();

            // Validar que las fechas tengan un formato similar a YYYY-MM-DD
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!idProfesor || !nombreProfesor || !dateRegex.test(semanaInicio) || !dateRegex.test(semanaFin)) {
                validationErrors.push(`Fila ${rowNumber}: Campos obligatorios (ID_PROFESOR, NOMBRE_PROFESOR, SEMANA_INICIO, SEMANA_FIN) faltantes o con formato incorrecto.`);
                return;
            }
            
            const parseHour = (value: any) => {
              const num = parseInt(value, 10);
              return isNaN(num) || num < 0 ? 0 : num; // Asegura que sean números no negativos
            };

            const newRow: SpecificAttendanceRow = {
              ID_PROFESOR: idProfesor,
              NOMBRE_PROFESOR: nombreProfesor,
              HORAS_LUNES: parseHour(row.HORAS_LUNES),
              HORAS_MARTES: parseHour(row.HORAS_MARTES),
              HORAS_MIERCOLES: parseHour(row.HORAS_MIERCOLES),
              HORAS_JUEVES: parseHour(row.HORAS_JUEVES),
              HORAS_VIERNES: parseHour(row.HORAS_VIERNES),
              HORAS_SABADO: parseHour(row.HORAS_SABADO),
              HORAS_DOMINGO: parseHour(row.HORAS_DOMINGO),
              SEMANA_INICIO: semanaInicio,
              SEMANA_FIN: semanaFin,
            };
            validatedData.push(newRow);
          });

          if (validationErrors.length > 0) {
            setError(`Se encontraron errores de validación en ${validationErrors.length} filas. Por favor, revisa el archivo. Primeros errores: ${validationErrors.slice(0, 3).join('; ')}...`);
            setSpecificImportedData(null); // No cargar datos si hay errores críticos
          } else if (validatedData.length === 0 && json.length > 0) {
            setError("No se pudo validar ninguna fila del archivo para la importación específica. Verifica el formato de los datos.");
            setSpecificImportedData(null);
          } else {
            setSpecificImportedData(validatedData);
            setMessage({ type: 'success', text: `Archivo "${file.name}" cargado y validado con éxito. Se importaron ${validatedData.length} de ${json.length} filas.` });
          }
        }

      } catch (err) {
        console.error('Error al leer o procesar el archivo:', err);
        setError('Error al procesar el archivo. Asegúrate de que sea un formato válido y no esté corrupto.');
      }
    };

    reader.onerror = () => {
      setError('Error al leer el archivo. Inténtalo de nuevo.');
    };

    reader.readAsArrayBuffer(file);
  }, [importMode, resetStates, expectedSpecificHeaders]);

  const handleProcessData = useCallback(() => {
    // Aquí es donde enviarías los datos (generalImportedData o specificImportedData)
    // a tu backend o los procesarías de alguna otra forma.
    if (importMode === 'general' && generalImportedData) {
      console.log('Procesando datos generales:', generalImportedData);
      setMessage({ type: 'info', text: `Enviando ${generalImportedData.length} filas de datos generales al servidor... (Simulado)` });
      // Simular una llamada a la API
      setTimeout(() => {
        setMessage({ type: 'success', text: '¡Datos generales procesados y guardados con éxito! (Simulado)' });
        resetStates(); // Limpiar después de procesar
      }, 1500);
    } else if (importMode === 'specific' && specificImportedData) {
      console.log('Procesando datos específicos:', specificImportedData);
      setMessage({ type: 'info', text: `Enviando ${specificImportedData.length} filas de datos específicos al servidor... (Simulado)` });
      // Simular una llamada a la API
      setTimeout(() => {
        setMessage({ type: 'success', text: '¡Datos de asistencia específicos procesados y guardados con éxito! (Simulado)' });
        resetStates(); // Limpiar después de procesar
      }, 1500);
    } else {
      setMessage({ type: 'error', text: 'No hay datos para procesar.' });
    }
  }, [importMode, generalImportedData, specificImportedData, resetStates]);


  // Determinar los datos a mostrar en la tabla de vista previa o resultados
  const dataToDisplay = importMode === 'general' ? generalImportedData : specificImportedData;
  const tableHeaders = previewData && previewData.length > 0 ? Object.keys(previewData[0]) : [];

  return (
    <div className="import-excel-container">
      <h1>Importar Datos  exel</h1>

      <div className="view-mode-selector">
        <button
          onClick={() => { resetStates(); setImportMode('general'); }}
          className={importMode === 'general' ? 'active' : ''}
        >
          Importar cualquier exel (General)
        </button>
        <button
          onClick={() => { resetStates(); setImportMode('specific'); }}
          className={importMode === 'specific' ? 'active' : ''}
        >
          Importación  espesifica (se importaran datos requeridor por la base de datos )
        </button>
      </div>

      <div className="header-controls">
        <p className="description-text">
          {importMode === 'general'
            ? 'Sube cualquier archivo tabular (Excel, CSV, ODS, etc.) para visualizar sus datos.'
            : `Sube un archivo tabular con los datos de asistencia. El archivo debe contener las siguientes columnas exactas: ${expectedSpecificHeaders.join(', ')}. Formatos aceptados: .xlsx, .xls, .xlsb, .ods, .csv, .tsv.`}
        </p>

        <div className="file-upload-box">
          <input
            type="file"
            // Amplía la lista de tipos de archivo aceptados
            accept=".xlsx, .xls, .xlsb, .ods, .csv, .tsv, text/csv, text/tab-separated-values, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/vnd.ms-excel.sheet.binary.macroenabled.12, application/vnd.oasis.opendocument.spreadsheet"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="excel-upload-input"
          />
          <label htmlFor="excel-upload-input" className="file-upload-label">
            Seleccionar Archivo
          </label>
          {fileName && <p className="file-name-display">Archivo seleccionado: <strong>{fileName}</strong></p>}
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}
      {message && <div className={`message-box message-${message.type}`}>{message.text}</div>}


      {/* Sección de Vista Previa (primeras 5 filas del archivo original) */}
      {previewData && previewData.length > 0 && (
        <div className="table-container">
          <h2>Vista Previa del Archivo ({fileName})</h2>
          <p className="info-text">Se muestran las primeras 5 filas para que confirmes el formato y las cabeceras.</p>
          <table className="data-table preview-table">
            <thead>
              <tr>
                {tableHeaders.map((key) => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {tableHeaders.map((key, colIndex) => (
                    <td key={colIndex}>
                      {row[key] !== null && row[key] !== undefined ? String(row[key]) : ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sección de Resultados Finales (solo si hay datos importados y validados) */}
      {dataToDisplay && dataToDisplay.length > 0 && (
        <div className="results-section">
          <h2>
            {importMode === 'general' ? 'Datos Cargados (General)' : 'Datos de Asistencia Validados'}
          </h2>
          <p className="info-text">
            Total de filas {importMode === 'general' ? 'cargadas' : 'validadas'}: {dataToDisplay.length}
          </p>

          <table className="data-table full-data-table">
            <thead>
              <tr>
                {Object.keys(dataToDisplay[0]).map((key) => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataToDisplay.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {Object.values(row).map((value, colIndex) => (
                    <td key={colIndex}>
                      {value !== null && value !== undefined ? String(value) : ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="action-buttons-container">
            <button
              onClick={handleProcessData}
              disabled={!dataToDisplay || dataToDisplay.length === 0}
              className="button-primary"
            >
              Procesar y Guardar Datos
            </button>
            <button
              onClick={resetStates}
              className="button-secondary"
            >
              Cargar Otro Archivo
            </button>
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay datos cargados pero se está en un modo específico */}
      {(!previewData && !error && !message && importMode === 'specific') && (
        <p className="info-text">
          Para la importación de asistencia, por favor, sube un archivo tabular que cumpla con la plantilla específica.
        </p>
      )}

      <h5>lo hizo gandy,</h5>

      
      <h5>aun esta en proceso:   falata configurar algunas cosas pero si funciona , si exporta, aun falta configurar </h5> 
    </div>
  );
};

export default ImportarExcel;
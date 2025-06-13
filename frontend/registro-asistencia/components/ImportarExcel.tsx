import React, { useState, ChangeEvent } from 'react';
import * as XLSX from 'xlsx'; // Importa la librería xlsx

// Estilos CSS incrustados directamente en el archivo App.tsx
// Esto no es ideal para proyectos grandes, pero funciona para un archivo único.
const appStyles: React.CSSProperties = {
  minHeight: '100vh', // Asegura que el contenedor principal ocupe al menos toda la altura de la ventana
  position: 'relative', // Necesario para que el footer absoluto funcione correctamente
  fontFamily: 'Arial, sans-serif',
};

const headerStyles: React.CSSProperties = {
  textAlign: 'center',
  padding: '20px',
  background: '#f8f8f8',
  borderBottom: '1px solid #eee',
};

const mainStyles: React.CSSProperties = {
  paddingBottom: '80px', // Espacio para el footer. Ajusta si la altura del footer cambia.
};

const importExcelContainerStyles: React.CSSProperties = {
  textAlign: 'center',
  marginTop: '50px',
  padding: '20px',
};

const fileUploadBoxStyles: React.CSSProperties = {
  marginBottom: '20px',
  border: '1px solid #ccc',
  padding: '20px',
  borderRadius: '8px',
  maxWidth: '600px',
  margin: '20px auto',
};

const fileUploadLabelStyles: React.CSSProperties = {
  backgroundColor: '#007bff',
  color: 'white',
  padding: '10px 20px',
  borderRadius: '5px',
  cursor: 'pointer',
  fontWeight: 'bold',
  display: 'inline-block',
  marginBottom: '10px',
};

const tableContainerStyles: React.CSSProperties = {
  marginTop: '30px',
  overflowX: 'auto',
  maxWidth: '90%',
  margin: '0 auto',
};

const tableStyles: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: '15px',
};

const tableHeaderRowStyles: React.CSSProperties = {
  backgroundColor: '#f2f2f2',
};

const tableCellStyles: React.CSSProperties = {
  border: '1px solid #ddd',
  padding: '8px',
  textAlign: 'left',
};

// Estilos para el pie de página (footer)
const footerStyles: React.CSSProperties = {
  backgroundColor: '#f2f2f2', // Color de fondo similar al de Google
  padding: '15px 25px', // Espaciado interno
  borderTop: '1px solid #e4e4e4', // Línea superior
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between', // Espacia los grupos de enlaces y la información
  alignItems: 'center', // Alinea verticalmente
  fontSize: '13px',
  color: '#707070',
  position: 'absolute', // Posicionamiento absoluto respecto a su padre posicionado
  bottom: 0, // Lo fija al fondo de su padre posicionado
  width: '100%', // Ocupa todo el ancho
  boxSizing: 'border-box', // Incluye padding y border en el width
};

const footerLinksContainerStyles: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '20px', // Espacio entre los enlaces
};

const footerLinkStyles: React.CSSProperties = {
  textDecoration: 'none', // Quita el subrayado por defecto
  color: '#707070', // Color del texto del enlace
};

const footerInfoStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column', // Apilar los elementos verticalmente
  alignItems: 'flex-end', // Alinear a la derecha
  textAlign: 'right',
};

const gandySignatureStyles: React.CSSProperties = {
  marginTop: '5px', // Pequeño margen superior para separarlo de "Perú"
  fontSize: '11px', // Un poco más pequeño para una firma
  color: '#999', // Un color ligeramente más tenue
};


// Definición de tipo para los datos de Excel
interface ExcelDataRow {
  [key: string]: any; // Permite propiedades dinámicas para los datos de la tabla
}

function App() {
  // Estado para el componente ImportarExcel
  const [excelData, setExcelData] = useState<ExcelDataRow[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    setError(null); // Limpia errores previos
    setExcelData(null); // Limpia datos previos
    setFileName(null); // Limpia el nombre del archivo previo

    const file = event.target.files?.[0];

    if (!file) {
      setError('No se seleccionó ningún archivo.');
      return;
    }

    if (
      !file.type.includes('spreadsheetml.sheet') && // .xlsx
      !file.type.includes('vnd.ms-excel') // .xls
    ) {
      setError('Por favor, selecciona un archivo Excel válido (.xlsx o .xls).');
      return;
    }

    setFileName(file.name); // Muestra el nombre del archivo seleccionado

    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });

        // Asume que quieres leer la primera hoja del libro
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convierte la hoja de cálculo a un array de objetos JSON
        const json: ExcelDataRow[] = XLSX.utils.sheet_to_json(worksheet);

        if (json.length === 0) {
          setError('El archivo Excel está vacío o no contiene datos válidos.');
          return;
        }

        setExcelData(json);
        console.log('Datos del Excel:', json);

      } catch (err) {
        console.error('Error al leer el archivo Excel:', err);
        setError('Error al procesar el archivo Excel. Asegúrate de que sea un formato válido.');
      }
    };

    reader.onerror = () => {
      setError('Error al leer el archivo.');
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div style={appStyles}>
      {/* Encabezado de la aplicación */}
      <header style={headerStyles}>
        <h1>Mi Aplicación de Reportes</h1>
      </header>

      {/* Contenido principal de la aplicación */}
      <main style={mainStyles}>
        {/* Sección de Importar Excel */}
        <div style={importExcelContainerStyles}>
          <h1>Importar Datos desde Excel</h1>

          <div style={fileUploadBoxStyles}>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="excel-upload-input"
            />
            <label htmlFor="excel-upload-input" style={fileUploadLabelStyles}>
              Seleccionar Archivo Excel
            </label>
            {fileName && <p>Archivo seleccionado: <strong>{fileName}</strong></p>}
            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
          </div>

          {excelData && excelData.length > 0 && (
            <div style={tableContainerStyles}>
              <h2>Vista Previa de Datos</h2>
              <table style={tableStyles}>
                <thead>
                  <tr style={tableHeaderRowStyles}>
                    {Object.keys(excelData[0]).map((key) => (
                      <th key={key} style={tableCellStyles}>
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {excelData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Object.values(row).map((value, colIndex) => (
                        <td key={colIndex} style={tableCellStyles}>
                          {value !== null && value !== undefined ? String(value) : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Pie de página (Footer) */}
      <footer style={footerStyles}>
        <div style={footerLinksContainerStyles}>

        
          <a href="/settings" style={footerLinkStyles}>lo hizo gandy</a>
        </div>
       
      </footer>
    </div>
  );
}

export default App;
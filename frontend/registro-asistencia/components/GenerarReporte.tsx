import React, { useState, useRef } from 'react';
import '../css/GenerarReporte.css'; // Asegúrate de que esta ruta sea correcta

// Importar ExcelJS y file-saver
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Importar html2canvas
import html2canvas from 'html2canvas';

// Importar componentes y registros de Chart.js
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Registrar los componentes de Chart.js que vamos a usar globalmente
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// --- 1. Definición de Tipos (Interfaces) ---
interface DailyData {
  days: (number | null)[];
  total: number;
}

interface EmployeeData {
  id: string;
  name: string;
  data: {
    horasPresencial: DailyData;
    horasTeletrabajo: DailyData;
    importeAmm: DailyData;
    importeBcg: DailyData;
    monthlyTotal: number;
  };
}

const GenerarReporte: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOption, setSelectedOption] = useState('');

  // Ref para el contenedor de gráficos ocultos y para el canvas temporal
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartCanvasRef = useRef<HTMLCanvasElement>(null); // Referencia al canvas para Chart.js

  // --- Datos de Ejemplo (incluye los 12 nuevos instructores con datos dummy) ---
  const dummyEmployeesData: EmployeeData[] = [
    {
      id: '00168514',
      name: 'AMONES CASTILLO, EDWIN JOSE',
      data: {
        horasPresencial: {
          days: [null, null, null, null, null, null, null, 5, 5, 5, 5, 5, null, null, 5, 5, 5, 5, 5, null, null, 5, 5, 5, 5, 5, null, null, 4, 0], // 30 días
          total: 84.00
        },
        horasTeletrabajo: {
          days: [null, null, null, null, null, null, null, 0, 0, 0, 0, 0, null, null, 0, 0, 0, 0, 0, null, null, 0, 0, 0, 0, 0, null, null, 0, 0],
          total: 0.00
        },
        importeAmm: {
          days: [null, null, null, null, null, null, null, 6.50, 6.50, 6.50, 6.50, 6.50, null, null, 6.50, 6.50, 6.50, 6.50, 6.50, null, null, 6.50, 6.50, 6.50, 6.50, 6.50, null, null, 6.50, 0.00],
          total: 60.40
        },
        importeBcg: {
          days: [null, null, null, null, null, null, null, 0.00, 0.00, 0.00, 0.00, 0.00, null, null, 0.00, 0.00, 0.00, 0.00, 0.00, null, null, 0.00, 0.00, 0.00, 0.00, 0.00, null, null, 0.00, 0.00],
          total: 10.30
        },
        monthlyTotal: 94.70 
      }
    },
    {
      id: '001634701',
      name: 'ANOLISE JIHUANA, YUSELENIN',
      data: {
        horasPresencial: {
          days: [null, null, null, null, null, null, null, 6, 6, 6, 6, 6, null, null, 6, 6, 6, 6, 6, null, null, 6, 6, 6, 6, 6, null, null, 0, 0],
          total: 48.00
        },
        horasTeletrabajo: {
          days: [null, null, null, null, null, null, null, 0, 0, 0, 0, 0, null, null, 0, 0, 0, 0, 0, null, null, 0, 0, 0, 0, 0, null, null, 0, 0],
          total: 0.00
        },
        importeAmm: {
          days: [null, null, null, null, null, null, null, 6.50, 6.50, 6.50, 6.50, 6.50, null, null, 6.50, 6.50, 6.50, 6.50, 6.50, null, null, 6.50, 6.50, 6.50, 6.50, 6.50, null, null, 0.00, 0.00],
          total: 65.00
        },
        importeBcg: {
          days: [null, null, null, null, null, null, null, 0.00, 0.00, 0.00, 0.00, 0.00, null, null, 0.00, 0.00, 0.00, 0.00, 0.00, null, null, 0.00, 0.00, 0.00, 0.00, 0.00, null, null, 0.00, 0.00],
          total: 0.00
        },
        monthlyTotal: 65.00
      }
    },
    { id: 'INSTP001', name: 'Juan Pérez', data: { horasPresencial: { days: [null, null, null, null, null, null, null, 3, 4, 3, 5, 4, null, null, 5, 6, 5, 4, 3, null, null, 2, 3, 4, 5, 5, null, null, 4, 0], total: 56.00 }, horasTeletrabajo: { days: Array(30).fill(null), total: 0.00 }, importeAmm: { days: Array(30).fill(null), total: 0.00 }, importeBcg: { days: Array(30).fill(null), total: 0.00 }, monthlyTotal: 0.00 } },
    { id: 'INSTP002', name: 'María García', data: { horasPresencial: { days: [null, null, null, null, null, null, null, 4, 4, 5, 4, 6, null, null, 6, 5, 5, 4, 4, null, null, 5, 5, 5, 6, 4, null, null, 3, 0], total: 68.00 }, horasTeletrabajo: { days: Array(30).fill(null), total: 0.00 }, importeAmm: { days: Array(30).fill(null), total: 0.00 }, importeBcg: { days: Array(30).fill(null), total: 0.00 }, monthlyTotal: 0.00 } },
    { id: 'INSTP003', name: 'Carlos Rodríguez', data: { horasPresencial: { days: [null, null, null, null, null, null, null, 2, 3, 2, 3, 4, null, null, 4, 3, 3, 2, 3, null, null, 4, 5, 4, 3, 2, null, null, 2, 0], total: 50.00 }, horasTeletrabajo: { days: Array(30).fill(null), total: 0.00 }, importeAmm: { days: Array(30).fill(null), total: 0.00 }, importeBcg: { days: Array(30).fill(null), total: 0.00 }, monthlyTotal: 0.00 } },
    { id: 'INSTP004', name: 'Ana López', data: { horasPresencial: { days: [null, null, null, null, null, null, null, 5, 5, 5, 5, 5, null, null, 5, 5, 5, 5, 5, null, null, 5, 5, 5, 5, 5, null, null, 5, 0], total: 100.00 }, horasTeletrabajo: { days: Array(30).fill(null), total: 0.00 }, importeAmm: { days: Array(30).fill(null), total: 0.00 }, importeBcg: { days: Array(30).fill(null), total: 0.00 }, monthlyTotal: 0.00 } },
    { id: 'INSTP005', name: 'Pedro Martínez', data: { horasPresencial: { days: [null, null, null, null, null, null, null, 3, 3, 3, 3, 3, null, null, 3, 3, 3, 3, 3, null, null, 3, 3, 3, 3, 3, null, null, 3, 0], total: 60.00 }, horasTeletrabajo: { days: Array(30).fill(null), total: 0.00 }, importeAmm: { days: Array(30).fill(null), total: 0.00 }, importeBcg: { days: Array(30).fill(null), total: 0.00 }, monthlyTotal: 0.00 } },
    { id: 'INSTP006', name: 'Laura González', data: { horasPresencial: { days: [null, null, null, null, null, null, null, 4, 4, 4, 4, 4, null, null, 4, 4, 4, 4, 4, null, null, 4, 4, 4, 4, 4, null, null, 4, 0], total: 80.00 }, horasTeletrabajo: { days: Array(30).fill(null), total: 0.00 }, importeAmm: { days: Array(30).fill(null), total: 0.00 }, importeBcg: { days: Array(30).fill(null), total: 0.00 }, monthlyTotal: 0.00 } },
    { id: 'INSTP007', name: 'Diego Hernández', data: { horasPresencial: { days: [null, null, null, null, null, null, null, 5, 5, 5, 5, 5, null, null, 5, 5, 5, 5, 5, null, null, 5, 5, 5, 5, 5, null, null, 5, 0], total: 100.00 }, horasTeletrabajo: { days: Array(30).fill(null), total: 0.00 }, importeAmm: { days: Array(30).fill(null), total: 0.00 }, importeBcg: { days: Array(30).fill(null), total: 0.00 }, monthlyTotal: 0.00 } },
    { id: 'INSTP008', name: 'Sofía Ramírez', data: { horasPresencial: { days: [null, null, null, null, null, null, null, 6, 6, 6, 6, 6, null, null, 6, 6, 6, 6, 6, null, null, 6, 6, 6, 6, 6, null, null, 6, 0], total: 120.00 }, horasTeletrabajo: { days: Array(30).fill(null), total: 0.00 }, importeAmm: { days: Array(30).fill(null), total: 0.00 }, importeBcg: { days: Array(30).fill(null), total: 0.00 }, monthlyTotal: 0.00 } },
    { id: 'INSTP009', name: 'Javier Torres', data: { horasPresencial: { days: [null, null, null, null, null, null, null, 4, 3, 4, 3, 4, null, null, 3, 4, 3, 4, 3, null, null, 4, 3, 4, 3, 4, null, null, 3, 0], total: 70.00 }, horasTeletrabajo: { days: Array(30).fill(null), total: 0.00 }, importeAmm: { days: Array(30).fill(null), total: 0.00 }, importeBcg: { days: Array(30).fill(null), total: 0.00 }, monthlyTotal: 0.00 } },
    { id: 'INSTP010', name: 'Valeria Ruiz', data: { horasPresencial: { days: [null, null, null, null, null, null, null, 5, 6, 5, 6, 5, null, null, 6, 5, 6, 5, 6, null, null, 5, 6, 5, 6, 5, null, null, 6, 0], total: 115.00 }, horasTeletrabajo: { days: Array(30).fill(null), total: 0.00 }, importeAmm: { days: Array(30).fill(null), total: 0.00 }, importeBcg: { days: Array(30).fill(null), total: 0.00 }, monthlyTotal: 0.00 } },
    { id: 'INSTP011', name: 'Miguel Soto', data: { horasPresencial: { days: [null, null, null, null, null, null, null, 3, 4, 3, 4, 3, null, null, 4, 3, 4, 3, 4, null, null, 3, 4, 3, 4, 3, null, null, 4, 0], total: 70.00 }, horasTeletrabajo: { days: Array(30).fill(null), total: 0.00 }, importeAmm: { days: Array(30).fill(null), total: 0.00 }, importeBcg: { days: Array(30).fill(null), total: 0.00 }, monthlyTotal: 0.00 } },
    { id: 'INSTP012', name: 'Gabriela Díaz', data: { horasPresencial: { days: [null, null, null, null, null, null, null, 5, 5, 5, 5, 5, null, null, 5, 5, 5, 5, 5, null, null, 5, 5, 5, 5, 5, null, null, 5, 0], total: 100.00 }, horasTeletrabajo: { days: Array(30).fill(null), total: 0.00 }, importeAmm: { days: Array(30).fill(null), total: 0.00 }, importeBcg: { days: Array(30).fill(null), total: 0.00 }, monthlyTotal: 0.00 } },
  ];

  // Función asíncrona para generar el gráfico como imagen y devolver su base64
  const generateChartImage = async (employee: EmployeeData): Promise<string> => {
    if (!chartContainerRef.current || !chartCanvasRef.current) {
      console.error('El contenedor de gráficos o el canvas no están disponibles para html2canvas.');
      return '';
    }

    // Configurar el canvas para Chart.js
    const canvas = chartCanvasRef.current;
    canvas.width = 400; // Dimensiones del gráfico para la captura
    canvas.height = 200;

    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Destruir cualquier instancia de Chart.js existente en este canvas
    const existingChart = ChartJS.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }

    // Crear la nueva instancia de Chart.js
    const chartInstance = new ChartJS(ctx, {
      type: 'line',
      data: {
        labels: Array.from({ length: 30 }, (_, i) => `${i + 1}`), // Días del 1 al 30
        datasets: [
          {
            label: 'Horas Presenciales',
            data: employee.data.horasPresencial.days.map(hour => hour === null ? 0 : hour), // Reemplazar null con 0
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            tension: 0.1, // Suaviza la línea
            pointRadius: 3,
            pointBackgroundColor: 'rgb(75, 192, 192)',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top' as const,
          },
          title: {
            display: true,
            text: `Horas Presenciales de ${employee.name}`,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Día del Mes',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Horas',
            },
            beginAtZero: true,
            max: 10, // Ajusta el máximo del eje Y según tus datos (ej. 8 horas por día max)
          },
        },
      },
    });

    // Esperar a que el gráfico se renderice completamente en el canvas
    await new Promise(resolve => setTimeout(resolve, 100)); // Pequeña pausa para asegurar el renderizado

    // Capturar el canvas a una imagen usando html2canvas
    const image = await html2canvas(canvas, {
      backgroundColor: 'white', // Asegura un fondo blanco para la imagen
      scale: 2, // Aumenta la escala para una mejor resolución
      useCORS: true, // Importante si hay imágenes o fuentes de origen cruzado
    });
    const imageData = image.toDataURL('image/png');

    // Destruir la instancia de Chart.js después de capturar para liberar recursos
    chartInstance.destroy();
    
    return imageData.split(',')[1]; // Retorna solo la parte Base64 (sin "data:image/png;base64,")
  };


  // Función para generar un reporte Excel de Tipo 1 (Asistencia)
  const handleDownloadExcelOption1 = async () => {
    console.log('Botón "DESCARGAR EXCEL (Asistencia)" presionado. Iniciando generación...');
    console.log('Generando Excel (Asistencia) para el rango:', { startDate, endDate, selectedOption });

    const monthName = "JUNIO"; // Esto debería ser dinámico basado en la fecha de inicio
    const totalDaysInMonth = 30; // Esto también debería ser dinámico (ej. new Date(year, month, 0).getDate())
    const daysOfWeek = ['L', 'M', 'Mi', 'J', 'V', 'S', 'D']; 

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Asistencia');

    // --- Definir estilos comunes ---
    const blueFill: Partial<ExcelJS.Fill> = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0070C0' } }; 
    const yellowFill: Partial<ExcelJS.Fill> = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }; 
    
    const boldWhiteFont: Partial<ExcelJS.Font> = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    const boldBlackFont: Partial<ExcelJS.Font> = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF000000' } };
    const regularBlackFont: Partial<ExcelJS.Font> = { name: 'Calibri', size: 11, bold: false, color: { argb: 'FF000000' } };

    const thinBorder: Partial<ExcelJS.Border> = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
    const centerAlign: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'center' };
    const leftAlign: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'left' };
    const rightAlign: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'right' };

    // --- Configurar ancho de columnas inicial ---
    const graphColsWidth = 4; // Ancho de cada columna en Excel para el área del gráfico
    const numGraphCols = 15; // Número de columnas que ocupará el gráfico
    const graphStartColIndex = totalDaysInMonth + 4; // Columna donde empieza el gráfico (índice 1-based para Excel)

    let columnsConfig: Partial<ExcelJS.Column>[] = [
      { key: 'colA', width: 10 }, 
      { key: 'colB', width: 10 }, 
    ];
    for (let i = 0; i < totalDaysInMonth; i++) {
      columnsConfig.push({ key: `day${i + 1}`, width: 4.5 }); 
    }
    columnsConfig.push(
      { key: 'totalHoras', width: 15 }, 
      { key: 'unidades', width: 10 } 
    );
    // Añadir columnas para el gráfico
    for (let i = 0; i < numGraphCols; i++) {
      columnsConfig.push({ key: `graphCol${i + 1}`, width: graphColsWidth });
    }
    worksheet.columns = columnsConfig;


    let currentRow = 1; 

    for (const employee of dummyEmployeesData) { 
      // --- Sección de Cabecera del Empleado (ID y Nombre) ---
      // Fila 1: ID
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      Object.assign(worksheet.getCell(`A${currentRow}`), { 
        value: 'ID', font: boldWhiteFont, fill: blueFill, alignment: leftAlign, border: thinBorder 
      });
      
      const idEndCol = worksheet.columns[totalDaysInMonth + 1].letter;
      worksheet.mergeCells(`C${currentRow}:${idEndCol}${currentRow}`);
      Object.assign(worksheet.getCell(`C${currentRow}`), { 
        value: employee.id, 
        font: boldWhiteFont, 
        fill: blueFill, 
        alignment: leftAlign, 
        border: thinBorder,
        numFmt: '@' 
      });

      // --- Generar y añadir la imagen del gráfico ---
      try {
        const chartBase64 = await generateChartImage(employee);
        if (chartBase64) {
          const imageId = workbook.addImage({
            base64: chartBase64,
            extension: 'png',
          });

          const startColIndexExcel = graphStartColIndex - 1; 
          const startRowIndexExcel = currentRow - 1; 
          
          const endRowForImage = currentRow + 6; 

          worksheet.addImage(imageId, {
            tl: { col: startColIndexExcel, row: startRowIndexExcel }, 
            ext: { width: 400 * 0.75, height: 200 * 0.75 }, 
          });
          
          const startColLetterForMerge = worksheet.columns[graphStartColIndex].letter;
          const endColLetterForMerge = worksheet.columns[graphStartColIndex + numGraphCols -1].letter;

          worksheet.mergeCells(`${startColLetterForMerge}${currentRow}:${endColLetterForMerge}${endRowForImage}`);
          const mergedCell = worksheet.getCell(`${startColLetterForMerge}${currentRow}`);
          mergedCell.border = thinBorder;
          mergedCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }; 
        }
      } catch (chartError) {
        console.error(`Error al generar o insertar el gráfico para ${employee.name}:`, chartError);
      }

      currentRow++; 

      // Fila 2: Nombre / "SÓLO TELETRABAJO"
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      Object.assign(worksheet.getCell(`A${currentRow}`), { 
        value: 'SÓLO TELETRABAJO', font: boldWhiteFont, fill: blueFill, alignment: leftAlign, border: thinBorder 
      });

      worksheet.mergeCells(`C${currentRow}:${idEndCol}${currentRow}`);
      Object.assign(worksheet.getCell(`C${currentRow}`), { 
        value: employee.name, 
        font: boldWhiteFont, 
        fill: blueFill, 
        alignment: leftAlign, 
        border: thinBorder 
      });

      currentRow++;

      // Fila 3: Mes (ej. JUNIO)
      Object.assign(worksheet.getCell(`A${currentRow}`), { fill: yellowFill, border: thinBorder });

      const monthEndCol = worksheet.columns[totalDaysInMonth + 1].letter;
      worksheet.mergeCells(`B${currentRow}:${monthEndCol}${currentRow}`);
      Object.assign(worksheet.getCell(`B${currentRow}`), { 
        value: monthName, 
        font: boldBlackFont, 
        fill: yellowFill, 
        alignment: centerAlign, 
        border: thinBorder 
      });
      
      const totalHoursColLetter = worksheet.columns[totalDaysInMonth + 2].letter;
      Object.assign(worksheet.getCell(`${totalHoursColLetter}${currentRow}`), { 
        value: 'TOTAL DE HORAS', 
        font: boldBlackFont, 
        fill: yellowFill, 
        alignment: centerAlign, 
        border: thinBorder 
      });
      
      const unitsColLetter = worksheet.columns[totalDaysInMonth + 3].letter;
      Object.assign(worksheet.getCell(`${unitsColLetter}${currentRow}`), { fill: yellowFill, border: thinBorder });

      currentRow++; 

      // --- Cabecera de Días (L, M, Mi... y 1, 2, 3...) ---
      const dayRow = worksheet.getRow(currentRow);
      const dateRow = worksheet.getRow(currentRow + 1);

      worksheet.mergeCells(`A${currentRow}:A${currentRow + 1}`);
      Object.assign(worksheet.getCell(`A${currentRow}`), { 
        value: 'N°', 
        font: boldBlackFont, 
        alignment: centerAlign, 
        border: thinBorder 
      });

      let currentDayOfWeekIndex = new Date(startDate || '2025-06-01').getDay(); 
      if (currentDayOfWeekIndex === 0) currentDayOfWeekIndex = 6; 
      else currentDayOfWeekIndex--; 


      for (let i = 0; i < totalDaysInMonth; i++) {
        const colLetter = worksheet.columns[i + 1].letter;
        
        Object.assign(dayRow.getCell(colLetter), { 
          value: daysOfWeek[currentDayOfWeekIndex], 
          font: boldBlackFont, 
          alignment: centerAlign, 
          border: thinBorder 
        });

        Object.assign(dateRow.getCell(colLetter), { 
          value: i + 1, 
          font: boldBlackFont, 
          alignment: centerAlign, 
          border: thinBorder 
        });

        currentDayOfWeekIndex = (currentDayOfWeekIndex + 1) % 7;
      }

      worksheet.mergeCells(`${totalHoursColLetter}${currentRow}:${totalHoursColLetter}${currentRow + 1}`);
      Object.assign(worksheet.getCell(`${totalHoursColLetter}${currentRow}`), { 
        value: 'TOTAL', 
        font: boldBlackFont, 
        alignment: centerAlign, 
        border: thinBorder 
      });

      worksheet.mergeCells(`${unitsColLetter}${currentRow}:${unitsColLetter}${currentRow + 1}`);
      Object.assign(worksheet.getCell(`${unitsColLetter}${currentRow}`), { 
        fill: yellowFill, 
        border: thinBorder 
      });

      currentRow += 2; 

      // --- Filas de Datos (Horas, Importe, etc.) ---
      const dataRowsConfig = [
        { label: 'N° DE HORAS PRESENCIAL', key: 'horasPresencial', unit: 'HORAS' },
        { label: 'N° DE HORAS TELETRABAJO', key: 'horasTeletrabajo', unit: 'HORAS' },
        { label: 'IMPORTE A PAGAR AMM S/', key: 'importeAmm', unit: 'SOLES' },
        { label: 'IMPORTE A PAGAR BCG S/', key: 'importeBcg', unit: 'SOLES' }
      ];

      dataRowsConfig.forEach(rowInfo => {
        const rowData: DailyData = employee.data[rowInfo.key as keyof typeof employee.data];
        const newRow = worksheet.addRow([]); 

        Object.assign(newRow.getCell('A'), { 
          value: rowInfo.label, 
          font: regularBlackFont, 
          alignment: leftAlign, 
          border: thinBorder 
        });

        for (let i = 0; i < totalDaysInMonth; i++) {
          const colLetter = worksheet.columns[i + 1].letter;
          Object.assign(newRow.getCell(colLetter), { 
            value: rowData.days[i], 
            font: regularBlackFont, 
            alignment: centerAlign, 
            border: thinBorder 
          });
        }

        Object.assign(newRow.getCell(totalHoursColLetter), { 
          value: rowData.total, 
          font: boldBlackFont, 
          alignment: centerAlign, 
          border: thinBorder 
        });
        
        Object.assign(newRow.getCell(unitsColLetter), { 
          value: rowInfo.unit, 
          font: boldBlackFont, 
          fill: yellowFill, 
          alignment: centerAlign, 
          border: thinBorder 
        });

        currentRow++;
      });

      // Fila "MENSUAL"
      const monthlyRow = worksheet.addRow([]);
      Object.assign(monthlyRow.getCell('A'), { fill: yellowFill, border: thinBorder });
      
      const monthlyEndCol = worksheet.columns[totalDaysInMonth + 1].letter;
      worksheet.mergeCells(`B${currentRow}:${monthlyEndCol}${currentRow}`);
      Object.assign(monthlyRow.getCell('B'), { 
        value: 'MENSUAL', 
        font: boldBlackFont, 
        fill: yellowFill, 
        alignment: rightAlign, 
        border: thinBorder 
      });

      Object.assign(monthlyRow.getCell(totalHoursColLetter), { 
        value: employee.data.monthlyTotal, 
        font: boldBlackFont, 
        fill: yellowFill, 
        alignment: centerAlign, 
        border: thinBorder 
      });
      
      Object.assign(monthlyRow.getCell(unitsColLetter), { 
        value: 'SOLES', 
        font: boldBlackFont, 
        fill: yellowFill, 
        alignment: centerAlign, 
        border: thinBorder 
      });

      currentRow++;

      // Añadir una fila vacía para separación entre empleados
      worksheet.addRow([]);
      currentRow++;
    }

    try {
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `reporte_asistencia_${monthName.toLowerCase()}.xlsx`); 
        console.log('Archivo Excel (Asistencia) generado y descargado exitosamente.');
    } catch (error) {
        console.error('Error al generar o descargar el archivo Excel (Asistencia):', error);
        alert('Hubo un error al generar o descargar el archivo Excel de Asistencia. Revisa la consola para más detalles.');
    }
  };


  // Función para generar un reporte Excel de Tipo 2 (Movilidad - ejemplo)
  const handleDownloadExcelOption2 = async () => {
    console.log('Botón "DESCARGAR EXCEL (Movilidad)" presionado. Iniciando generación...');
    console.log('Generando Excel (Movilidad) para el rango:', { startDate, endDate, selectedOption });

    const monthName = "JUNIO"; 
    const totalDaysInMonth = 30; 
    const daysOfWeek = ['L', 'M', 'Mi', 'J', 'V', 'S', 'D'];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Movilidad');

    // --- Definir estilos comunes (pueden ser diferentes para este reporte) ---
    const greenFill: Partial<ExcelJS.Fill> = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6AA84F' } }; 
    const orangeFill: Partial<ExcelJS.Fill> = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9CB9C' } }; 
    
    const boldWhiteFont: Partial<ExcelJS.Font> = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    const boldBlackFont: Partial<ExcelJS.Font> = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF000000' } };
    const regularBlackFont: Partial<ExcelJS.Font> = { name: 'Calibri', size: 11, bold: false, color: { argb: 'FF000000' } };

    const thinBorder: Partial<ExcelJS.Border> = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' }
    };
    const centerAlign: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'center' };
    const leftAlign: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'left' };
    const rightAlign: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'right' };

    // --- Configurar ancho de columnas inicial (puede variar ligeramente) ---
    const graphColsWidth = 4; 
    const numGraphCols = 15; 
    const graphStartColIndex = totalDaysInMonth + 4; 

    let columnsConfig: Partial<ExcelJS.Column>[] = [
      { key: 'colA', width: 10 }, 
      { key: 'colB', width: 10 }, 
    ];
    for (let i = 0; i < totalDaysInMonth; i++) {
      columnsConfig.push({ key: `day${i + 1}`, width: 4.5 }); 
    }
    columnsConfig.push(
      { key: 'totalImporte', width: 15 }, 
      { key: 'unidades', width: 10 } 
    );
    for (let i = 0; i < numGraphCols; i++) {
      columnsConfig.push({ key: `graphCol${i + 1}`, width: graphColsWidth });
    }
    worksheet.columns = columnsConfig;


    let currentRow = 1; 

    for (const employee of dummyEmployeesData) { 
      // --- Sección de Cabecera del Empleado (ID y Nombre) ---
      // Fila 1: ID
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      Object.assign(worksheet.getCell(`A${currentRow}`), { 
        value: 'ID', font: boldWhiteFont, fill: greenFill, alignment: leftAlign, border: thinBorder 
      });
      
      const idEndCol = worksheet.columns[totalDaysInMonth + 1].letter;
      worksheet.mergeCells(`C${currentRow}:${idEndCol}${currentRow}`);
      Object.assign(worksheet.getCell(`C${currentRow}`), { 
        value: employee.id, 
        font: boldWhiteFont, 
        fill: greenFill, 
        alignment: leftAlign, 
        border: thinBorder,
        numFmt: '@' 
      });

      // --- Generar y añadir la imagen del gráfico (usaremos el mismo gráfico de horas presenciales para este ejemplo) ---
      try {
        const chartBase64 = await generateChartImage(employee); // Reutilizamos la misma función de gráfico
        if (chartBase64) {
          const imageId = workbook.addImage({
            base64: chartBase64,
            extension: 'png',
          });

          const startColIndexExcel = graphStartColIndex - 1; 
          const startRowIndexExcel = currentRow - 1; 
          
          const endRowForImage = currentRow + 6; 

          worksheet.addImage(imageId, {
            tl: { col: startColIndexExcel, row: startRowIndexExcel }, 
            ext: { width: 400 * 0.75, height: 200 * 0.75 }, 
          });
          
          const startColLetterForMerge = worksheet.columns[graphStartColIndex].letter;
          const endColLetterForMerge = worksheet.columns[graphStartColIndex + numGraphCols -1].letter;

          worksheet.mergeCells(`${startColLetterForMerge}${currentRow}:${endColLetterForMerge}${endRowForImage}`);
          const mergedCell = worksheet.getCell(`${startColLetterForMerge}${currentRow}`);
          mergedCell.border = thinBorder;
          mergedCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }; 
        }
      } catch (chartError) {
        console.error(`Error al generar o insertar el gráfico para ${employee.name}:`, chartError);
      }

      currentRow++; 

      // Fila 2: Nombre / "SÓLO TELETRABAJO"
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      Object.assign(worksheet.getCell(`A${currentRow}`), { 
        value: 'SÓLO TELETRABAJO', font: boldWhiteFont, fill: greenFill, alignment: leftAlign, border: thinBorder 
      });

      worksheet.mergeCells(`C${currentRow}:${idEndCol}${currentRow}`);
      Object.assign(worksheet.getCell(`C${currentRow}`), { 
        value: employee.name, 
        font: boldWhiteFont, 
        fill: greenFill, 
        alignment: leftAlign, 
        border: thinBorder 
      });

      currentRow++;

      // Fila 3: Mes (ej. JUNIO)
      Object.assign(worksheet.getCell(`A${currentRow}`), { fill: orangeFill, border: thinBorder });

      const monthEndCol = worksheet.columns[totalDaysInMonth + 1].letter;
      worksheet.mergeCells(`B${currentRow}:${monthEndCol}${currentRow}`);
      Object.assign(worksheet.getCell(`B${currentRow}`), { 
        value: monthName, 
        font: boldBlackFont, 
        fill: orangeFill, 
        alignment: centerAlign, 
        border: thinBorder 
      });
      
      const totalImporteColLetter = worksheet.columns[totalDaysInMonth + 2].letter;
      Object.assign(worksheet.getCell(`${totalImporteColLetter}${currentRow}`), { 
        value: 'TOTAL IMPORTE', 
        font: boldBlackFont, 
        fill: orangeFill, 
        alignment: centerAlign, 
        border: thinBorder 
      });
      
      const unitsColLetter = worksheet.columns[totalDaysInMonth + 3].letter;
      Object.assign(worksheet.getCell(`${unitsColLetter}${currentRow}`), { fill: orangeFill, border: thinBorder });

      currentRow++; 

      // --- Cabecera de Días (L, M, Mi... y 1, 2, 3...) ---
      const dayRow = worksheet.getRow(currentRow);
      const dateRow = worksheet.getRow(currentRow + 1);

      worksheet.mergeCells(`A${currentRow}:A${currentRow + 1}`);
      Object.assign(worksheet.getCell(`A${currentRow}`), { 
        value: 'N°', 
        font: boldBlackFont, 
        alignment: centerAlign, 
        border: thinBorder 
      });

      let currentDayOfWeekIndex = new Date(startDate || '2025-06-01').getDay(); 
      if (currentDayOfWeekIndex === 0) currentDayOfWeekIndex = 6; 
      else currentDayOfWeekIndex--; 


      for (let i = 0; i < totalDaysInMonth; i++) {
        const colLetter = worksheet.columns[i + 1].letter;
        
        Object.assign(dayRow.getCell(colLetter), { 
          value: daysOfWeek[currentDayOfWeekIndex], 
          font: boldBlackFont, 
          alignment: centerAlign, 
          border: thinBorder 
        });

        Object.assign(dateRow.getCell(colLetter), { 
          value: i + 1, 
          font: boldBlackFont, 
          alignment: centerAlign, 
          border: thinBorder 
        });

        currentDayOfWeekIndex = (currentDayOfWeekIndex + 1) % 7;
      }

      worksheet.mergeCells(`${totalImporteColLetter}${currentRow}:${totalImporteColLetter}${currentRow + 1}`);
      Object.assign(worksheet.getCell(`${totalImporteColLetter}${currentRow}`), { 
        value: 'TOTAL', 
        font: boldBlackFont, 
        alignment: centerAlign, 
        border: thinBorder 
      });

      worksheet.mergeCells(`${unitsColLetter}${currentRow}:${unitsColLetter}${currentRow + 1}`);
      Object.assign(worksheet.getCell(`${unitsColLetter}${currentRow}`), { 
        fill: orangeFill, 
        border: thinBorder 
      });

      currentRow += 2; 

      // --- Filas de Datos (Horas, Importe, etc. - Solo Importes para este ejemplo) ---
      const dataRowsConfig = [
        { label: 'IMPORTE A PAGAR AMM S/', key: 'importeAmm', unit: 'SOLES' },
        { label: 'IMPORTE A PAGAR BCG S/', key: 'importeBcg', unit: 'SOLES' }
      ];

      dataRowsConfig.forEach(rowInfo => {
        const rowData: DailyData = employee.data[rowInfo.key as keyof typeof employee.data];
        const newRow = worksheet.addRow([]); 

        Object.assign(newRow.getCell('A'), { 
          value: rowInfo.label, 
          font: regularBlackFont, 
          alignment: leftAlign, 
          border: thinBorder 
        });

        for (let i = 0; i < totalDaysInMonth; i++) {
          const colLetter = worksheet.columns[i + 1].letter;
          Object.assign(newRow.getCell(colLetter), { 
            value: rowData.days[i], 
            font: regularBlackFont, 
            alignment: centerAlign, 
            border: thinBorder 
          });
        }

        Object.assign(newRow.getCell(totalImporteColLetter), { 
          value: rowData.total, 
          font: boldBlackFont, 
          alignment: centerAlign, 
          border: thinBorder 
        });
        
        Object.assign(newRow.getCell(unitsColLetter), { 
          value: rowInfo.unit, 
          font: boldBlackFont, 
          fill: orangeFill, 
          alignment: centerAlign, 
          border: thinBorder 
        });

        currentRow++;
      });

      // Fila "MENSUAL"
      const monthlyRow = worksheet.addRow([]);
      Object.assign(monthlyRow.getCell('A'), { fill: orangeFill, border: thinBorder });
      
      const monthlyEndCol = worksheet.columns[totalDaysInMonth + 1].letter;
      worksheet.mergeCells(`B${currentRow}:${monthlyEndCol}${currentRow}`);
      Object.assign(monthlyRow.getCell('B'), { 
        value: 'MENSUAL TOTAL', 
        font: boldBlackFont, 
        fill: orangeFill, 
        alignment: rightAlign, 
        border: thinBorder 
      });

      Object.assign(monthlyRow.getCell(totalImporteColLetter), { 
        value: employee.data.importeAmm.total + employee.data.importeBcg.total, // Suma de importes para el total mensual
        font: boldBlackFont, 
        fill: orangeFill, 
        alignment: centerAlign, 
        border: thinBorder 
      });
      
      Object.assign(monthlyRow.getCell(unitsColLetter), { 
        value: 'SOLES', 
        font: boldBlackFont, 
        fill: orangeFill, 
        alignment: centerAlign, 
        border: thinBorder 
      });

      currentRow++;

      // Añadir una fila vacía para separación entre empleados
      worksheet.addRow([]);
      currentRow++;
    }

    try {
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `reporte_movilidad_${monthName.toLowerCase()}.xlsx`); 
        console.log('Archivo Excel (Movilidad) generado y descargado exitosamente.');
    } catch (error) {
        console.error('Error al generar o descargar el archivo Excel (Movilidad):', error);
        alert('Hubo un error al generar o descargar el archivo Excel de Movilidad. Revisa la consola para más detalles.');
    }
  };


  // Función principal de descarga que usa el "selectedOption"
  const handleDownloadExcel = () => {
    switch (selectedOption) {
      case 'option1': // Asistencia
        handleDownloadExcelOption1();
        break;
      case 'option2': // Movilidad
        handleDownloadExcelOption2();
        break;
      case 'option3': // Ambos - podrías decidir descargar ambos o generar un solo Excel combinado
        // Para este ejemplo, si selecciona "Ambos", descargará el de Asistencia.
        // Podrías modificar esto para generar un tercer tipo de reporte combinado.
        handleDownloadExcelOption1();
        // O podrías llamar a ambos para que se descarguen dos archivos:
        // handleDownloadExcelOption1();
        // handleDownloadExcelOption2();
        break;
      default:
        alert('Por favor, selecciona una opción de reporte.');
    }
  };

  return (
    <div className="report-page-container">
      <h2 className="report-title">GENERAR REPORTE</h2>

      <div className="content-wrapper">
        <div className="report-controls-section">
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
      </div>
      
      {/* Contenedor oculto para renderizar los gráficos temporalmente */}
      {/* Es esencial que este canvas exista en el DOM, aunque esté oculto, para que Chart.js pueda dibujarlo y html2canvas capturarlo. */}
      <div ref={chartContainerRef} style={{ 
        position: 'absolute', 
        left: '-9999px', 
        top: '-9999px', 
        width: '400px', // Dimensiones para el canvas, ajusta si tus gráficos son más grandes
        height: '200px', 
        overflow: 'hidden',
        backgroundColor: 'white' // Fondo blanco para la captura de la imagen del gráfico
      }}>
        <canvas ref={chartCanvasRef}></canvas>
      </div>
    </div>
  );
};

export default GenerarReporte;
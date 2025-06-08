import React, { useState, useEffect, useCallback } from 'react';
import '../css/AdministrarAsistencia.css'; 

interface Periodo {
  value: string;
  label: string;
}

interface Semana {
  inicio: string;
  fin: string;
  label: string;
}

interface Professor {
  id: string;
  nombre: string;
  idNumber: string;
  contractHours: number;
}

interface DailyHours {
  lunes: number;
  martes: number;
  miercoles: number;
  jueves: number;
  viernes: number;
  sabado: number;
  domingo: number;
}

// For single professor, multiple weeks view
interface ProfessorWeeklyAttendance {
  weekId: string; // Unique ID for the data row (e.g., YYYY-MM-DD_YYYY-MM-DD of the week)
  weekLabel: string;
  semanaInfo: Semana; // Original Semana object
  days: DailyHours;
}

// For all professors, single week view
interface AllProfessorsWeeklyEntry {
  profesorId: string;
  profesorNombre: string;
  days: DailyHours;
}

type ViewMode = 'singleProfessorPeriod' | 'allProfessorsWeek';

// --- Mock Data & Helpers (mostly same as before) ---
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const generateMockPeriods = (): Periodo[] => {
  const currentYear = new Date().getFullYear();
  const periods: Periodo[] = [];
  const monthNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
  for (let i = 1; i <= 3; i++) {
    const startMonthIndex = i * 2 - 1;
    const endMonthIndex = startMonthIndex + 1;
    if (startMonthIndex >= 12 || endMonthIndex >= 12) break;
    const startDate = new Date(currentYear, startMonthIndex, 1);
    const endDate = new Date(currentYear, endMonthIndex + 1, 0);
    const value = `${formatDate(startDate)}_${formatDate(endDate)}`;
    const label = `${monthNames[startMonthIndex]} - ${monthNames[endMonthIndex]} ${currentYear}`;
    periods.push({ value, label });
  }
  periods.unshift({
    value: `2024-02-01_2024-03-31`,
    label: "FEBRERO - MARZO 2024"
  });
  return periods;
};

const generateMockSemanasForPeriod = (periodoValue: string): Semana[] => {
  if (!periodoValue) return [];
  const [startPeriodStr, endPeriodStr] = periodoValue.split('_');
  const startPeriod = new Date(startPeriodStr + 'T00:00:00');
  const endPeriod = new Date(endPeriodStr + 'T00:00:00');
  const semanas: Semana[] = [];
  let currentWeekStart = new Date(startPeriod);
  let weekCounter = 1;
  const dayOfWeek = currentWeekStart.getDay();
  if (dayOfWeek === 0) {
    currentWeekStart.setDate(currentWeekStart.getDate() + 1);
  } else if (dayOfWeek > 1) {
    currentWeekStart.setDate(currentWeekStart.getDate() - (dayOfWeek - 1));
  }
  while (currentWeekStart <= endPeriod) {
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    const displayWeekEnd = new Date(Math.min(currentWeekEnd.getTime(), endPeriod.getTime()));
    const formatShortDate = (d: Date) => `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleString('es-ES', { month: 'short' }).toUpperCase().replace('.', '')}`;
    const label = `Semana ${weekCounter}: ${formatShortDate(currentWeekStart)} - ${formatShortDate(displayWeekEnd)}`;
    semanas.push({
      inicio: formatDate(currentWeekStart),
      fin: formatDate(currentWeekEnd),
      label: label,
    });
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    weekCounter++;
     if (currentWeekStart > endPeriod && semanas.length > 0 && new Date(semanas[semanas.length-1].inicio) > endPeriod) {
        semanas.pop(); // Remove last week if its start is already past period end
        break;
    }
  }
  return semanas;
};

const mockProfessors: Professor[] = [
  { id: 'EMP001', nombre: 'ANQUISE JIHUAÑA, YUSELENIN', idNumber: '001634701', contractHours: 19 },
  { id: 'EMP002', nombre: 'GARCIA PEREZ, ANA LUCIA', idNumber: '001634702', contractHours: 24 },
  { id: 'EMP003', nombre: 'LOPEZ PAREDES, CARLOS MARTIN', idNumber: '001634703', contractHours: 20 },
];

let mockProfessorDataStore: Record<string, DailyHours> = {};

const AdministrarAsistencia: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('singleProfessorPeriod');
  const [periods, setPeriods] = useState<Periodo[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  
  // For single professor view
  const [selectedProfessorId, setSelectedProfessorId] = useState<string>('');
  const [professorDisplayName, setProfessorDisplayName] = useState<string>('');
  const [professorContractId, setProfessorContractId] = useState<string>('');
  const [professorContractHours, setProfessorContractHours] = useState<number>(0);
  const [attendanceGridData, setAttendanceGridData] = useState<ProfessorWeeklyAttendance[]>([]);

  // For all professors - single week view
  const [selectedWeekForBulkEditValue, setSelectedWeekForBulkEditValue] = useState<string>(''); // stores "inicio_fin"
  const [allProfessorsAttendanceData, setAllProfessorsAttendanceData] = useState<AllProfessorsWeeklyEntry[]>([]);

  const [semanasDelPeriodo, setSemanasDelPeriodo] = useState<Semana[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'info' | 'error' | 'success'; text: string } | null>(null);

  // Initialize periods and default professor
  useEffect(() => {
    const initialPeriods = generateMockPeriods();
    setPeriods(initialPeriods);
    if (initialPeriods.length > 0) {
      const defaultPeriod = initialPeriods.find(p => p.label === "FEBRERO - MARZO 2024");
      setSelectedPeriod(defaultPeriod ? defaultPeriod.value : initialPeriods[0].value);
    }
    if (mockProfessors.length > 0) {
      setSelectedProfessorId(mockProfessors[0].id);
    }
  }, []);

  // Update semanasDelPeriodo when selectedPeriod changes
  useEffect(() => {
    if (selectedPeriod) {
      const weeks = generateMockSemanasForPeriod(selectedPeriod);
      setSemanasDelPeriodo(weeks);
      // Reset selected week for bulk edit if period changes
      setSelectedWeekForBulkEditValue(''); 
      setAllProfessorsAttendanceData([]);
      if (viewMode === 'allProfessorsWeek' && weeks.length > 0) {
        // Optionally auto-select first week
        // setSelectedWeekForBulkEditValue(`${weeks[0].inicio}_${weeks[0].fin}`);
      }
    } else {
      setSemanasDelPeriodo([]);
      setSelectedWeekForBulkEditValue('');
      setAllProfessorsAttendanceData([]);
    }
  }, [selectedPeriod, viewMode]); // Added viewMode to re-evaluate if needed

  // Load professor details for single professor view
  useEffect(() => {
    if (viewMode === 'singleProfessorPeriod' && selectedProfessorId) {
      const prof = mockProfessors.find(p => p.id === selectedProfessorId);
      if (prof) {
        setProfessorDisplayName(prof.nombre);
        setProfessorContractId(prof.idNumber);
        setProfessorContractHours(prof.contractHours);
      }
    }
  }, [selectedProfessorId, viewMode]);
  
  const generateDataStoreKey = (profId: string, periodVal: string, semana: Semana | {inicio: string, fin: string}): string => {
    return `${profId}_${periodVal}_${semana.inicio}_${semana.fin}`;
  };

  // --- Single Professor - Period View Logic ---
  const loadSingleProfessorData = useCallback(() => {
    if (!selectedPeriod || !selectedProfessorId || viewMode !== 'singleProfessorPeriod') {
      setAttendanceGridData([]);
      return;
    }
    setIsLoading(true);
    setMessage(null);
    // Ensure semanasDelPeriodo is up-to-date before using it
    const currentSemanas = generateMockSemanasForPeriod(selectedPeriod);

    const gridData: ProfessorWeeklyAttendance[] = currentSemanas.map((week) => {
      const storeKey = generateDataStoreKey(selectedProfessorId, selectedPeriod, week);
      const existingHours = mockProfessorDataStore[storeKey];
      return {
        weekId: `${week.inicio}_${week.fin}`,
        weekLabel: week.label,
        semanaInfo: week,
        days: existingHours || { lunes: 0, martes: 0, miercoles: 0, jueves: 0, viernes: 0, sabado: 0, domingo: 0 },
      };
    });
    setAttendanceGridData(gridData);
    if (currentSemanas.length === 0) setMessage({type: 'info', text: 'No hay semanas para este periodo.'});
    setIsLoading(false);
  }, [selectedPeriod, selectedProfessorId, viewMode]);

  useEffect(() => {
    if (viewMode === 'singleProfessorPeriod') {
      loadSingleProfessorData();
    }
  }, [loadSingleProfessorData]);

  const handleSingleProfessorHourChange = (weekId: string, day: keyof DailyHours, value: string) => {
    const hours = Math.max(0, parseInt(value, 10) || 0);
    setAttendanceGridData(prev => prev.map(wd => wd.weekId === weekId ? { ...wd, days: { ...wd.days, [day]: hours } } : wd));
  };

  const handleSingleProfessorSaveChanges = () => {
    setIsLoading(true); setMessage(null);
    attendanceGridData.forEach(weekData => {
      const storeKey = generateDataStoreKey(selectedProfessorId, selectedPeriod, weekData.semanaInfo);
      mockProfessorDataStore[storeKey] = { ...weekData.days };
    });
    setTimeout(() => {
      setIsLoading(false); setMessage({ type: 'success', text: 'Cambios guardados (Profesor Individual).' });
      loadSingleProfessorData();
    }, 500);
  };
  
  const calculateWeeklyTotal = (days: DailyHours): number => Object.values(days).reduce((s, h) => s + (Number(h) || 0), 0);
  const overallTotalHoursForSingleProfessor = attendanceGridData.reduce((total, cw) => total + calculateWeeklyTotal(cw.days), 0);

  // --- All Professors - Single Week View Logic ---
  const loadAllProfessorsForWeek = useCallback(() => {
    if (!selectedPeriod || !selectedWeekForBulkEditValue || viewMode !== 'allProfessorsWeek') {
      setAllProfessorsAttendanceData([]);
      return;
    }
    setIsLoading(true); setMessage(null);
    const [selWeekInicio, selWeekFin] = selectedWeekForBulkEditValue.split('_');
    const weekForStore: Semana = { inicio: selWeekInicio, fin: selWeekFin, label: "" }; // Label not needed for key

    const data: AllProfessorsWeeklyEntry[] = mockProfessors.map(prof => {
      const storeKey = generateDataStoreKey(prof.id, selectedPeriod, weekForStore);
      const existingHours = mockProfessorDataStore[storeKey];
      return {
        profesorId: prof.id,
        profesorNombre: prof.nombre,
        days: existingHours || { lunes: 0, martes: 0, miercoles: 0, jueves: 0, viernes: 0, sabado: 0, domingo: 0 },
      };
    });
    setAllProfessorsAttendanceData(data);
    if (mockProfessors.length === 0) setMessage({type:'info', text:'No hay profesores para mostrar.'});
    setIsLoading(false);
  }, [selectedPeriod, selectedWeekForBulkEditValue, viewMode]);

  useEffect(() => {
    if (viewMode === 'allProfessorsWeek') {
      loadAllProfessorsForWeek();
    }
  }, [loadAllProfessorsForWeek]);

  const handleBulkHourChange = (profesorId: string, day: keyof DailyHours, value: string) => {
    const hours = Math.max(0, parseInt(value, 10) || 0);
    setAllProfessorsAttendanceData(prev => prev.map(entry => 
      entry.profesorId === profesorId ? { ...entry, days: { ...entry.days, [day]: hours } } : entry
    ));
  };

  const handleBulkSaveChanges = () => {
    if (!selectedWeekForBulkEditValue) {
        setMessage({type: 'error', text: 'Por favor, selecciona una semana para guardar.'});
        return;
    }
    setIsLoading(true); setMessage(null);
    const [selWeekInicio, selWeekFin] = selectedWeekForBulkEditValue.split('_');
    const weekForStore: Semana = { inicio: selWeekInicio, fin: selWeekFin, label: "" };

    allProfessorsAttendanceData.forEach(entry => {
      const storeKey = generateDataStoreKey(entry.profesorId, selectedPeriod, weekForStore);
      mockProfessorDataStore[storeKey] = { ...entry.days };
    });
    setTimeout(() => {
      setIsLoading(false); setMessage({ type: 'success', text: 'Cambios guardados (Todos los Profesores para la Semana).' });
      loadAllProfessorsForWeek();
    }, 500);
  };
  const totalHoursAllProfessorsThisWeek = allProfessorsAttendanceData.reduce((sum, entry) => sum + calculateWeeklyTotal(entry.days), 0);


  return (
    <div className="administrar-asistencia-container-crud">
      <div className="view-mode-selector">
        <button onClick={() => setViewMode('singleProfessorPeriod')} className={viewMode === 'singleProfessorPeriod' ? 'active' : ''}>
          Gestionar por Profesor (Periodo Completo)
        </button>
        <button onClick={() => setViewMode('allProfessorsWeek')} className={viewMode === 'allProfessorsWeek' ? 'active' : ''}>
          Gestionar por Semana (Todos los Profesores)
        </button>
      </div>

      <div className="header-controls">
        <div className="form-group">
          <label htmlFor="periodo">Periodo:</label>
          <select id="periodo" value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} disabled={isLoading} className="form-input">
            <option value="">-- Selecciona Periodo --</option>
            {periods.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>

        {viewMode === 'singleProfessorPeriod' && (
          <div className="form-group">
            <label htmlFor="empleado">Empleado:</label>
            <select id="empleado" value={selectedProfessorId} onChange={(e) => setSelectedProfessorId(e.target.value)} disabled={isLoading || mockProfessors.length === 0} className="form-input">
              <option value="">-- Selecciona Empleado --</option>
              {mockProfessors.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
        )}

        {viewMode === 'allProfessorsWeek' && (
          <div className="form-group">
            <label htmlFor="semanaBulkEdit">Semana para Gestionar:</label>
            <select 
              id="semanaBulkEdit" 
              value={selectedWeekForBulkEditValue} 
              onChange={(e) => setSelectedWeekForBulkEditValue(e.target.value)} 
              disabled={isLoading || semanasDelPeriodo.length === 0} 
              className="form-input"
            >
              <option value="">-- Selecciona Semana --</option>
              {semanasDelPeriodo.map(s => <option key={`${s.inicio}_${s.fin}`} value={`${s.inicio}_${s.fin}`}>{s.label}</option>)}
            </select>
          </div>
        )}
      </div>

      {message && <div className={`message-box message-${message.type}`}>{message.text}</div>}
      {isLoading && <p className="loading-text">Cargando datos...</p>}

      {/* --- Single Professor - Period View UI --- */}
      {viewMode === 'singleProfessorPeriod' && !isLoading && selectedProfessorId && (
        <>
          <div className="profesor-info-crud">
            <h3>{professorDisplayName}</h3>
            <p>ID: {professorContractId} | Horas Contrato: {professorContractHours}</p>
          </div>
          {attendanceGridData.length > 0 ? (
            <div className="attendance-grid-crud">
              <table>
                <thead><tr><th>Semana</th><th>Lunes</th><th>Martes</th><th>Miércoles</th><th>Jueves</th><th>Viernes</th><th>Sábado</th><th>Domingo</th><th>Total</th></tr></thead>
                <tbody>
                  {attendanceGridData.map((wd) => (
                    <tr key={wd.weekId}>
                      <td>{wd.weekLabel}</td>
                      {(Object.keys(wd.days) as Array<keyof DailyHours>).map(day => (
                        <td key={day}><input type="number" min="0" value={wd.days[day] === 0 ? '' : wd.days[day]} onChange={(e) => handleSingleProfessorHourChange(wd.weekId, day, e.target.value)} className="hour-input" disabled={isLoading}/></td>
                      ))}
                      <td>{calculateWeeklyTotal(wd.days)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (<p>No hay semanas para mostrar para el periodo y profesor seleccionado.</p>)}
          {attendanceGridData.length > 0 && (
            <div className="summary-and-actions-crud">
              <div className="summary-totals">
                <span>Total Horas: {overallTotalHoursForSingleProfessor}</span>
                <span>Tardanzas: 0</span>
                <span>Horas a Ingresar: {overallTotalHoursForSingleProfessor}</span>
              </div>
              <button onClick={handleSingleProfessorSaveChanges} disabled={isLoading} className="button-primary">Guardar Cambios (Profesor)</button>
            </div>
          )}
        </>
      )}

      {/* --- All Professors - Single Week View UI --- */}
      {viewMode === 'allProfessorsWeek' && !isLoading && selectedWeekForBulkEditValue && (
        <>
          {allProfessorsAttendanceData.length > 0 ? (
            <div className="attendance-grid-crud">
               <h4>
                Editando horas para todos los profesores - Semana: {semanasDelPeriodo.find(s => `${s.inicio}_${s.fin}` === selectedWeekForBulkEditValue)?.label || selectedWeekForBulkEditValue}
              </h4>
              <table>
                <thead><tr><th>Profesor</th><th>Lunes</th><th>Martes</th><th>Miércoles</th><th>Jueves</th><th>Viernes</th><th>Sábado</th><th>Domingo</th><th>Total Semanal</th></tr></thead>
                <tbody>
                  {allProfessorsAttendanceData.map((entry) => (
                    <tr key={entry.profesorId}>
                      <td style={{textAlign: 'left'}}>{entry.profesorNombre}</td>
                      {(Object.keys(entry.days) as Array<keyof DailyHours>).map(day => (
                        <td key={day}><input type="number" min="0" value={entry.days[day] === 0 ? '' : entry.days[day]} onChange={(e) => handleBulkHourChange(entry.profesorId, day, e.target.value)} className="hour-input" disabled={isLoading}/></td>
                      ))}
                      <td>{calculateWeeklyTotal(entry.days)}</td>
                    </tr>
                  ))}
                </tbody>
                 <tfoot>
                    <tr>
                        <td colSpan={8} style={{textAlign: 'right', fontWeight:'bold'}}>Total Horas (Todos los Profesores esta Semana):</td>
                        <td style={{fontWeight:'bold'}}>{totalHoursAllProfessorsThisWeek}</td>
                    </tr>
                </tfoot>
              </table>
            </div>
          ) : (<p>Selecciona una semana y asegúrate de que haya profesores cargados.</p>)}
          {allProfessorsAttendanceData.length > 0 && (
            <div className="summary-and-actions-crud">
              <div className="summary-totals">
                 <span>Total Horas Ingresadas (Esta Semana): {totalHoursAllProfessorsThisWeek}</span>
              </div>
              <button onClick={handleBulkSaveChanges} disabled={isLoading} className="button-primary">Guardar Cambios (Semana Completa)</button>
            </div>
          )}
        </>
      )}
       {viewMode === 'allProfessorsWeek' && !isLoading && !selectedWeekForBulkEditValue && semanasDelPeriodo.length > 0 && (
            <p className="info-text">Por favor, selecciona una semana del periodo actual para ver y editar las horas de todos los profesores.</p>
        )}
    </div>
  );
};

export default AdministrarAsistencia;

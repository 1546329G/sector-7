import React, { useState, useEffect, useCallback } from 'react';
import '../css/AdministrarAsistencia.css'; // Ensure this CSS file is adapted or created
import dayjs from 'dayjs';

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

let mockProfessors: Professor[] = [
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

  const [semanas, setSemanas] = useState<Semana[]>([]);
  const [semanaSeleccionada, setSemanaSeleccionada] = useState<string>("");
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'info' | 'error' | 'success'; text: string } | null>(null);
  //Lista de profesores
  useEffect(() => {
  async function fetchProfessors() {
    try {
      const res = await fetch('http://localhost:5009/profesores');
      const data = await res.json();

      const activos: Professor[] = data
        .filter((p: any) => p.estado === 'Activo')
        .map((p: any) => ({
          idNumber: p.id_institucional,
          nombre: p.nombre,
          id: String(p.id),
          contractHours: parseInt(p.horas_segun_contrato, 10),
        }));

      // sobreescribimos directamente el contenido del mock porque lamentablemente eso se usa para todo no se porque no lo guardaron en el state pero hay que adaptarnos
      mockProfessors.length = 0;
      mockProfessors.push(...activos);
      
      // Initialize periods and default professor(para que el profe seleccionado siempre sea el [0])
      if (mockProfessors.length > 0) {
        setSelectedProfessorId(mockProfessors[0].id);
      }
    } catch (error) {
      console.error("Error al cargar los profesores:", error);
    }
  }

  fetchProfessors();
}, []);

  //Insercion de periodos a Periodo
  useEffect(() => {
    async function fetchPeriodos() {
      try {
        const res = await fetch('http://localhost:3000/reporte-asistencia/periodos');
        const data = await res.json();

        const opciones: Periodo[] = data.map((item: any) => ({
          value: JSON.stringify({ inicio: item.inicio, fin: item.fin }),
          label: item.etiqueta
        }));

        setPeriods(opciones);

        if (opciones.length > 0) {
          setSelectedPeriod(opciones[0].value);
        }
      } catch (error) {
        console.error("Error al cargar los periodos:", error);
      }
    }

    fetchPeriodos();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPeriod(e.target.value);
    const periodo = JSON.parse(e.target.value);
    console.log("Seleccionado:", periodo); // {inicio: "...", fin: "..."}
  };

  // Recarga las opciones en semana cuando el periodo es seleccionado o cambiado
  useEffect(() => {
    async function fetchSemanas(periodoStr: string) {
      if (!selectedPeriod) return;
      try {
        const res = await fetch(`http://localhost:3000/reporte-asistencia/semanas?periodo=${periodoStr}`);
        const data = await res.json();

        const opciones: Semana[] = data.map((item: any) => ({
          inicio: item.inicio,
          fin: item.fin,
          label: item.nombre+" : "+item.inicio+" - "+item.fin
        }));

        setSemanas(opciones);
        setSemanaSeleccionada("");
      } catch (error) {
        console.error("Error al cargar semanas:", error);
      }
    }

    if (selectedPeriod) {
      const { inicio, fin } = JSON.parse(selectedPeriod);
      const periodoStr = `${inicio}_${fin}`;
      fetchSemanas(periodoStr);
    } else {
      setSemanas([]);
      setSemanaSeleccionada("");
    }
  }, [selectedPeriod]);

  const handleSemanaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSemanaSeleccionada(e.target.value);
    const semana = semanas.find(s => s.label === e.target.value);
    console.log("Semana seleccionada:", semana);
  };

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

// Cargar datos de un solo profesor
  const loadSingleProfessorData = useCallback(async () => {
    if (!selectedPeriod || !selectedProfessorId || viewMode !== 'singleProfessorPeriod') {
      setAttendanceGridData([]);
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const { inicio, fin } = JSON.parse(selectedPeriod);

    try {
      const res = await fetch(`http://localhost:3000/reporte-asistencia?inicio=${inicio}&fin=${fin}&modo=periodo&profesor_id=${selectedProfessorId}`);
      const json = await res.json();
      const profesor = json.datos[0];

      if (!profesor || !profesor.semanas) {
        setMessage({ type: 'info', text: 'No hay datos de asistencia para este profesor.' });
        setAttendanceGridData([]);
        setIsLoading(false);
        return;
      }

      const gridData: ProfessorWeeklyAttendance[] = profesor.semanas.map((semana: any) => {
        const days: DailyHours = {
          lunes: 0,
          martes: 0,
          miercoles: 0,
          jueves: 0,
          viernes: 0,
          sabado: 0,
          domingo: 0
        };

        semana.dias.forEach((dia: any) => {
          const fecha = dayjs(dia.fecha);
          const diaSemana = fecha.format('dddd').toLowerCase();
          const map: Record<string, keyof DailyHours> = {
            monday: 'lunes',
            tuesday: 'martes',
            wednesday: 'miercoles',
            thursday: 'jueves',
            friday: 'viernes',
            saturday: 'sabado',
            sunday: 'domingo'
          };

          const key = map[diaSemana.toLowerCase()];
          if (key) {
            const [hrs, mins] = dia.horas.split(':').map(Number);
            days[key] = hrs + (mins >= 30 ? 0.5 : 0); // puedes mejorar esto según precisión deseada ya sea porque son 2.5 horas o cosas asi
          }
        });

        return {
          weekId: `${semana.inicio}_${semana.fin}`,
          weekLabel: `${semana.semana}: Del ${semana.inicio} hasta ${semana.fin}`,
          semanaInfo: {
            inicio: semana.inicio,
            fin: semana.fin,
            label: semana.semana
          },
          days
        };
      });

      setAttendanceGridData(gridData);
      setProfessorDisplayName(profesor.nombre);
      setProfessorContractHours(Number(profesor.horas_contrato));
      setProfessorContractId(selectedProfessorId);

    } catch (error) {
      console.error("Error al cargar datos del profesor:", error);
      setMessage({ type: 'error', text: 'Error al cargar datos del servidor.' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod, selectedProfessorId, viewMode]);

  //aca se carga los datos en el modo de un solo profesor para la pagina
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

  // --- All Professors - Single Week View Logic ---  AllProfessorsWeeklyEntry
const loadAllProfessorsForWeek = useCallback(async () => {
  if (!selectedWeekForBulkEditValue || viewMode !== 'allProfessorsWeek') {
    setAllProfessorsAttendanceData([]);
    return;
  }

  const [inicio, fin] = selectedWeekForBulkEditValue.split('_');

  try {
    setIsLoading(true);
    setMessage(null);

    const res = await fetch(`http://localhost:3000/reporte-asistencia?inicio=${inicio}&fin=${fin}&modo=semana`);
    const json = await res.json();

    const datos = json.datos || [];

    const profesoresMap: Record<string, any> = {};
    datos.forEach((prof: any) => {
      profesoresMap[prof.id_profesor] = prof;
    });

    const allData: AllProfessorsWeeklyEntry[] = mockProfessors.map((prof) => {
      const entry = profesoresMap[prof.id]; // buscar si tiene datos

      const days: DailyHours = {
        lunes: 0,
        martes: 0,
        miercoles: 0,
        jueves: 0,
        viernes: 0,
        sabado: 0,
        domingo: 0,
      };

      if (entry?.dias) {
        entry.dias.forEach((dia: any) => {
          const fecha = dayjs(dia.fecha);
          const weekday = fecha.format('dddd').toLowerCase();
          const map: Record<string, keyof DailyHours> = {
            monday: 'lunes',
            tuesday: 'martes',
            wednesday: 'miercoles',
            thursday: 'jueves',
            friday: 'viernes',
            saturday: 'sabado',
            sunday: 'domingo',
          };
          const key = map[weekday];
          if (key) {
            const [h, m] = dia.horas.split(':').map(Number);
            days[key] = h + (m >= 30 ? 0.5 : 0); // redondear horas dentro del rango establecido
          }
        });
      }
      return {
        profesorId: prof.id,
        profesorNombre: prof.nombre,
        days,
      };
    });

    setAllProfessorsAttendanceData(allData);
  } catch (error) {
    console.error('Error al cargar asistencia por semana:', error);
    setMessage({ type: 'error', text: 'Error al cargar datos del servidor.' });
  } finally {
    setIsLoading(false);
  }
}, [selectedWeekForBulkEditValue, viewMode]);

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
          <select id="periodo" value={selectedPeriod} onChange={handleChange} disabled={isLoading} className="form-input">
            <option value="">-- Seleccione Periodo--</option>
              {periods.map((periodo, idx) => (<option key={idx} value={periodo.value}>{periodo.label}</option>))}
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
              disabled={isLoading || semanas.length === 0} 
              className="form-input"
            >
              <option value="">-- Selecciona Semana --</option>
              {semanas.map(s => <option key={`${s.inicio}_${s.fin}`} value={`${s.inicio}_${s.fin}`}>{s.label}</option>)}
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
                Editando horas para todos los profesores {semanas.find(s => `${s.inicio}_${s.fin}` === selectedWeekForBulkEditValue)?.label || selectedWeekForBulkEditValue}
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
       {viewMode === 'allProfessorsWeek' && !isLoading && !selectedWeekForBulkEditValue && semanas.length > 0 && (
            <p className="info-text">Por favor, selecciona una semana del periodo actual para ver y editar las horas de todos los profesores.</p>
        )}
    </div>
  );
};

export default AdministrarAsistencia;

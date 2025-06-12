import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../css/AdministrarHorario.css'; // Asegúrate de crear este archivo CSS

// Define las URLs base de tus APIs
const API_HORARIOS_URL = 'http://localhost:3711/api/horarios'; // <-- URL para la API 2 (Horarios)
const API_PROFESORES_URL = 'http://localhost:5009/profesores'; // <-- URL para la API 1 (Profesores)

// Interfaz para un objeto Horario
interface Horario {
  id: string;
  profesor_id: string;
  profesor_nombre?: string; // Nombre del profesor para mostrar en la tabla
  dia_semana: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado';
  hora_inicio: string;
  hora_fin: string;
  aula: string;
  fecha_registro?: string;
}

// Interfaz simplificada para el profesor (usada en el formulario)
interface ProfesorSimple {
  id: string;
  nombre: string;
}

const GestionHorarios: React.FC = () => {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [profesores, setProfesores] = useState<ProfesorSimple[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mainMessage, setMainMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Estado para el formulario de añadir horario
  const [newProfesorId, setNewProfesorId] = useState('');
  const [newDiaSemana, setNewDiaSemana] = useState<'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado'>('Lunes');
  const [newHoraInicio, setNewHoraInicio] = useState('');
  const [newHoraFin, setNewHoraFin] = useState('');
  const [newAula, setNewAula] = useState('');
  const [addMessage, setAddMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Función para obtener la lista de horarios desde la API 2
  const fetchHorarios = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // Usamos la nueva URL para la API de Horarios (API 2)
      const response = await axios.get<Horario[]>(API_HORARIOS_URL);
      const fetchedHorarios = response.data;

      // Mapear los nombres de profesores a los horarios
      const horariosConNombres = fetchedHorarios.map(horario => {
        const profesor = profesores.find(p => p.id === horario.profesor_id);
        return {
          ...horario,
          profesor_nombre: profesor ? profesor.nombre : `ID: ${horario.profesor_id}`
        };
      });
      setHorarios(horariosConNombres);

    } catch (error) {
      console.error('Error al obtener horarios:', error);
      setErrorMessage('Error al cargar los horarios. Asegúrese de que el servidor y la ruta "/api/horarios" de la API 2 estén disponibles.');
      setMainMessage({ type: 'error', text: 'Error al cargar los horarios.' });
    } finally {
      setIsLoading(false);
    }
  }, [profesores]); // Depende de profesores para poder asignar los nombres

  // Función para obtener la lista de profesores activos (desde API 1)
  const fetchProfesores = useCallback(async () => {
    try {
      // Obtenemos solo profesores activos para asignación de horarios desde la API 1
      const response = await axios.get<ProfesorSimple[]>(`${API_PROFESORES_URL}?estado=Activo`);
      setProfesores(response.data);
    } catch (error) {
      console.error('Error al obtener profesores:', error);
      setMainMessage({ type: 'error', text: 'No se pudieron cargar los profesores para la selección.' });
    }
  }, []);

  // Efecto para cargar profesores y horarios al inicio
  useEffect(() => {
    // Primero cargamos los profesores
    fetchProfesores().then(() => {
      // Una vez cargados los profesores, cargamos los horarios
      // (Esto asegura que 'profesores' esté disponible para 'fetchHorarios')
      fetchHorarios();
    });
  }, [fetchProfesores, fetchHorarios]); // Asegúrate de que las dependencias sean correctas

  // Manejador para añadir un nuevo horario (a la API 2)
  const handleAddHorario = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddMessage(null);
    setIsAdding(true);

    if (!newProfesorId || !newDiaSemana || !newHoraInicio || !newHoraFin || !newAula) {
      setAddMessage({ type: 'error', text: 'Por favor, completa todos los campos del formulario.' });
      setIsAdding(false);
      return;
    }

    if (newHoraInicio >= newHoraFin) {
      setAddMessage({ type: 'error', text: 'La hora de fin debe ser posterior a la hora de inicio.' });
      setIsAdding(false);
      return;
    }

    try {
      const newHorarioData = {
        profesor_id: newProfesorId,
        dia_semana: newDiaSemana,
        hora_inicio: newHoraInicio,
        hora_fin: newHoraFin,
        aula: newAula,
      };

      // Ruta completa para añadir horario en API 2
      await axios.post(API_HORARIOS_URL, newHorarioData); // <-- Apuntando a la API 2

      setAddMessage({ type: 'success', text: `Horario añadido exitosamente!` });
      setMainMessage({ type: 'success', text: `Nuevo horario añadido.` });

      fetchHorarios(); // Recargar la lista para incluir el nuevo horario

      // Limpiar campos del formulario
      setNewProfesorId('');
      setNewDiaSemana('Lunes');
      setNewHoraInicio('');
      setNewHoraFin('');
      setNewAula('');

    } catch (error: any) {
      console.error('Error al añadir horario:', error.response?.data || error.message);
      let errorText = 'Error al añadir horario.';
      if (error.response?.status === 409) {
        errorText = 'Error: Conflicto de horario. El profesor o el aula ya están ocupados en ese lapso.';
      } else if (error.response?.data?.message) {
        errorText = `Error: ${error.response.data.message}`;
      }
      setAddMessage({ type: 'error', text: errorText });
      setMainMessage({ type: 'error', text: 'Error al añadir el horario.' });
    } finally {
      setIsAdding(false);
      setTimeout(() => {
        setAddMessage(null);
        setMainMessage(null);
      }, 4000);
    }
  };

  // Manejador para eliminar un horario (en la API 2)
  const handleDeleteHorario = async (horarioId: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el horario con ID ${horarioId}?`)) {
      return;
    }
    setMainMessage(null);
    try {
      // Ruta completa para eliminar horario en API 2
      await axios.delete(`${API_HORARIOS_URL}/${horarioId}`); // <-- Apuntando a la API 2

      // Actualizar el estado local para reflejar la eliminación
      setHorarios(prevHorarios => prevHorarios.filter(h => h.id !== horarioId));
      setMainMessage({ type: 'success', text: `Horario ${horarioId} eliminado exitosamente.` });

    } catch (error: any) {
      console.error('Error al eliminar horario:', error.response?.data || error.message);
      let errorText = 'Error al eliminar el horario.';
      if (error.response?.status === 404) {
        errorText = `Error: Horario no encontrado.`;
      }
      setMainMessage({ type: 'error', text: errorText });
    } finally {
      setTimeout(() => setMainMessage(null), 3000);
    }
  };

  return (
    <div className="gestion-horario-page-container">
      <h1 className="main-page-title">Gestión de Horarios</h1>

      {mainMessage && (
        <p className={`page-feedback-message ${mainMessage.type}`}>
          {mainMessage.text}
        </p>
      )}

      {/* Sección para añadir nuevo horario */}
      <div className="generar-horario-container">
        <h2 className="generar-horario-title">Añadir Nuevo Horario</h2>
        <form onSubmit={handleAddHorario} className="generar-horario-form">
          <div className="form-group">
            <label htmlFor="profesor-id">Profesor:</label>
            <select
              id="profesor-id"
              value={newProfesorId}
              onChange={(e) => setNewProfesorId(e.target.value)}
              required
              disabled={isAdding || profesores.length === 0}
            >
              <option value="">-- Seleccione un Docente --</option>
              {profesores.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="dia-semana">Día de la Semana:</label>
            <select
                id="dia-semana"
                value={newDiaSemana}
                onChange={(e) => setNewDiaSemana(e.target.value as any)}
                required
                disabled={isAdding}
            >
                <option value="Lunes">Lunes</option>
                <option value="Martes">Martes</option>
                <option value="Miércoles">Miércoles</option>
                <option value="Jueves">Jueves</option>
                <option value="Viernes">Viernes</option>
                <option value="Sábado">Sábado</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="hora-inicio">Hora Inicio:</label>
            <input type="time" id="hora-inicio" value={newHoraInicio} onChange={(e) => setNewHoraInicio(e.target.value)} required disabled={isAdding} />
          </div>
          <div className="form-group">
            <label htmlFor="hora-fin">Hora Fin:</label>
            <input type="time" id="hora-fin" value={newHoraFin} onChange={(e) => setNewHoraFin(e.target.value)} required disabled={isAdding} />
          </div>
          <div className="form-group">
            <label htmlFor="aula">Aula:</label>
            <input type="text" id="aula" value={newAula} onChange={(e) => setNewAula(e.target.value)} placeholder="Ej: A-101" required disabled={isAdding} />
          </div>

          <button type="submit" className="add-horario-button" disabled={isAdding}>
            {isAdding ? 'Añadiendo...' : 'Añadir Horario'}
          </button>
        </form>
        {addMessage && (
          <p className={`add-horario-message ${addMessage.type}`}>
            {addMessage.text}
          </p>
        )}
      </div>

      {/* Sección para administrar horarios existentes */}
      <div className="administrar-horario-container">
        <h2 className="administrar-horario-title">Administrar Horarios Existentes</h2>
        <button onClick={fetchHorarios} disabled={isLoading} className="refresh-button">
          {isLoading ? 'Cargando...' : 'Recargar Horarios'}
        </button>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        {isLoading ? (
          <p>Cargando horarios...</p>
        ) : horarios.length === 0 ? (
          <p>No hay horarios registrados.</p>
        ) : (
          <div className="horarios-table-container">
            <table className="horarios-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Profesor</th>
                  <th>Día</th>
                  <th>Hora Inicio</th>
                  <th>Hora Fin</th>
                  <th>Aula</th>
                  <th>Fecha Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {horarios.map((horario) => (
                  <tr key={horario.id}>
                    <td>{horario.id}</td>
                    <td>{horario.profesor_nombre || `ID: ${horario.profesor_id}`}</td>
                    <td>{horario.dia_semana}</td>
                    <td>{horario.hora_inicio}</td>
                    <td>{horario.hora_fin}</td>
                    <td>{horario.aula}</td>
                    <td>{horario.fecha_registro ? new Date(horario.fecha_registro).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <button
                        className="delete-button"
                        onClick={() => handleDeleteHorario(horario.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionHorarios;
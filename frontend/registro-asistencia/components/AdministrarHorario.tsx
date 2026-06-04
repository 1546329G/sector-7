import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../css/AdministrarHorario.css';
import { API1_URL, API2_URL } from '../src/config';

const API_HORARIOS_URL = `${API2_URL}/api/horarios`;
const API_PROFESORES_URL = `${API1_URL}/profesores`;

interface Horario {
  id: string;
  id_profesor: number;
  profesor_nombre?: string;
  dia_semana: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado';
  hora_entrada: string;
  hora_salida: string;
  aula: string;
  estado?: string;
  fecha_registro?: string;
  fecha_modificacion?: string;
}

interface ProfesorSimple {
  id: number;
  nombre: string;
  horas_segun_contrato: string;
  estado: string;
  id_institucional: string;
  fecha_registro: string;
  fecha_modificacion: string;
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
  const [newHoraEntrada, setNewHoraEntrada] = useState('');
  const [newHoraSalida, setNewHoraSalida] = useState('');
  const [newAula, setNewAula] = useState('');
  const [addMessage, setAddMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Función consolidada para obtener tanto profesores como horarios, y luego fusionarlos
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // Obtener datos de ambas APIs en paralelo
      const [horariosResponse, profesoresResponse] = await Promise.all([
        axios.get<Horario[]>(API_HORARIOS_URL), // GET http://localhost:5011/api/horarios
        axios.get<ProfesorSimple[]>(`${API_PROFESORES_URL}?estado=Activo`) // GET http://localhost:5009/profesores?estado=Activo
      ]);

      const fetchedHorarios = horariosResponse.data;
      const fetchedProfesores = profesoresResponse.data;

      setProfesores(fetchedProfesores); // Actualiza el estado de profesores 

      // Crear un mapa para una búsqueda rápida del nombre del profesor
      // Los IDs de profesor en la API de profesores son números, convertimos a string para usar como clave en el mapa
      const profesorMap = new Map(fetchedProfesores.map(p => [p.id.toString(), p.nombre]));

      // Mapear los nombres de los profesores a los horarios
      const horariosConNombres = fetchedHorarios.map(horario => ({
        ...horario,
        // Usamos horario.id_profesor que es como viene de la API de horarios
        // Convertimos el id_profesor a string para buscar en el mapa
        profesor_nombre: profesorMap.get(horario.id_profesor.toString()) || `ID: ${horario.id_profesor}`
      }));

      setHorarios(horariosConNombres);

    } catch (error) {
      console.error('Error al cargar datos:', error);
      setErrorMessage('Error al cargar la información. Asegúrese de que ambos servidores de API estén disponibles.');
      setMainMessage({ type: 'error', text: 'Error al cargar los datos.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Efecto para cargar datos al montar el componente
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Manejador para añadir un nuevo horario
  const handleAddHorario = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddMessage(null);
    setIsAdding(true);


    if (!newProfesorId || !newDiaSemana || !newHoraEntrada || !newHoraSalida || !newAula) {
      setAddMessage({ type: 'error', text: 'Por favor, completa todos los campos del formulario.' });
      setIsAdding(false);
      return;
    }

    if (newHoraEntrada >= newHoraSalida) {
      setAddMessage({ type: 'error', text: 'La hora de fin debe ser posterior a la hora de inicio.' });
      setIsAdding(false);
      return;
    }

    try {
      // Convertir newProfesorId a number ya que la columna id_profesor es INT en la DB
      const profesorIdAsNumber = parseInt(newProfesorId, 10);
      if (isNaN(profesorIdAsNumber)) {
        setAddMessage({ type: 'error', text: 'ID de profesor inválido. Seleccione un profesor de la lista.' });
        setIsAdding(false);
        return;
      }

      const newHorarioData = {
        id_profesor: profesorIdAsNumber,
        dia_semana: newDiaSemana,
        hora_entrada: newHoraEntrada + ':00',                             // Datos a enviar al backend 
        hora_salida: newHoraSalida + ':00',
        aula: newAula,
        estado: "Activo"
      };


      // Envía la solicitud POST a la API de Horarios
      await axios.post(API_HORARIOS_URL, newHorarioData);

      setAddMessage({ type: 'success', text: `Horario añadido exitosamente!` });
      setMainMessage({ type: 'success', text: `Nuevo horario añadido.` });
      fetchData();

      // Limpiar campos del formulario
      setNewProfesorId('');
      setNewDiaSemana('Lunes');
      setNewHoraEntrada('');
      setNewHoraSalida('');
      setNewAula('');

    } catch (error: any) {
      console.error('Error al añadir horario:', error.response?.data || error.message);
      let errorText = 'Error al añadir horario.';
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 409) {
          errorText = 'Error: Conflicto de horario. El profesor o el aula ya están ocupados en ese lapso.';
        } else if (error.response.data && error.response.data.message) {
          errorText = `Error del servidor: ${error.response.data.message}`;
        } else {
          errorText = `Error del servidor (${error.response.status}): ${error.response.statusText}`;
        }
      } else if (error.message) {
        errorText = `Error de red: ${error.message}. Asegúrese de que el servidor de horarios esté funcionando.`;
      }
      setAddMessage({ type: 'error', text: errorText });
      setMainMessage({ type: 'error', text: 'Error al añadir el horario.' });
    } finally {
      setIsAdding(false);
      // Ocultar el mensaje de éxito o error después de 4 segundos
      setTimeout(() => {
        setAddMessage(null);
        setMainMessage(null);
      }, 4000);
    }
  };






  // Manejador para eliminar un horario
  const handleDeleteHorario = async (horarioId: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el horario con ID ${horarioId}?`)) {
      return;
    }
    setMainMessage(null);
    try {
      await axios.delete(`${API_HORARIOS_URL}/${horarioId}`); // DELETE http://localhost:5011/api/horarios/:id
      fetchData();
      setMainMessage({ type: 'success', text: `Horario ${horarioId} eliminado exitosamente.` });

    } catch (error: any) {
      console.error('Error al eliminar horario:', error.response?.data || error.message);
      let errorText = 'Error al eliminar el horario.';
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 404) {
          errorText = `Error: Horario no encontrado.`;
        } else if (error.response.data && error.response.data.message) {
          errorText = `Error del servidor: ${error.response.data.message}`;
        } else {
          errorText = `Error del servidor (${error.response.status}): ${error.response.statusText}`;
        }
      } else if (error.message) {
        errorText = `Error de red: ${error.message}. Asegúrese de que el servidor de horarios esté funcionando.`;
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
              {/* Mapea los profesores para el dropdown */}
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
            <label htmlFor="hora-entrada">Hora Inicio:</label>
            <input type="time" id="hora-entrada" value={newHoraEntrada} onChange={(e) => setNewHoraEntrada(e.target.value)} required disabled={isAdding} />
          </div>
          <div className="form-group">
            <label htmlFor="hora-salida">Hora Fin:</label>
            <input type="time" id="hora-salida" value={newHoraSalida} onChange={(e) => setNewHoraSalida(e.target.value)} required disabled={isAdding} />
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

      { /* Sección para administrar horarios existentes */}
      <div className="administrar-horario-container">
        <h2 className="administrar-horario-title">Administrar Horarios Existentes</h2>
        <button onClick={fetchData} disabled={isLoading} className="refresh-button">
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
                  <th>ID-horario</th>
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
                    {/* Aquí se usa profesor_nombre que ya fue mapeado */}
                    <td>{horario.profesor_nombre}</td>
                    <td>{horario.dia_semana}</td>
                    {/* Mostrar hora_entrada y hora_salida */}
                    <td>{horario.hora_entrada}</td>
                    <td>{horario.hora_salida}</td>
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
        <h5>lo hizo gandy,</h5>
    </div>
  );
};

export default GestionHorarios;
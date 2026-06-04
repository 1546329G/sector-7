import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../css/AdministrarUsuario.css'; 
import { API1_URL } from '../src/config';

const API_BASE_URL = API1_URL; 

interface Profesor {
  id: string; 
  id_institucional: string; 
  nombre: string;
  horas_segun_contrato: number; 
  estado: 'Activo' | 'Inactivo';
  horario?: string[]; 
  fecha_registro?: string; 
  fecha_modificacion?: string; 
}

const GestionDocente: React.FC = () => {
  const [professors, setProfessors] = useState<Profesor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mainMessage, setMainMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Estado para el formulario de añadir docente
  const [newIdInstitucional, setNewIdInstitucional] = useState('');
  const [newNombre, setNewNombre] = useState('');
  const [newHorasContrato, setNewHorasContrato] = useState<number | ''>('');
  const [newEstado, setNewEstado] = useState<'Activo' | 'Inactivo'>('Activo');
  const [newHorario, setNewHorario] = useState(''); // Solo para visualización
  const [addMessage, setAddMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Función para obtener la lista de profesores desde la API
  const fetchProfessors = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null); 
    try {
      // Ruta completa para obtener profesores
      const response = await axios.get<Profesor[]>(`${API_BASE_URL}/profesores`);
      
      const fetchedProfessors = response.data.map(prof => ({
        id: String(prof.id), 
        id_institucional: prof.id_institucional,
        nombre: prof.nombre,
        horas_segun_contrato: prof.horas_segun_contrato,
        estado: prof.estado,
        horario: prof.horario || [], 
        fecha_registro: prof.fecha_registro, 
        fecha_modificacion: prof.fecha_modificacion, 
      }));
      setProfessors(fetchedProfessors);
    } catch (error) {
      console.error('Error al obtener docentes:', error);
      setErrorMessage('Error al cargar los docentes. Por favor, asegúrese de que el servidor esté funcionando y la ruta "/profesores" esté disponible.');
      setMainMessage({ type: 'error', text: 'Error al cargar los docentes.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfessors();
  }, [fetchProfessors]);

  // Manejador para añadir un nuevo profesor
  const handleAddProfesor = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setAddMessage(null); 
    setIsAdding(true); 

    if (!newIdInstitucional || !newNombre || newHorasContrato === '') {
      setAddMessage({ type: 'error', text: 'Por favor, completa ID Institucional, Nombre y Horas Contrato.' });
      setIsAdding(false);
      return;
    }
    if (isNaN(Number(newHorasContrato)) || Number(newHorasContrato) < 0) {
      setAddMessage({ type: 'error', text: 'Horas Contrato debe ser un número válido y no negativo.' });
      setIsAdding(false);
      return;
    }

    try {
      const newProfesorData = {
        id_institucional: newIdInstitucional,
        nombre: newNombre,
        horas_segun_contrato: Number(newHorasContrato),
        estado: newEstado,
      };

      // Ruta completa para añadir profesor
      const response = await axios.post(`${API_BASE_URL}/profesores`, newProfesorData);
      
      setAddMessage({ type: 'success', text: `Docente ${newNombre} añadido exitosamente!` });
      setMainMessage({ type: 'success', text: `Docente ${newNombre} añadido exitosamente.` });

      fetchProfessors(); // Recargar la lista

      // Limpiar campos
      setNewIdInstitucional('');
      setNewNombre('');
      setNewHorasContrato('');
      setNewEstado('Activo');
      setNewHorario('');
    } catch (error: any) {
      console.error('Error al añadir docente:', error.response?.data || error.message);
      let errorText = 'Error al añadir docente.';
      if (error.response) {
        if (error.response.status === 409) {
          errorText = 'Error: El ID Institucional ya existe o hay un valor duplicado.';
        } else if (error.response.data && error.response.data.message) {
          errorText = `Error: ${error.response.data.message}`;
        } else if (error.response.status === 500) {
          errorText = 'Error del servidor al añadir docente. Revise los logs del backend.';
        }
      }
      setAddMessage({ type: 'error', text: errorText });
      setMainMessage({ type: 'error', text: 'Error al añadir docente.' });
    } finally {
      setIsAdding(false); 
      setTimeout(() => {
        setAddMessage(null);
        setMainMessage(null);
      }, 3000);
    }
  };

  // Manejador para cambiar el estado de un profesor
  const handleToggleProfesorStatus = async (profesorId: string, currentStatus: 'Activo' | 'Inactivo') => {
    setMainMessage(null); 
    const newStatus = currentStatus === 'Activo' ? 'Inactivo' : 'Activo'; 
    try {
      // Ruta completa para actualizar estado
      const response = await axios.put(`${API_BASE_URL}/profesores/${profesorId}`, {
        estado: newStatus,
      });

      if (response.data.affectedRows === 0 && response.status === 200) {
         console.warn(`No se encontraron cambios para el profesor ${profesorId}, pero la operación fue exitosa (código 200).`);
      }

      setProfessors(prevProfessors =>
        prevProfessors.map(prof =>
          prof.id === profesorId ? { ...prof, estado: newStatus } : prof
        )
      );
      setMainMessage({ type: 'success', text: `Estado de docente ${profesorId} actualizado a ${newStatus}.` });
    } catch (error: any) {
      console.error('Error al actualizar estado:', error.response?.data || error.message);
      let errorText = `Error al actualizar estado: ${error.message || 'Desconocido'}`;
      if (error.response) {
        if (error.response.status === 404) {
          errorText = `Error: Docente no encontrado.`;
        } else if (error.response.data && error.response.data.message) {
          errorText = `Error: ${error.response.data.message}`;
        }
      }
      setMainMessage({ type: 'error', text: errorText });
    } finally {
      setTimeout(() => setMainMessage(null), 3000);
    }
  };

  return (
    <div className="gestion-docente-page-container">
      <h1 className="main-page-title">Gestión de Docentes</h1>

      {mainMessage && (
        <p className={`page-feedback-message ${mainMessage.type}`}>
          {mainMessage.text}
        </p>
      )}

      {/* Sección para añadir nuevo docente */}
      <div className="generar-docente-container">
        <h2 className="generar-docente-title">Añadir Nuevo Docente</h2>
        <form onSubmit={handleAddProfesor} className="generar-docente-form">
          <div className="form-group">
            <label htmlFor="id-institucional">ID Institucional:</label>
            <input
              type="text"
              id="id-institucional"
              value={newIdInstitucional}
              onChange={(e) => setNewIdInstitucional(e.target.value)}
              required
              disabled={isAdding}
            />
          </div>
          <div className="form-group">
            <label htmlFor="nombre">Nombre:</label>
            <input
              type="text"
              id="nombre"
              value={newNombre}
              onChange={(e) => setNewNombre(e.target.value)}
              required
              disabled={isAdding}
            />
          </div>
          <div className="form-group">
            <label htmlFor="horas-contrato">Horas Contrato:</label>
            <input
              type="number"
              id="horas-contrato"
              min="0"
              value={newHorasContrato}
              onChange={(e) => setNewHorasContrato(e.target.value === '' ? '' : parseInt(e.target.value))}
              required
              disabled={isAdding}
            />
          </div>
          <div className="form-group">
            <label htmlFor="estado-add">Estado:</label>
            <select
              id="estado-add"
              value={newEstado}
              onChange={(e) => setNewEstado(e.target.value as 'Activo' | 'Inactivo')}
              required
              disabled={isAdding}
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="horario">Horario (solo demostración):</label>
            <input
              type="text"
              id="horario"
              value={newHorario}
              onChange={(e) => setNewHorario(e.target.value)}
              placeholder="Ej: Lunes 9-11, Martes 14-16"
              disabled={isAdding}
            />
          </div>

          <button type="submit" className="add-docente-button" disabled={isAdding}>
            {isAdding ? 'Añadiendo...' : 'Añadir Docente'}
          </button>
        </form>
        {addMessage && (
          <p className={`add-docente-message ${addMessage.type}`}>
            {addMessage.text}
          </p>
        )}
      </div>

      {/* Sección para administrar docentes existentes */}
      <div className="administrar-docente-container">
        <h2 className="administrar-docente-title">Administrar Docentes Existentes</h2>
        <button onClick={fetchProfessors} disabled={isLoading} className="refresh-button">
          {isLoading ? 'Cargando...' : 'Recargar Docentes'}
        </button>

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        {isLoading ? (
          <p>Cargando docentes...</p>
        ) : professors.length === 0 ? (
          <p>No hay docentes registrados.</p>
        ) : (
          <div className="docentes-table-container"> {/* Contenedor para tabla */}
            <table className="docentes-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>ID Institucional</th>
                  <th>Nombre</th>
                  <th>Horas Contrato</th>
          
                  <th>Estado</th>
                  <th>Fecha Registro</th>
                  <th>Última Modificación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {professors.map((profesor) => (
                  <tr key={profesor.id}>
                    <td>{profesor.id}</td>
                    <td>{profesor.id_institucional}</td>
                    <td>{profesor.nombre}</td>
                    <td>{profesor.horas_segun_contrato}</td>
                  
                    <td>
                      <span className={`estado-badge ${profesor.estado.toLowerCase()}`}>
                        {profesor.estado}
                      </span>
                    </td>
                    <td>{profesor.fecha_registro ? new Date(profesor.fecha_registro).toLocaleDateString() : 'N/A'}</td>
                    <td>{profesor.fecha_modificacion ? new Date(profesor.fecha_modificacion).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <button
                        className={`toggle-status-button ${profesor.estado.toLowerCase()}`}
                        onClick={() => handleToggleProfesorStatus(profesor.id, profesor.estado)}
                      >
                        {profesor.estado === 'Activo' ? 'Desactivar' : 'Activar'}
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

export default GestionDocente;
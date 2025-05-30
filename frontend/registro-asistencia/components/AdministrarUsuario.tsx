import React, { useState, useEffect } from 'react';
import '../css/AdministrarUsuario.css';

interface Profesor {
  id: number; 
  id_institucional: string; 
  nombre: string;
  horas_segun_contrato: number; 
  estado: 'Activo' | 'Inactivo';
  fecha_registro: string; // Asegúrate de que el formato de fecha sea compatible con cómo la API lo envía
  fecha_modificacion: string; // Asegúrate de que el formato de fecha sea compatible con cómo la API lo envía
}

const AdministrarUsuario: React.FC = () => {
  const [newIdInstitucional, setNewIdInstitucional] = useState('');
  const [newNombre, setNewNombre] = useState('');
  const [newHorasContrato, setNewHorasContrato] = useState<number | ''>('');
  const [newEstado, setNewEstado] = useState<'Activo' | 'Inactivo'>('Activo');
  const [addMessage, setAddMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [professors, setProfessors] = useState<Profesor[]>([]);
  
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);

  // Usamos la URL directamente, ya que no tienes un .env para el frontend
  const API_BASE_URL = 'http://localhost:3000'; 

  // Función para cargar los profesores desde la API
  const fetchProfessors = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/profesores`); // Endpoint GET /profesores
      if (!response.ok) {
        const errorText = await response.text(); 
        throw new Error(`Error HTTP! Estado: ${response.status}. Mensaje: ${errorText || response.statusText}`);
      }
      const data: Profesor[] = await response.json();
      setProfessors(data);
    } catch (err: any) {
      setError(`Error al cargar profesores: ${err.message}`);
      console.error('Error fetching professors:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar profesores al montar el componente
  useEffect(() => {
    fetchProfessors();
  }, []);

  const filteredProfessors = professors.filter(profesor =>
    profesor.id_institucional.toLowerCase().includes(searchQuery.toLowerCase()) || 
    profesor.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddMessage(null); 

    if (!newIdInstitucional || !newNombre || newHorasContrato === '') {
      setAddMessage({ type: 'error', text: 'Por favor, completa ID Institucional, Nombre y Horas Contrato.' });
      return;
    }
    if (isNaN(Number(newHorasContrato)) || Number(newHorasContrato) < 0) {
      setAddMessage({ type: 'error', text: 'Horas Contrato debe ser un número válido y no negativo.' });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/profesores`, { // Endpoint POST /profesores
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_institucional: newIdInstitucional, 
          nombre: newNombre,
          horas_segun_contrato: Number(newHorasContrato), 
          estado: newEstado,
          // fecha_registro y fecha_modificacion son manejados por el backend en tu server.js
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        throw new Error(errorData.message || `Error HTTP! Estado: ${response.status}. Mensaje: ${response.statusText}`);
      }

      await fetchProfessors(); 
      setAddMessage({ type: 'success', text: 'Usuario añadido exitosamente!' });

      setNewIdInstitucional('');
      setNewNombre('');
      setNewHorasContrato('');
      setNewEstado('Activo');
      
    } catch (err: any) {
      setAddMessage({ type: 'error', text: `Error al añadir usuario: ${err.message}` });
      console.error('Error adding user:', err);
    }
  };

  const handleToggleStatus = async (profesorId: number, currentStatus: 'Activo' | 'Inactivo') => {
    const newStatus = currentStatus === 'Activo' ? 'Inactivo' : 'Activo';
    setAddMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/profesores/${profesorId}`, { // Endpoint PUT /profesores/:id
        method: 'PUT', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: newStatus }), 
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        throw new new Error(errorData.message || `Error HTTP! Estado: ${response.status}. Mensaje: ${response.statusText}`);
      }

      // Actualizar el estado en el frontend directamente para una respuesta más rápida
      setProfessors(prevProfessors =>
        prevProfessors.map(prof =>
          prof.id === profesorId ? { ...prof, estado: newStatus } : prof
        )
      );
      setAddMessage({ type: 'success', text: `Estado de profesor con ID ${profesorId} actualizado a ${newStatus}.` });
    } catch (err: any) {
      setAddMessage({ type: 'error', text: `Error al actualizar estado: ${err.message}` });
      console.error('Error toggling status:', err);
    }
  };

  if (loading) {
    return <div className="administrar-usuario-container">Cargando usuarios...</div>;
  }

  if (error) {
    return <div className="administrar-usuario-container" style={{ color: 'red', textAlign: 'center', padding: '20px' }}>
      <h2>Error al cargar datos</h2>
      <p>{error}</p>
      <button onClick={fetchProfessors} style={{ marginTop: '10px', padding: '8px 15px', cursor: 'pointer' }}>Reintentar</button>
    </div>;
  }

  return (
    <div className="administrar-usuario-container">
      <div className="add-user-section">
        <h2 className="add-user-title">Añadir docente</h2>
        <form onSubmit={handleAddUser} className="add-user-form">
          <div className="form-group">
            <label htmlFor="add-id-institucional">ID Institucional:</label>
            <input 
              type="text" 
              id="add-id-institucional" 
              value={newIdInstitucional} 
              onChange={(e) => setNewIdInstitucional(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label htmlFor="add-nombre">Nombre:</label>
            <input 
              type="text" 
              id="add-nombre" 
              value={newNombre} 
              onChange={(e) => setNewNombre(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label htmlFor="add-horas-contrato">Horas Contrato:</label>
            <input
              type="number"
              id="add-horas-contrato"
              min="0"
              value={newHorasContrato}
              onChange={(e) => setNewHorasContrato(e.target.value === '' ? '' : parseInt(e.target.value))}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="add-estado">Estado:</label>
            <select 
              id="add-estado" 
              value={newEstado} 
              onChange={(e) => setNewEstado(e.target.value as 'Activo' | 'Inactivo')} 
              required
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>
          <button type="submit" className="add-user-button">Añadir Usuario</button>
        </form>
        {addMessage && (
          <p className={`add-message ${addMessage.type}`}>
            {addMessage.text}
          </p>
        )}
      </div>
      <div className="search-table-section">
        <div className="search-bar">
          <label htmlFor="search-input">Buscar por ID Institucional o Nombre:</label>
          <input
            type="text"
            id="search-input"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="user-table-container">
          <table className="user-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>ID INSTITUCIONAL</th>
                <th>NOMBRE</th>
                <th>HORAS</th>
                <th>ESTADO</th>
                <th>Fecha Registro</th> {/* Nueva columna */}
                <th>Última Modificación</th> {/* Nueva columna */}
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filteredProfessors.length > 0 ? (
                filteredProfessors.map((profesor) => (
                  <tr key={profesor.id}> 
                    <td>{profesor.id}</td>
                    <td>{profesor.id_institucional}</td>
                    <td>{profesor.nombre}</td>
                    <td>{profesor.horas_segun_contrato}</td>
                    <td>{profesor.estado}</td>
                    <td>{profesor.fecha_registro}</td> {/* Mostrar fecha de registro */}
                    <td>{profesor.fecha_modificacion}</td> {/* Mostrar fecha de modificación */}
                    <td>
                      <button
                        // El texto del botón cambia según el estado actual
                        className={`toggle-status-button ${profesor.estado === 'Activo' ? 'status-active' : 'status-inactive'}`}
                        onClick={() => handleToggleStatus(profesor.id, profesor.estado)}
                      >
                        {/* Texto del botón según el estado, para "desactivar" si está activo o "activar" si está inactivo */}
                        {profesor.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>No se encontraron usuarios.</td> {/* Ajuste de colSpan */}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdministrarUsuario;
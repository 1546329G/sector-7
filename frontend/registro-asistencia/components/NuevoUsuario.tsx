import React, { useState, useEffect, useCallback } from 'react';
import '../css/NuevoUsuario.css'; // Asegúrate de que este archivo CSS exista

// --- Interfaces actualizadas para reflejar la tabla de MariaDB ---
interface User {
    id: string; // Coincide con 'id' de la DB (VARCHAR o INT si es auto_increment)
    username: string;
    rol: 'usuario' | 'reportes' | 'docente' | 'admin'; // Roles definidos en tu API
    activo: boolean; // Estado activo/inactivo (BOOLEAN o TINYINT(1) en DB)
    creado_en: string; // Timestamp de creación (datetime o timestamp en DB)
    actualizado_en: string; // Timestamp de última actualización (datetime o timestamp en DB)
}

const GestionUsuarios: React.FC = () => {
    // Estados para el formulario de nuevo usuario
    const [newUsername, setNewUsername] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [newRole, setNewRole] = useState<User['rol']>('usuario'); // Rol por defecto para nuevos usuarios

    // Estados para la tabla de usuarios
    // ¡AHORA INICIALIZADO COMO ARRAY VACÍO!
    const [users, setUsers] = useState<User[]>([]);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editUsername, setEditUsername] = useState<string>('');
    const [editRole, setEditRole] = useState<User['rol']>('usuario');
    const [editActivo, setEditActivo] = useState<boolean>(false);

    // Estados de carga y mensajes
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isFormSubmitting, setIsFormSubmitting] = useState<boolean>(false);
    const [isEditingSubmitting, setIsEditingSubmitting] = useState<boolean>(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

    // --- URLs de tu API Backend ---
    const API_AUTH_URL = 'http://localhost:5009/api/auth'; // Endpoint para autenticación/registro
    const API_USERS_URL = 'http://localhost:5009/api/users'; // Endpoint para gestión de usuarios (CRUD)

    // Función para obtener el token JWT del localStorage
    const getToken = useCallback(() => {
        return localStorage.getItem('jwt_token'); // Asegúrate de que así guardas tu token después del login
    }, []);

    // Función para cargar usuarios desde el backend
    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setMessage(null);
        const token = getToken();

        if (!token) {
            setMessage({ type: 'error', text: 'No estás autenticado. Por favor, inicia sesión para ver los usuarios.' });
            setIsLoading(false);
            // Aquí podrías redirigir al login si es necesario, por ejemplo con useHistory de react-router-dom
            // history.push('/login'); 
            return;
        }

        try {
            // Esta petición requiere que tengas el endpoint GET /api/users implementado en tu API
            const response = await fetch(API_USERS_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Envía el token para rutas protegidas
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al cargar usuarios');
            }

            const data: User[] = await response.json();
            // Asegurarse de que 'activo' sea booleano si la API lo devuelve como 0/1
            const formattedUsers = data.map(user => ({
                ...user,
                activo: Boolean(user.activo)
            }));
            setUsers(formattedUsers);
            setMessage({ type: 'success', text: `Usuarios cargados: ${formattedUsers.length}` });

        } catch (error: any) {
            console.error('Error al cargar usuarios:', error);
            setMessage({ type: 'error', text: error.message || 'Error al cargar usuarios. Asegúrate de que tu API tiene el endpoint /api/users y estás autenticado con un rol permitido (ej. admin).' });
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    }, [getToken, API_USERS_URL]);

    // Cargar usuarios al montar el componente
    // Se ejecuta una vez al inicio. fetchUsers se useCallback, por lo que esta dependencia no causará re-renders innecesarios.
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Manejador para crear un nuevo usuario (ahora enviando a tu API real)
    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setIsFormSubmitting(true);

        if (!newUsername || !newPassword) {
            setMessage({ type: 'error', text: 'Por favor, ingresa un nombre de usuario y contraseña.' });
            setIsFormSubmitting(false);
            return;
        }
        
        // El endpoint /api/auth/register de tu API no necesita un token
        // para el registro inicial, según tu código de backend.
        // Si tu authMiddleware lo protege, necesitarías un token aquí (lo cual sería inusual para un registro).

        try {
            const response = await fetch(`${API_AUTH_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: newUsername,
                    password: newPassword, // La contraseña se envía en texto plano, tu API la hashea
                    rol: newRole, // Envía el rol seleccionado
                }),
            });

            const data = await response.json(); // Lee la respuesta (message)

            if (!response.ok) {
                throw new Error(data.message || 'Error al crear usuario.');
            }

            setMessage({ type: 'success', text: data.message || `Usuario '${newUsername}' creado exitosamente en la base de datos.` });

            // Una vez creado en la base de datos, ¡recargar la lista de usuarios para que se muestre!
            fetchUsers();

            // Limpiar el formulario
            setNewUsername('');
            setNewPassword('');
            setNewRole('usuario'); // Resetear el rol a su valor por defecto

        } catch (error: any) {
            console.error('Error al crear usuario:', error);
            setMessage({ type: 'error', text: error.message || 'Error al crear usuario. Inténtalo de nuevo.' });
        } finally {
            setIsFormSubmitting(false);
        }
    };

    // Manejador para iniciar la edición
    const handleEdit = (user: User) => {
        setEditingUser(user);
        setEditUsername(user.username);
        setEditRole(user.rol);
        setEditActivo(user.activo);
        setMessage(null);
    };

    // Manejador para guardar cambios de edición
    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setIsEditingSubmitting(true);
        const token = getToken();

        if (!editingUser) return;
        if (!token) {
            setMessage({ type: 'error', text: 'No autenticado para editar usuario.' });
            setIsEditingSubmitting(false);
            return;
        }

        try {
            // Esta petición requiere que tengas el endpoint PUT /api/users/:id implementado en tu API
            const response = await fetch(`${API_USERS_URL}/${editingUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Envía el token
                },
                body: JSON.stringify({
                    username: editUsername,
                    rol: editRole,
                    activo: editActivo,
                    // No se envía la contraseña aquí, se asume que se gestiona aparte
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al actualizar usuario');
            }

            // Si tu API devuelve el usuario actualizado, úsalo.
            // Si solo devuelve un mensaje, recarga fetchUsers()
            // Aquí asumo que tu API devuelve un objeto 'user' actualizado
            const updatedUser: User = {
                ...editingUser, // Mantener campos como 'creado_en'
                id: data.user.id, // Asegurarse de que el ID es correcto
                username: data.user.username,
                rol: data.user.rol,
                activo: Boolean(data.user.activo), // Asegura que sea booleano
                actualizado_en: data.user.actualizado_en, // Usa el timestamp de la DB
            };

            setUsers(prevUsers =>
                prevUsers.map(user => (user.id === updatedUser.id ? updatedUser : user))
            );
            setMessage({ type: 'success', text: data.message || `Usuario '${updatedUser.username}' actualizado.` });
            setEditingUser(null); // Salir del modo edición
        } catch (error: any) {
            console.error('Error al guardar edición:', error);
            setMessage({ type: 'error', text: error.message || 'Error al actualizar usuario. Asegúrate de que tu API tiene el endpoint PUT /api/users/:id' });
        } finally {
            setIsEditingSubmitting(false);
        }
    };

    // Manejador para cancelar la edición
    const handleCancelEdit = () => {
        setEditingUser(null);
        setMessage(null);
    };

    // Manejador para eliminar un usuario
    const handleDelete = async (userId: string, username: string) => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar a '${username}'? Esta acción es irreversible.`)) {
            return;
        }

        setMessage(null);
        setIsLoading(true); // Puedes poner un loading más específico si prefieres
        const token = getToken();

        if (!token) {
            setMessage({ type: 'error', text: 'No autenticado para eliminar usuario.' });
            setIsLoading(false);
            return;
        }

        try {
            // Esta petición requiere que tengas el endpoint DELETE /api/users/:id implementado en tu API
            const response = await fetch(`${API_USERS_URL}/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al eliminar usuario');
            }

            setUsers(prevUsers => prevUsers.filter(user => user.id !== userId)); // Elimina del estado local
            setMessage({ type: 'success', text: data.message || `Usuario '${username}' eliminado.` });
        } catch (error: any) {
            console.error('Error al eliminar usuario:', error);
            setMessage({ type: 'error', text: error.message || 'Error al eliminar usuario. Asegúrate de que tu API tiene el endpoint DELETE /api/users/:id' });
        } finally {
            setIsLoading(false);
        }
    };

    // Manejador para cambiar el estado de un usuario (activo/inactivo)
    const toggleUserStatus = async (userId: string, currentStatus: boolean, username: string) => {
        setMessage(null);
        const token = getToken();

        if (!token) {
            setMessage({ type: 'error', text: 'No autenticado para cambiar el estado.' });
            return;
        }

        try {
            // Esta petición requiere que tengas el endpoint PATCH /api/users/:id/toggle-status implementado en tu API
            const response = await fetch(`${API_USERS_URL}/${userId}/toggle-status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ activo: !currentStatus }), // Envía el nuevo estado
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al cambiar estado de usuario');
            }

            // Actualiza el estado local para reflejar el cambio y el timestamp
            setUsers(prevUsers =>
                prevUsers.map(user => (user.id === userId ? { ...user, activo: !currentStatus, actualizado_en: new Date().toISOString() } : user))
            );
            setMessage({ type: 'success', text: data.message || `Estado de '${username}' actualizado a ${!currentStatus ? 'Activo' : 'Inactivo'}.` });
        } catch (error: any) {
            console.error('Error al cambiar estado de usuario:', error);
            setMessage({ type: 'error', text: error.message || 'Error al cambiar estado de usuario. Asegúrate de que tu API tiene el endpoint PATCH /api/users/:id/toggle-status' });
        }
    };

    return (
        <div className="gestion-usuarios-container">
            <h2 className="gestion-usuarios-title">Gestión de Usuarios</h2>

            {message && (
                <p className={`message-feedback ${message.type}`}>
                    {message.text}
                </p>
            )}

            {/* Sección para crear nuevo usuario */}
            <div className="card new-user-card">
                <h3>Crear Nuevo Usuario</h3>
                <form onSubmit={handleCreateUser} className="new-user-form">
                    <div className="form-group">
                        <label htmlFor="new-username">Usuario:</label>
                        <input
                            type="text"
                            id="new-username"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            required
                            disabled={isFormSubmitting}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="new-password">Contraseña:</label>
                        <input
                            type="password"
                            id="new-password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            disabled={isFormSubmitting}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="new-role">Rol:</label>
                        <select
                            id="new-role"
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value as User['rol'])}
                            disabled={isFormSubmitting}
                        >
                            <option value="usuario">Usuario</option>
                            <option value="reportes">Reportes</option>
                            <option value="docente">Docente</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>
                    <button type="submit" className="create-user-button" disabled={isFormSubmitting}>
                        {isFormSubmitting ? 'Creando...' : 'Crear Usuario'}
                    </button>
                </form>
            </div>

            {/* Sección para listar y administrar usuarios */}
            <div className="card users-list-card">
                <h3>Usuarios Registrados</h3>
                {isLoading ? (
                    <p className="loading-message">Cargando usuarios...</p>
                ) : users.length === 0 ? (
                    <p>No hay usuarios registrados. Asegúrate de que tu API está funcionando y tienes usuarios en la base de datos.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>Usuario</th>
                                    <th>Rol</th>
                                    <th>Estado</th>
                                    <th>Creado en</th>
                                    <th>Actualizado en</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            {editingUser?.id === user.id ? (
                                                <input
                                                    type="text"
                                                    value={editUsername}
                                                    onChange={(e) => setEditUsername(e.target.value)}
                                                    disabled={isEditingSubmitting}
                                                    className="edit-input"
                                                />
                                            ) : (
                                                user.username
                                            )}
                                        </td>
                                        <td>
                                            {editingUser?.id === user.id ? (
                                                <select
                                                    value={editRole}
                                                    onChange={(e) => setEditRole(e.target.value as User['rol'])}
                                                    disabled={isEditingSubmitting}
                                                    className="edit-select"
                                                >
                                                    <option value="usuario">Usuario</option>
                                                    <option value="reportes">Reportes</option>
                                                    <option value="docente">Docente</option>
                                                    <option value="admin">Administrador</option>
                                                </select>
                                            ) : (
                                                user.rol
                                            )}
                                        </td>
                                        <td className={user.activo ? 'status-active' : 'status-inactive'}>
                                            {editingUser?.id === user.id ? (
                                                <select
                                                    value={editActivo ? 'Activo' : 'Inactivo'}
                                                    onChange={(e) => setEditActivo(e.target.value === 'Activo')}
                                                    disabled={isEditingSubmitting}
                                                    className="edit-select"
                                                >
                                                    <option value="Activo">Activo</option>
                                                    <option value="Inactivo">Inactivo</option>
                                                </select>
                                            ) : (
                                                user.activo ? 'Activo' : 'Inactivo'
                                            )}
                                        </td>
                                        <td>{new Date(user.creado_en).toLocaleString()}</td>
                                        <td>{new Date(user.actualizado_en).toLocaleString()}</td>
                                        <td>
                                            {editingUser?.id === user.id ? (
                                                <>
                                                    <button
                                                        onClick={handleSaveEdit}
                                                        className="action-button save-button"
                                                        disabled={isEditingSubmitting}
                                                    >
                                                        Guardar
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="action-button cancel-button"
                                                        disabled={isEditingSubmitting}
                                                    >
                                                        Cancelar
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(user)}
                                                        className="action-button edit-button"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => toggleUserStatus(user.id, user.activo, user.username)}
                                                        className={`action-button toggle-status-button ${user.activo ? 'deactivate' : 'activate'}`}
                                                    >
                                                        {user.activo ? 'Desactivar' : 'Activar'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.id, user.username)}
                                                        className="action-button delete-button"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </>
                                            )}
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

export default GestionUsuarios;
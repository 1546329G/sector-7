import React, { useState, useEffect, useCallback } from 'react';
import '../css/NuevoUsuario.css'; // Asegúrate de que esta ruta sea correcta y el archivo exista

// --- Interfaces para los datos de usuario (deben coincidir con tu DB/API) ---
interface User {
    id: string; // O number, si tu ID en la DB es numérico
    username: string;
    rol: 'usuario' | 'reportes' | 'docente' | 'admin'; // Roles que manejas
    activo: boolean; // Estado activo/inactivo
    creado_en: string; // Fecha de creación (ISO string)
    actualizado_en: string; // Fecha de última actualización (ISO string)
}

const GestionUsuarios: React.FC = () => {
    // --- Estados para el formulario de nuevo usuario ---
    const [newUsername, setNewUsername] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [newRole, setNewRole] = useState<User['rol']>('usuario'); // Rol por defecto

    // --- Estados para la tabla de usuarios ---
    const [users, setUsers] = useState<User[]>([]);
    const [editingUser, setEditingUser] = useState<User | null>(null); // Usuario que se está editando
    const [editUsername, setEditUsername] = useState<string>('');
    const [editRole, setEditRole] = useState<User['rol']>('usuario');
    const [editActivo, setEditActivo] = useState<boolean>(false);

    // --- Estados de UI/mensajes ---
    const [isLoading, setIsLoading] = useState<boolean>(true); // Carga inicial de usuarios
    const [isFormSubmitting, setIsFormSubmitting] = useState<boolean>(false); // Envío del formulario de creación
    const [isEditingSubmitting, setIsEditingSubmitting] = useState<boolean>(false); // Envío del formulario de edición
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

    // --- URLs de tu API Backend (confirmado que usa el puerto 5010) ---
    const API_AUTH_URL = 'http://localhost:5010/api/auth';
    const API_USERS_URL = 'http://localhost:5010/api/users';

    // --- Función para obtener el token JWT del localStorage ---
    const getToken = useCallback(() => {
        return localStorage.getItem('jwt_token');
    }, []);

    // --- Manejador para crear un nuevo usuario ---
    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setIsFormSubmitting(true);

        if (!newUsername || !newPassword) {
            setMessage({ type: 'error', text: 'Por favor, ingresa un nombre de usuario y contraseña.' });
            setIsFormSubmitting(false);
            return;
        }

        try {
            // Este endpoint de registro NO DEBE requerir autenticación en tu API.
            const response = await fetch(`${API_AUTH_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: newUsername,
                    password: newPassword,
                    rol: newRole,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al crear usuario.');
            }

            setMessage({ type: 'success', text: data.message || `Usuario '${newUsername}' creado exitosamente.` });

            // Después de crear, recargamos la lista de usuarios.
            // Esta llamada a fetchUsers() requerirá que el usuario actual esté logueado
            // con los permisos adecuados para ver la lista.
            fetchUsers();

            // Limpiar el formulario
            setNewUsername('');
            setNewPassword('');
            setNewRole('usuario');

        } catch (error: any) {
            console.error('Error al crear usuario:', error);
            setMessage({ type: 'error', text: error.message || 'Error al crear usuario. Asegúrate de que tu API está disponible en /api/auth/register.' });
        } finally {
            setIsFormSubmitting(false);
        }
    };

    // --- Manejador para iniciar el modo de edición ---
    const handleEdit = (user: User) => {
        setEditingUser(user);
        setEditUsername(user.username);
        setEditRole(user.rol);
        setEditActivo(user.activo);
        setMessage(null);
    };

    // --- Manejador para guardar los cambios de un usuario editado ---
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
            // Este endpoint PUT /api/users/:id requiere autenticación y autorización
            const response = await fetch(`${API_USERS_URL}/${editingUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: editUsername,
                    rol: editRole,
                    activo: editActivo,
                    // No se envía la contraseña aquí
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al actualizar usuario.');
            }

            // Actualiza el estado local de los usuarios
            setUsers(prevUsers =>
                prevUsers.map(user => (user.id === editingUser.id ? {
                    ...user,
                    username: editUsername,
                    rol: editRole,
                    activo: editActivo,
                    actualizado_en: data.user?.actualizado_en || new Date().toISOString() // Usa el timestamp de la API si lo devuelve
                } : user))
            );
            setMessage({ type: 'success', text: data.message || `Usuario '${editUsername}' actualizado.` });
            setEditingUser(null); // Salir del modo edición
        } catch (error: any) {
            console.error('Error al guardar edición:', error);
            setMessage({ type: 'error', text: error.message || 'Error al actualizar usuario. Asegúrate de que tu API tiene el endpoint PUT /api/users/:id.' });
        } finally {
            setIsEditingSubmitting(false);
        }
    };

    // --- Manejador para cancelar el modo de edición ---
    const handleCancelEdit = () => {
        setEditingUser(null);
        setMessage(null);
    };

    // --- Manejador para eliminar un usuario ---
    const handleDelete = async (userId: string, username: string) => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar a '${username}'? Esta acción es irreversible.`)) {
            return;
        }

        setMessage(null);
        setIsLoading(true); // Poner loading general durante la eliminación
        const token = getToken();

        if (!token) {
            setMessage({ type: 'error', text: 'No autenticado para eliminar usuario.' });
            setIsLoading(false);
            return;
        }

        try {
            // Este endpoint DELETE /api/users/:id requiere autenticación y autorización
            const response = await fetch(`${API_USERS_URL}/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al eliminar usuario.');
            }

            setUsers(prevUsers => prevUsers.filter(user => user.id !== userId)); // Eliminar del estado local
            setMessage({ type: 'success', text: data.message || `Usuario '${username}' eliminado.` });
        } catch (error: any) {
            console.error('Error al eliminar usuario:', error);
            setMessage({ type: 'error', text: error.message || 'Error al eliminar usuario. Asegúrate de que tu API tiene el endpoint DELETE /api/users/:id.' });
        } finally {
            setIsLoading(false);
        }
    };

    // --- Manejador para cambiar el estado activo/inactivo de un usuario ---
    const toggleUserStatus = async (userId: string, currentStatus: boolean, username: string) => {
        setMessage(null);
        const token = getToken();

        if (!token) {
            setMessage({ type: 'error', text: 'No autenticado para cambiar el estado.' });
            return;
        }

        try {
            // Este endpoint PATCH /api/users/:id/toggle-status requiere autenticación y autorización
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
                throw new Error(data.message || 'Error al cambiar estado de usuario.');
            }

            // Actualiza el estado local para reflejar el cambio y el timestamp
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.id === userId
                        ? { ...user, activo: !currentStatus, actualizado_en: data.user?.actualizado_en || new Date().toISOString() }
                        : user
                )
            );
            setMessage({ type: 'success', text: data.message || `Estado de '${username}' actualizado a ${!currentStatus ? 'Activo' : 'Inactivo'}.` });
        } catch (error: any) {
            console.error('Error al cambiar estado de usuario:', error);
            setMessage({ type: 'error', text: error.message || 'Error al cambiar estado de usuario. Asegúrate de que tu API tiene el endpoint PATCH /api/users/:id/toggle-status.' });
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
                    // Mensaje cuando no hay usuarios o no se pudieron cargar
                    <p>No hay usuarios registrados o no tienes permiso para verlos. Asegúrate de que tu API esté funcionando y tengas usuarios en la base de datos.</p>
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
                                                    value={editActivo ? 'true' : 'false'} // Valores de option como string
                                                    onChange={(e) => setEditActivo(e.target.value === 'true')}
                                                    disabled={isEditingSubmitting}
                                                    className="edit-select"
                                                >
                                                    <option value="true">Activo</option>
                                                    <option value="false">Inactivo</option>
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


//Crear nuevos usuarios: Incluye campos para el nombre de usuario, la contraseña y el rol.
//Listar usuarios existentes: Muestra su nombre de usuario, rol, estado (activo/inactivo), fecha de creación y última actualización.
//Editar detalles de usuario: Permite modificar el nombre de usuario, el rol y el estado de actividad.
//Cambiar el estado del usuario: Activar o desactivar a un usuario con un solo clic.
//Eliminar usuarios: Con una confirmación previa para evitar borrados accidentales.
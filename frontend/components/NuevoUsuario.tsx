// NuevoUsuario.tsx
import React, { useState, useEffect, useCallback } from 'react';
import '../css/NuevoUsuario.css'; 
import { API_URL } from '../src/config';

// --- Interfaces para los datos de usuario ---
interface User {
    id: string;
    username: string;
    rol: 'usuario' | 'reportes' | 'docente' | 'admin' | 'user';
    activo: boolean;
    creado_en: string;
    actualizado_en: string;

}

const NuevoUsuario: React.FC = () => {
    // --- Estados para el formulario de nuevo usuario ---
    const [newUsername, setNewUsername] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [newRole, setNewRole] = useState<User['rol']>('usuario'); // Rol por defecto

    // --- Estados para la tabla de usuarios ---
    const [users, setUsers] = useState<User[]>([]); // Estado para la lista de usuarios
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editUsername, setEditUsername] = useState<string>('');
    const [editRole, setEditRole] = useState<User['rol']>('usuario');
    const [editActivo, setEditActivo] = useState<boolean>(false);

    // --- Estados de UI/mensajes ---
    const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true); 
    const [isLoadingCount, setIsLoadingCount] = useState<boolean>(true); 
    const [isFormSubmitting, setIsFormSubmitting] = useState<boolean>(false); 
    const [isEditingSubmitting, setIsEditingSubmitting] = useState<boolean>(false); 
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

    // --- Estado para el conteo de usuarios ---
    const [userCount, setUserCount] = useState<number | null>(null);

    // --- URLs de tu API Backend ---
    const API_AUTH_URL = `${API_URL}/api/auth`;
    const API_USERS_URL = `${API_URL}/api/users`;

    // --- Función para obtener el token JWT del localStorage ---
    const getToken = useCallback(() => {
        return localStorage.getItem('jwt_token');
    }, []);

    // --- Nueva función para obtener el conteo de usuarios ---
    const fetchUserCount = useCallback(async () => {
        setIsLoadingCount(true);
        setMessage(null);
        const token = getToken();

        if (!token) {
            setMessage({ type: 'error', text: 'No autenticado para obtener el conteo de usuarios.' });
            setIsLoadingCount(false);
            setUserCount(null);
            return;
        }

        try {
            const response = await fetch(`${API_USERS_URL}/count`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                // Manejar 401/403 aquí si el token es inválido o el rol no tiene permiso
                if (response.status === 401 || response.status === 403) {
                    setMessage({ type: 'error', text: 'No autorizado para ver el conteo de usuarios. Asegúrate de tener el rol correcto (admin/reportes).' });
                } else {
                    throw new Error(data.message || 'Error al obtener el conteo de usuarios.');
                }
            } else {
                setUserCount(data.totalUsers);
            }
        } catch (error: any) {
            console.error('Error al obtener el conteo de usuarios:', error);
            setMessage({ type: 'error', text: error.message || 'Error al cargar el conteo de usuarios.' });
            setUserCount(null);
        } finally {
            setIsLoadingCount(false);
        }
    }, [getToken, API_USERS_URL]);

    // --- Nueva función para obtener TODOS los usuarios (para la tabla) ---
    const fetchUsers = useCallback(async () => {
        setIsLoadingUsers(true);
        setMessage(null);
        const token = getToken();

        if (!token) {
            setMessage({ type: 'error', text: 'No autenticado para obtener la lista de usuarios.' });
            setIsLoadingUsers(false);
            setUsers([]); // Limpia la tabla si no hay token
            return;
        }

        try {
            const response = await fetch(`${API_USERS_URL}/`, { // Llama al endpoint de todos los usuarios
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    setMessage({ type: 'error', text: 'No autorizado para ver la lista de usuarios. Asegúrate de tener el rol correcto (admin/reportes).' });
                } else {
                    throw new Error(data.message || 'Error al obtener los usuarios.');
                }
            } else {
                // Asegurarse de que los datos tengan las propiedades correctas
                const formattedUsers: User[] = data.map((user: any) => ({
                    id: user.id.toString(), 
                    username: user.username,
                    rol: user.rol as User['rol'],
                    activo: Boolean(user.activo), // Convertir tinyint(1) a boolean
                    creado_en: user.creado_en,
                    actualizado_en: user.actualizado_en,
                }));
                setUsers(formattedUsers);
            }
        } catch (error: any) {
            console.error('Error al obtener los usuarios:', error);
            setMessage({ type: 'error', text: error.message || 'Error al cargar la lista de usuarios.' });
            setUsers([]);
        } finally {
            setIsLoadingUsers(false);
        }
    }, [getToken, API_USERS_URL]);

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

            // Recargar el conteo y la lista de usuarios después de crear uno nuevo
            fetchUserCount();
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
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al actualizar usuario.');
            }

            setMessage({ type: 'success', text: data.message || `Usuario '${editUsername}' actualizado.` });
            setEditingUser(null);
            fetchUsers(); // Recargar la lista después de la edición
            fetchUserCount(); // Recargar el conteo si un usuario se activa/desactiva
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
        const token = getToken();

        if (!token) {
            setMessage({ type: 'error', text: 'No autenticado para eliminar usuario.' });
            return;
        }

        try {
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

            setMessage({ type: 'success', text: data.message || `Usuario '${username}' eliminado.` });
            fetchUsers(); // Recargar la lista después de eliminar
            fetchUserCount(); // Recargar el conteo después de eliminar
        } catch (error: any) {
            console.error('Error al eliminar usuario:', error);
            setMessage({ type: 'error', text: error.message || 'Error al eliminar usuario. Asegúrate de que tu API tiene el endpoint DELETE /api/users/:id.' });
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

            setMessage({ type: 'success', text: data.message || `Estado de '${username}' actualizado a ${!currentStatus ? 'Activo' : 'Inactivo'}.` });
            fetchUsers(); 
            fetchUserCount(); 
        } catch (error: any) {
            console.error('Error al cambiar estado de usuario:', error);
            setMessage({ type: 'error', text: error.message || 'Error al cambiar estado de usuario. Asegúrate de que tu API tiene el endpoint PATCH /api/users/:id/toggle-status.' });
        }
    };

    // --- useEffect para cargar el conteo y la lista de usuarios al montar el componente ---
    useEffect(() => {
        fetchUserCount();
        fetchUsers();
    }, [fetchUserCount, fetchUsers]); 

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

            {/* Sección para mostrar el conteo de usuarios registrados */}
            <div className="card users-count-card"> {/* Renombrado para claridad */}
                <h3>Conteo de Usuarios</h3>
                {isLoadingCount ? (
                    <p>Cargando conteo de usuarios...</p>
                ) : (
                    userCount !== null ? (
                        <p className="user-count">Total: **{userCount}** usuarios</p>
                    ) : (
                        <p className="user-count">No se pudo cargar el conteo de usuarios.</p>
                    )
                )}
            </div>

            {/* Sección para mostrar la tabla de usuarios registrados */}
            <div className="card users-list-card">
                <h3>Lista de Usuarios Registrados</h3>
                {isLoadingUsers ? (
                    <p>Cargando lista de usuarios...</p>
                ) : users.length > 0 ? (
                    <div className="users-table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Usuario</th>
                                    <th>Rol</th>
                                    <th>Activo</th>
                                    <th>Creado En</th>
                                    <th>Actualizado En</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td>{user.id}</td>
                                        <td>
                                            {editingUser?.id === user.id ? (
                                                <input
                                                    type="text"
                                                    value={editUsername}
                                                    onChange={(e) => setEditUsername(e.target.value)}
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
                                        <td>
                                            {editingUser?.id === user.id ? (
                                                <input
                                                    type="checkbox"
                                                    checked={editActivo}
                                                    onChange={(e) => setEditActivo(e.target.checked)}
                                                />
                                            ) : (
                                                user.activo ? 'Sí' : 'No'
                                            )}
                                        </td>
                                        <td>{new Date(user.creado_en).toLocaleString()}</td>
                                        <td>{new Date(user.actualizado_en).toLocaleString()}</td>
                                        <td className="actions-column">
                                            {editingUser?.id === user.id ? (
                                                <>
                                                    <button className="save-button" onClick={handleSaveEdit} disabled={isEditingSubmitting}>
                                                        {isEditingSubmitting ? 'Guardando...' : 'Guardar'}
                                                    </button>
                                                    <button className="cancel-button" onClick={handleCancelEdit} disabled={isEditingSubmitting}>
                                                        Cancelar
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button className="edit-button" onClick={() => handleEdit(user)}>Editar</button>
                                                    <button
                                                        className={`toggle-status-button ${user.activo ? 'toggle-status-button-active' : 'toggle-status-button-inactive'}`}
                                                        onClick={() => toggleUserStatus(user.id, user.activo, user.username)}
                                                    >
                                                        {user.activo ? 'Desactivar' : 'Activar'}
                                                    </button>
                                                    <button className="delete-button" onClick={() => handleDelete(user.id, user.username)}>Eliminar</button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p>No hay usuarios registrados o no se pudieron cargar.</p>
                )}
            </div>
            <h5>lo hizo gandy,</h5>
        </div>
    );
};

export default NuevoUsuario;
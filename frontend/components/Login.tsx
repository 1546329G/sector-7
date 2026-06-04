// C:\xampp\htdocs\Proyecto\proyecto-entregable-sector-7\frontend\src\pages\Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../src/config';

interface LoginProps {
    onLoginSuccess?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);
    const navigate = useNavigate();

    const API_AUTH_BASE_URL = `${API_URL}/api/auth`;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        setError(null);
        setSuccess(false);

        try {
            const response = await axios.post(`${API_AUTH_BASE_URL}/login`, {
                username,
                password,
            });

            const data = response.data;

            if (data.token) {
                // --- CAMBIO CLAVE AQUÍ: Usar 'jwt_token' en lugar de 'authToken' ---
                localStorage.setItem('jwt_token', data.token); //
                if (data.user) {
                    localStorage.setItem('currentUser', JSON.stringify(data.user));
                }
                setSuccess(true);
                if (onLoginSuccess) {
                    onLoginSuccess();
                }
                navigate('/home'); // O la ruta a la que quieras ir después del login
            } else {
                setError('Inicio de sesión exitoso, pero no se recibió token.');
            }

        } catch (err: any) {
            if (axios.isAxiosError(err) && err.response) {
                setError(err.response.data.message || 'Credenciales inválidas. Inténtalo de nuevo.');
            } else {
                setError('Error de conexión con el servidor. Por favor, verifica que el backend esté corriendo.');
                console.error('Error completo:', err);
            }
            setSuccess(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: '#f0f2f5',
            fontFamily: 'Arial, sans-serif'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                textAlign: 'center',
                width: '300px'
            }}>
                <h2 style={{ marginBottom: '20px', color: '#333' }}>Iniciar Sesión</h2>
                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '15px', textAlign: 'left' }}>
                        <label htmlFor="username" style={{ display: 'block', marginBottom: '5px', color: '#555' }}>Usuario:</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '4px',
                                border: '1px solid #ddd',
                                boxSizing: 'border-box'
                            }}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                        <label htmlFor="password" style={{ display: 'block', marginBottom: '5px', color: '#555' }}>Contraseña:</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '4px',
                                border: '1px solid #ddd',
                                boxSizing: 'border-box'
                            }}
                            required
                        />
                    </div>
                    {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}
                    {success && <p style={{ color: 'green', marginBottom: '15px' }}>¡Inicio de sesión exitoso!</p>}
                    <button 
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '16px',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s ease'
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0056b3')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#007bff')}
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
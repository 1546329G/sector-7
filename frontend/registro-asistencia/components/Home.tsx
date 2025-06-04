import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom'; // Asegúrate de importar 'useLocation'
import welcomeImage from '../img/1.png'; // Ajusta la ruta relativa

// Y luego en el img:
<img src={welcomeImage} alt="..." />

interface LayoutProps {
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ onLogout }) => {
  const location = useLocation(); // Hook para obtener la información de la URL actual

  // Verificamos si la ruta actual es exactamente '/home'
  // Esto significa que el usuario ha llegado al dashboard sin seleccionar una opción de menú
  const showWelcomeMessage = location.pathname === '/home';

  return (
    <div className="main-layout">
      <aside className="sidebar">
        <div>
          <div className="sidebar-header">ADMIN</div>
          <nav className="sidebar-nav">
            <ul>
              <li>
                <Link to="/home/nuevo-usuario">Nuevo Usuario</Link>
              </li>
              <li>
                <Link to="/home/administrar-usuario">Administrar Docente</Link>
              </li>
              <li>
                <Link to="/home/administrar-asistencia">Administrar Asistencia</Link>
              </li>
              <li>
                <Link to="/home/administrar-movilidad">Administrar Movilidad</Link>
              </li>
              <li>
                <Link to="/home/generar-reporte">Generar Reporte</Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="sidebar-footer">
          <button onClick={onLogout}>CERRAR SESION</button>
        </div>
      </aside>
      <main className="content-area">
        {showWelcomeMessage ? (
          // Contenido de bienvenida si la URL es solo /home
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h1>¡Bienvenido al Panel de Administración!</h1>
            <p>Selecciona una opción del menú lateral para comenzar a gestionar.</p>
            <img src={welcomeImage} alt="..." />
            {/* Puedes agregar más elementos visuales o información aquí */}
          </div>
        ) : (
          // Si hay una sub-ruta activa (ej. /home/administrar-usuario),
          // se renderizará el componente correspondiente a través de Outlet.
          <Outlet />
        )}
      </main>
    </div>
  );
};

export default Layout;
import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import welcomeImage from '../img/1.png';
import '../css/desplegable.css'; // Make sure this path is correct

interface LayoutProps {
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ onLogout }) => {
  const location = useLocation();
  const showWelcomeMessage = location.pathname === '/home';

  // State to manage the sidebar's collapsed state
  // Start as collapsed by default for hover effect
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); // <--- Changed to true

  return (
    <div className="main-layout">
      {/* Add onMouseEnter and onMouseLeave events to the sidebar */}
      <aside
        className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}
        onMouseEnter={() => setIsSidebarCollapsed(false)} // Expand on mouse enter
        onMouseLeave={() => setIsSidebarCollapsed(true)}  // Collapse on mouse leave
      >
        <div>
          <div className="sidebar-header">
            {/* The "ADMIN" text will still be visible or abbreviated when collapsed */}
            ADMIN
            {/* No toggle button needed for hover effect */}
          </div>
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
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h1>¡Bienvenido al Panel de Administración!</h1>
            <p>Selecciona una opción del menú lateral para comenzar a gestionar.</p>
            <img src={welcomeImage} alt="..." />
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
};

export default Layout;
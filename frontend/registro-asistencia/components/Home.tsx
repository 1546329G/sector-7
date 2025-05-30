import React from 'react';
import { Link, Outlet } from 'react-router-dom';
interface LayoutProps {
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ onLogout }) => {
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
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
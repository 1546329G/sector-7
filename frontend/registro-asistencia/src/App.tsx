import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../components/Login';
import Home from '../components/Home'; 
import NuevoUsuario from '../components/NuevoUsuario';
import AdministrarUsuario from '../components/AdministrarUsuario'; 
import AdministrarAsistencia from '../components/AdministrarAsistencia';
import AdministrarMovilidad from '../components/AdministrarMovilidad';
import GenerarReporte from '../components/GenerarReporte';



const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    localStorage.getItem('isAuthenticated') === 'true'
  );

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
        <Route
          path="/home"
          element={isAuthenticated ? <Home onLogout={handleLogout} /> : <Navigate to="/login" replace />}
        >

          <Route path="nuevo-usuario" element={<NuevoUsuario />} />
          <Route path="administrar-usuario" element={<AdministrarUsuario />} />
     
          <Route path="administrar-asistencia" element={<AdministrarAsistencia />} />
          <Route path="administrar-movilidad" element={<AdministrarMovilidad />} />
          <Route path="generar-reporte" element={<GenerarReporte />} />
        </Route>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/home/" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
};

export default App;

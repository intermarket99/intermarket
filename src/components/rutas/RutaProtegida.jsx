import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from 'react-bootstrap';

function RutaProtegida({ children, rolesPermitidos = [] }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  // Si no hay usuario autenticado, redirigir al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado pero no ha elegido rol, forzar la selección de rol
  // Permitimos la ruta de suscripción para que el usuario pueda completar su registro como vendedor
  const rutasPermitidasSinRol = ['/seleccion-rol', '/suscripcion'];
  if (!role && !rutasPermitidasSinRol.includes(location.pathname)) {
    return <Navigate to="/seleccion-rol" replace />;
  }

  // Si se especificaron roles permitidos y el rol del usuario no está en la lista
  if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(role)) {
    // Redirigir según el rol del usuario para evitar pantallas vacías o acceso denegado
    if (role === 'vendedor') return <Navigate to="/vendedor" replace />;
    if (role === 'comprador') return <Navigate to="/catalogo" replace />;
    return <Navigate to="/seleccion-rol" replace />;
  }

  return children;
}

export default RutaProtegida;

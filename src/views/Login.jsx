import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FormularioLogin from '../components/login/FormularioLogin';
import { supabase } from "../database/supabaseconfig";
import { useAuth } from "../context/AuthContext";
import logoCompleto from "../assets/LogoCom1.png";
import "../App.css";

function Login() {
  const [usuario, setUsuario] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);
  const navegar = useNavigate();
  const { user, loading, role } = useAuth();

  const iniciarSesion = async () => {
    try {
      setCargando(true);
      setError(null);
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: usuario,
        password: contraseña,
      });

      if (authError) {
        setError("Credenciales incorrectas. Verifica tus datos.");
        return;
      }

      localStorage.removeItem("rol-activo");
    } catch (err) {
      setError("Error de conexión con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  const iniciarSesionConGoogle = async () => {
    try {
      setCargando(true);
      setError(null);
      localStorage.removeItem("rol-activo");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (err) {
      setError("Error de conexión con Google.");
      setCargando(false);
    }
  };

  const iniciarSesionConApple = async () => {
    try {
      setCargando(true);
      setError(null);
      localStorage.removeItem("rol-activo");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (err) {
      setError("Error de conexión con Apple.");
      setCargando(false);
    }
  };

  useEffect(() => { 
    if (user && !loading) {
      if (role === 'admin') {
        navegar("/admin-inicio", { replace: true });
      } else {
        navegar("/seleccion-rol", { replace: true });
      }
    }
  }, [user, loading, role, navegar]);

  const MobileNavbar = () => (
    <div className="auth-mobile-navbar">
      <div className="navbar-content">
        <img src={logoCompleto} alt="InterMarket" className="navbar-logo" />
        <span className="navbar-tagline">CONECTA, INTERCAMBIA, CRECE</span>
      </div>
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <MobileNavbar />

        <header className="auth-hero">
          <div className="auth-hero-blob blob-a" aria-hidden="true"></div>
          <div className="auth-hero-blob blob-b" aria-hidden="true"></div>
          <div className="auth-hero-brand">
            <img src={logoCompleto} alt="InterMarket" className="auth-hero-logo" />
            <p className="auth-hero-tagline">Conecta, Intercambia, Crece</p>
          </div>
          <svg className="auth-hero-wave auth-hero-wave-vertical" viewBox="0 0 60 400" preserveAspectRatio="none" aria-hidden="true">
            <path d="M30,0 C60,120 0,280 22.5,400 L60,400 L60,0 Z" fill="#ffffff" />
          </svg>
        </header>

        <main className="auth-sheet">
          <div className="auth-sheet-inner">
            <div className="auth-card">
              <h1 className="auth-card-title">Iniciar Sesión</h1>
              <p className="auth-card-subtitle">
                Ingresa tus datos para continuar en InterMarket.
              </p>

              <FormularioLogin
                usuario={usuario}
                contraseña={contraseña}
                error={error}
                setUsuario={setUsuario}
                setContraseña={setContraseña}
                iniciarSesion={iniciarSesion}
                iniciarSesionConGoogle={iniciarSesionConGoogle}
                iniciarSesionConApple={iniciarSesionConApple}
                cargando={cargando}
              />

              <div className="auth-sheet-footer">
                <small>
                  ¿No tienes cuenta?{" "}
                  <span className="auth-sheet-link" onClick={() => navegar("/registro")}>
                    Regístrate gratis
                  </span>
                </small>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Login;
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../database/supabaseconfig";
import { Spinner } from "react-bootstrap";
import logo from "../assets/icono_intermAeview.png";


const VistaRol = () => {
  const navigate = useNavigate();
  const { user, role, changeRole, signOut } = useAuth();
  const [verificando, setVerificando] = useState(false);

  // Controla cuál de los dos botones muestra el borde de cristal + flecha.
  // "primario" es el estado por defecto (Entrar a comprar activo).
  const [btnActivo, setBtnActivo] = useState("primario");

  // Redirigir automáticamente solo al admin, compradores y vendedores eligen manualmente
  React.useEffect(() => {
    if (role === "admin") {
      navigate("/admin-inicio", { replace: true });
    }
  }, [role, navigate]);

  const handleRoleSelection = async (rol) => {
    if (rol === "vendedor") {
      setVerificando(true);
      try {
        // Verificar si ya tiene el rol de vendedor en la BD
        const { data, error } = await supabase
          .from("usuarios")
          .select("rol")
          .eq("id_usuario", user.id)
          .single();

        if (error) throw error;

        if (data.rol === "vendedor") {
          // Si ya es vendedor, simplemente cambiamos el rol activo y navegamos
          changeRole("vendedor");
          navigate("/vendedor");
        } else {
          // Si no es vendedor, enviarlo a suscribirse
          navigate("/suscripcion");
        }
      } catch (err) {
        console.error("Error al verificar rol:", err);
        // Por defecto, si hay error, enviamos a suscripción para estar seguros
        navigate("/suscripcion");
      } finally {
        setVerificando(false);
      }
    } else {
      changeRole(rol);
      navigate("/catalogo");
    }
  };

  const cerrarSesion = async () => {
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
      navigate("/login", { replace: true });
    }
  };

  return (
    <section className="glass-rol-page">
      {/* Fondo: manchas de color difuminadas (liquid glass) */}
      <div className="glass-rol-blob blob-superior" aria-hidden="true"></div>
      <div className="glass-rol-blob blob-inferior" aria-hidden="true"></div>

      {/* Botón cerrar / cerrar sesión */}
      <button
        type="button"
        className="glass-rol-close"
        onClick={cerrarSesion}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
      >
        <i className="bi bi-x-lg"></i>
      </button>

      <div className="glass-rol-wrapper">
        {/* Logo + wordmark + tagline: fuera del panel de vidrio,
            flotando directamente sobre el fondo */}
        <div className="glass-rol-hero">
          <img src={logo} alt="InterMarket" className="glass-rol-logo" />
          <h1 className="glass-rol-wordmark">
            <span className="wm-inter">Inter</span>
            <span className="wm-market">Market</span>
          </h1>
          <p className="glass-rol-tagline">Conecta, Intercambia, Crece</p>
        </div>

        {/* Panel de vidrio: solo contiene los botones, pegado abajo */}
        <div className="glass-rol-panel">
          <div className="glass-rol-card">
            <button
              type="button"
              className={`glass-rol-btn glass-rol-btn-primary ${
                btnActivo === "primario" ? "is-active" : "is-inactive"
              }`}
              onClick={() => !verificando && handleRoleSelection("comprador")}
              onMouseEnter={() => setBtnActivo("primario")}
              onFocus={() => setBtnActivo("primario")}
              disabled={verificando}
            >
              <span className="glass-rol-btn-sheen" aria-hidden="true"></span>
              <span className="glass-rol-btn-label">Entrar a comprar</span>
              <i className="bi bi-arrow-right glass-rol-btn-arrow"></i>
            </button>

            <button
              type="button"
              className={`glass-rol-btn glass-rol-btn-secondary ${
                btnActivo === "secundario" ? "is-active" : "is-inactive"
              }`}
              onClick={() => !verificando && handleRoleSelection("vendedor")}
              onMouseEnter={() => setBtnActivo("secundario")}
              onMouseLeave={() => setBtnActivo("primario")}
              onFocus={() => setBtnActivo("secundario")}
              onBlur={() => setBtnActivo("primario")}
              disabled={verificando}
            >
              <span className="glass-rol-btn-sheen" aria-hidden="true"></span>
              <span className="glass-rol-btn-label">
                {verificando ? <Spinner animation="border" size="sm" /> : "Soy vendedor"}
              </span>
              <i className="bi bi-arrow-right glass-rol-btn-arrow"></i>
            </button>

            <p className="glass-rol-stats">
              1,200+ productos &middot; 340+ vendedores activos
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VistaRol;
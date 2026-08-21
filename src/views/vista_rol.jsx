import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner } from "react-bootstrap";

import { useAuth } from "../context/AuthContext";
import { supabase } from "../database/supabaseconfig";
import logoCompleto from "../assets/LogoCom1.png";

const VistaRol = () => {
  const navigate = useNavigate();
  const { user, role, changeRole, signOut } = useAuth();

  const [verificando, setVerificando] = useState(false);

  // Controla cuál de los dos botones muestra el borde de cristal + flecha.
  // "primario" es el estado por defecto (Entrar a comprar activo).
  const [btnActivo, setBtnActivo] = useState("primario");

  // Redirigir automáticamente solo al admin.
  // Compradores y vendedores eligen manualmente.
  React.useEffect(() => {
    if (role === "admin") {
      navigate("/admin-inicio", { replace: true });
    }
  }, [role, navigate]);

  const handleRoleSelection = async (rol) => {
    if (rol === "vendedor") {
      setVerificando(true);

      try {
        // Verificar si ya tiene el rol de vendedor en la BD.
        const { data, error } = await supabase
          .from("usuarios")
          .select("rol")
          .eq("id_usuario", user.id)
          .single();

        if (error) throw error;

        if (data.rol === "vendedor") {
          // Si ya es vendedor, cambiamos el rol activo y navegamos.
          changeRole("vendedor");
          navigate("/vendedor");
        } else {
          // Si todavía no es vendedor, lo enviamos a suscripción.
          navigate("/suscripcion");
        }
      } catch (err) {
        console.error("Error al verificar rol:", err);

        // Si ocurre un error, enviamos a suscripción.
        navigate("/suscripcion");
      } finally {
        setVerificando(false);
      }

      return;
    }

    changeRole(rol);
    navigate("/catalogo");
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
      <div
        className="glass-rol-blob blob-superior"
        aria-hidden="true"
      />

      <div
        className="glass-rol-blob blob-inferior"
        aria-hidden="true"
      />

      {/* Botón cerrar / cerrar sesión */}
      <button
        type="button"
        className="glass-rol-close"
        onClick={cerrarSesion}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
      >
        <i className="bi bi-x-lg" />
      </button>

      <div className="glass-rol-wrapper">
        {/* Logo + eslogan fuera del panel de vidrio */}
        <div className="glass-rol-hero">
          <img
            src={logoCompleto}
            alt="InterMarket"
            className="glass-rol-logo-completo"
          />

          <p className="glass-rol-tagline-nueva">
            Conecta, Intercambia, Crece
          </p>
        </div>

        {/* Panel de vidrio */}
        <div className="glass-rol-panel">
          <div className="glass-rol-card">
            <button
              type="button"
              className={`glass-rol-btn glass-rol-btn-primary ${
                btnActivo === "primario" ? "is-active" : "is-inactive"
              }`}
              onClick={() =>
                !verificando && handleRoleSelection("comprador")
              }
              onMouseEnter={() => setBtnActivo("primario")}
              onFocus={() => setBtnActivo("primario")}
              disabled={verificando}
            >
              <span
                className="glass-rol-btn-sheen"
                aria-hidden="true"
              />

              <span className="glass-rol-btn-label">
                Entrar a comprar
              </span>

              <i className="bi bi-arrow-right glass-rol-btn-arrow" />
            </button>

            <button
              type="button"
              className={`glass-rol-btn glass-rol-btn-secondary ${
                btnActivo === "secundario" ? "is-active" : "is-inactive"
              }`}
              onClick={() =>
                !verificando && handleRoleSelection("vendedor")
              }
              onMouseEnter={() => setBtnActivo("secundario")}
              onMouseLeave={() => setBtnActivo("primario")}
              onFocus={() => setBtnActivo("secundario")}
              onBlur={() => setBtnActivo("primario")}
              disabled={verificando}
            >
              <span
                className="glass-rol-btn-sheen"
                aria-hidden="true"
              />

              <span className="glass-rol-btn-label">
                {verificando ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  "Soy vendedor"
                )}
              </span>

              <i className="bi bi-arrow-right glass-rol-btn-arrow" />
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
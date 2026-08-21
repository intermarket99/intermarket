import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner } from "react-bootstrap";

import { supabase } from "../database/supabaseconfig";
import { asegurarPerfil, asegurarUsuario } from "../services/perfilService";

import logoCompleto from "../assets/LogoCom1.png";

const Demo = () => {
  const navigate = useNavigate();

  const ejecutado = useRef(false);

  const [mensaje, setMensaje] = useState(
    "Preparando InterMarket para la demostración..."
  );

  const [error, setError] = useState(null);

  useEffect(() => {
    if (ejecutado.current) return;

    ejecutado.current = true;

    const iniciarDemo = async () => {
      try {
        setError(null);

        /*
         * =========================================================
         * CUENTA DEMO
         * =========================================================
         *
         * Crea primero esta cuenta en Supabase Authentication
         * y asegúrate de que en public.usuarios tenga:
         *
         * rol = comprador
         *
         * IMPORTANTE:
         * Esta debe ser una cuenta temporal y sin privilegios.
         */

        const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL;
        const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD;

        if (!DEMO_EMAIL || !DEMO_PASSWORD) {
          throw new Error(
            "Las credenciales de demostración no están configuradas."
          );
        }

        setMensaje("Iniciando acceso de demostración...");

        /*
         * Cerramos cualquier sesión que haya quedado abierta
         * en el dispositivo.
         */
        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          console.warn(
            "No había una sesión previa o no pudo cerrarse:",
            signOutError
          );
        }

        /*
         * Limpiamos cualquier rol anterior.
         */
        localStorage.removeItem("rol-activo");
        localStorage.removeItem("usuario-supabase");
        localStorage.removeItem("usuario");

        /*
         * Login automático con la cuenta demo.
         */
        const {
          data,
          error: authError,
        } = await supabase.auth.signInWithPassword({
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
        });

        if (authError) {
          throw authError;
        }

        if (!data?.user) {
          throw new Error(
            "No fue posible obtener el usuario de demostración."
          );
        }

        setMensaje("Preparando tu experiencia como comprador...");

        /*
         * Nos aseguramos de que existan los registros que
         * InterMarket necesita.
         */
        await asegurarUsuario(data.user);
        await asegurarPerfil(data.user.id);

        /*
         * Verificamos el rol directamente en la BD.
         */
        const {
          data: usuarioDB,
          error: usuarioError,
        } = await supabase
          .from("usuarios")
          .select("rol, restringido")
          .eq("id_usuario", data.user.id)
          .maybeSingle();

        if (usuarioError) {
          throw usuarioError;
        }

        if (!usuarioDB) {
          throw new Error(
            "La cuenta demo no tiene un registro válido en usuarios."
          );
        }

        if (usuarioDB.restringido) {
          await supabase.auth.signOut();

          throw new Error(
            "La cuenta de demostración se encuentra restringida."
          );
        }

        /*
         * Esta ruta es EXCLUSIVAMENTE para compradores.
         */
        if (usuarioDB.rol !== "comprador") {
          await supabase.auth.signOut();

          throw new Error(
            "La cuenta de demostración debe tener el rol comprador."
          );
        }

        /*
         * Indicamos a AuthContext que el rol activo
         * es comprador.
         */
        localStorage.setItem("rol-activo", "comprador");

        setMensaje("¡Todo listo!");

        /*
         * Pequeña espera únicamente visual.
         */
        await new Promise((resolve) =>
          setTimeout(resolve, 500)
        );

        /*
         * ENTRADA DIRECTA AL INICIO DEL COMPRADOR
         */
        navigate("/iniciocomprador", {
          replace: true,
        });
      } catch (err) {
        console.error(
          "Error iniciando modo demostración:",
          err
        );

        setError(
          err?.message ||
            "No fue posible iniciar la demostración."
        );

        setMensaje(null);
      }
    };

    iniciarDemo();
  }, [navigate]);

  const reintentar = () => {
    window.location.reload();
  };

  const irLogin = () => {
    navigate("/login", {
      replace: true,
    });
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background:
          "linear-gradient(145deg, #fffdf8 0%, #eefafa 50%, #fdf2c8 100%)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "430px",
          background: "rgba(255,255,255,0.88)",
          border: "1px solid rgba(255,255,255,0.75)",
          borderRadius: "30px",
          padding: "36px 28px",
          textAlign: "center",
          boxShadow:
            "0 25px 60px rgba(16,69,79,0.12)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        }}
      >
        <img
          src={logoCompleto}
          alt="InterMarket"
          style={{
            width: "100%",
            maxWidth: "240px",
            height: "auto",
            marginBottom: "20px",
          }}
        />

        {!error ? (
          <>
            <div
              style={{
                width: "62px",
                height: "62px",
                margin: "0 auto 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                background: "rgba(129,221,229,0.18)",
              }}
            >
              <Spinner
                animation="border"
                style={{
                  color: "#10454F",
                }}
              />
            </div>

            <h2
              style={{
                color: "#10454F",
                fontWeight: "800",
                marginBottom: "10px",
              }}
            >
              Acceso de demostración
            </h2>

            <p
              style={{
                color: "#64748b",
                margin: 0,
                lineHeight: "1.6",
              }}
            >
              {mensaje}
            </p>

            <small
              style={{
                display: "block",
                marginTop: "20px",
                color: "#94a3b8",
              }}
            >
              Entrarás automáticamente como comprador.
            </small>
          </>
        ) : (
          <>
            <div
              style={{
                width: "62px",
                height: "62px",
                margin: "0 auto 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                background: "#fff1f2",
                color: "#e11d48",
                fontSize: "1.7rem",
              }}
            >
              <i className="bi bi-exclamation-triangle"></i>
            </div>

            <h2
              style={{
                color: "#10454F",
                fontWeight: "800",
                marginBottom: "12px",
              }}
            >
              No pudimos iniciar la demostración
            </h2>

            <p
              style={{
                color: "#64748b",
                lineHeight: "1.6",
                marginBottom: "22px",
              }}
            >
              {error}
            </p>

            <button
              type="button"
              onClick={reintentar}
              style={{
                width: "100%",
                border: "none",
                borderRadius: "14px",
                padding: "13px",
                background: "#10454F",
                color: "#fff",
                fontWeight: "700",
                marginBottom: "10px",
              }}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Reintentar
            </button>

            <button
              type="button"
              onClick={irLogin}
              style={{
                width: "100%",
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "13px",
                background: "#fff",
                color: "#10454F",
                fontWeight: "700",
              }}
            >
              Ir al inicio de sesión
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Demo;
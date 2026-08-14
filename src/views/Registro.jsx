import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FormularioRegistro from "../components/login/FormularioRegistro";
import { supabase } from "../database/supabaseconfig";
import { useAuth } from "../context/AuthContext";
import { asegurarPerfil } from "../services/perfilService";
import logoCompleto from "../assets/LogoCom1.png";
import "../App.css";

function Registro() {
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [confirmarContraseña, setConfirmarContraseña] = useState("");
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [registroPorCorreoEnProceso, setRegistroPorCorreoEnProceso] = useState(false);
  const navegar = useNavigate();
  const { user } = useAuth();

  const generarUsername = (email, userId) => {
    const nombreBase = email?.split("@")[0] || "usuario";
    const nombreLimpio = nombreBase
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
    return `${nombreLimpio}_${userId.slice(0, 6)}`;
  };

  const crearUsuarioPublico = async (usuarioAuth, email) => {
    if (!usuarioAuth?.id) {
      throw new Error("No se recibió el identificador del usuario.");
    }

    const correoLimpio = email?.trim().toLowerCase() || usuarioAuth.email?.trim().toLowerCase() || null;

    const { data: usuarioExistente, error: consultarError } = await supabase
      .from("usuarios")
      .select("id_usuario, username, email, rol, restringido, infracciones")
      .eq("id_usuario", usuarioAuth.id)
      .maybeSingle();

    if (consultarError) {
      throw new Error(`No se pudo comprobar el usuario: ${consultarError.message}`);
    }

    if (usuarioExistente) {
      return usuarioExistente;
    }

    if (correoLimpio) {
      const { data: usuarioPorCorreo, error: correoError } = await supabase
        .from("usuarios")
        .select("id_usuario, email")
        .eq("email", correoLimpio)
        .maybeSingle();

      if (correoError) {
        throw new Error(`No se pudo comprobar el correo: ${correoError.message}`);
      }

      if (usuarioPorCorreo && usuarioPorCorreo.id_usuario !== usuarioAuth.id) {
        throw new Error("Este correo ya está relacionado con otro usuario.");
      }
    }

    const username = generarUsername(correoLimpio || "usuario", usuarioAuth.id);

    const { data: usuarioGuardado, error: guardarError } = await supabase
      .from("usuarios")
      .upsert(
        {
          id_usuario: usuarioAuth.id,
          username,
          email: correoLimpio,
          rol: "comprador",
          restringido: false,
          infracciones: 0
        },
        { onConflict: "id_usuario", ignoreDuplicates: true }
      )
      .select("id_usuario, username, email, rol, restringido, infracciones")
      .maybeSingle();

    if (guardarError && guardarError.code !== "23505") {
      throw new Error(`No se pudo crear el perfil del usuario: ${guardarError.message}`);
    }

    if (usuarioGuardado) {
      return usuarioGuardado;
    }

    const { data: usuarioRecuperado, error: recuperarError } = await supabase
      .from("usuarios")
      .select("id_usuario, username, email, rol, restringido, infracciones")
      .eq("id_usuario", usuarioAuth.id)
      .maybeSingle();

    if (recuperarError) {
      throw new Error(`No se pudo recuperar el usuario: ${recuperarError.message}`);
    }

    if (!usuarioRecuperado) {
      throw new Error("No se pudo crear ni recuperar el usuario público.");
    }

    return usuarioRecuperado;
  };

  const registrarUsuario = async () => {
    setRegistroPorCorreoEnProceso(true);

    try {
      setError(null);
      setExito(null);

      const correoLimpio = correo.trim().toLowerCase();

      if (!correoLimpio) {
        setError("Debes ingresar un correo electrónico.");
        return;
      }

      if (!contraseña) {
        setError("Debes ingresar una contraseña.");
        return;
      }

      if (contraseña.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres.");
        return;
      }

      if (contraseña !== confirmarContraseña) {
        setError("Las contraseñas no coinciden.");
        return;
      }

      setCargando(true);

      const { data, error: authError } = await supabase.auth.signUp({
        email: correoLimpio,
        password: contraseña,
        options: {
          data: { username: correoLimpio.split("@")[0] }
        }
      });

      if (authError) {
        const mensaje = authError.message || "";
        const mensajeNormalizado = mensaje.toLowerCase();

        if (mensajeNormalizado.includes("already registered") || mensajeNormalizado.includes("already been registered")) {
          setError("Este correo ya está registrado.");
        } else if (mensajeNormalizado.includes("password")) {
          setError("La contraseña debe tener al menos 6 caracteres.");
        } else {
          setError(`Error al registrar: ${mensaje}`);
        }
        return;
      }

      if (!data?.user) {
        throw new Error("Supabase no devolvió el usuario creado.");
      }

      await crearUsuarioPublico(data.user, correoLimpio);
      await asegurarPerfil(data.user.id);

      localStorage.setItem("rol-activo", "comprador");

      if (!data.session) {
        setExito("Cuenta creada. Revisa tu correo para confirmar la cuenta y luego inicia sesión.");
        setTimeout(() => {
          navegar("/login", { replace: true });
        }, 2500);
        return;
      }

      setExito("¡Cuenta creada correctamente!");
      setTimeout(() => {
        navegar("/seleccion-rol", { replace: true });
      }, 1200);
    } catch (err) {
      console.error("Error al registrar usuario:", err);
      setError(err.message || "Error de conexión con el servidor.");
    } finally {
      setCargando(false);
      setTimeout(() => {
        setRegistroPorCorreoEnProceso(false);
      }, 500);
    }
  };

  const registrarConGoogle = async () => {
    try {
      setCargando(true);
      setError(null);
      localStorage.removeItem("rol-activo");
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/registro` }
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      console.error("Error con Google:", err);
      setError("Error de conexión con Google.");
      setCargando(false);
    }
  };

  const registrarConApple = async () => {
    try {
      setCargando(true);
      setError(null);
      localStorage.removeItem("rol-activo");
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: { redirectTo: `${window.location.origin}/registro` }
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      console.error("Error con Apple:", err);
      setError("Error de conexión con Apple.");
      setCargando(false);
    }
  };

  useEffect(() => {
    const asegurarUsuarioOAuth = async () => {
      if (registroPorCorreoEnProceso || !user?.id || !user?.email) {
        return;
      }

      try {
        await crearUsuarioPublico(user, user.email);
        await asegurarPerfil(user.id);

        if (!localStorage.getItem("rol-activo")) {
          localStorage.setItem("rol-activo", "comprador");
        }

        navegar("/seleccion-rol", { replace: true });
      } catch (err) {
        console.error("Error completando usuario autenticado:", err);
        setError(err.message || "No se pudo completar el perfil.");
      }
    };

    asegurarUsuarioOAuth();
  }, [user?.id, user?.email, registroPorCorreoEnProceso, navegar]);

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
              <h1 className="auth-card-title">Crear Cuenta</h1>
              <p className="auth-card-subtitle">
                Únete a InterMarket y empieza a comprar o vender.
              </p>

              <FormularioRegistro
                correo={correo}
                contraseña={contraseña}
                confirmarContraseña={confirmarContraseña}
                error={error}
                exito={exito}
                setCorreo={setCorreo}
                setContraseña={setContraseña}
                setConfirmarContraseña={setConfirmarContraseña}
                registrarUsuario={registrarUsuario}
                registrarConGoogle={registrarConGoogle}
                registrarConApple={registrarConApple}
                cargando={cargando}
              />

              <div className="auth-sheet-footer">
                <small>
                  ¿Ya tienes una cuenta?{" "}
                  <span className="auth-sheet-link" onClick={() => navegar("/login")}>
                    Inicia sesión aquí
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

export default Registro;
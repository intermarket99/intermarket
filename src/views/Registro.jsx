import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Card,
  Row,
  Col
} from "react-bootstrap";

import FormularioRegistro from "../components/login/FormularioRegistro";
import { supabase } from "../database/supabaseconfig";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/icono_intermAeview.png";
import "../App.css";

function Registro() {
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [
    confirmarContraseña,
    setConfirmarContraseña
  ] = useState("");

  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [cargando, setCargando] = useState(false);

  const navegar = useNavigate();
  const { user } = useAuth();

  /**
   * Genera un username único a partir del correo y UUID.
   */
  const generarUsername = (email, userId) => {
    const nombreBase =
      email?.split("@")[0] || "usuario";

    const nombreLimpio = nombreBase
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");

    return `${nombreLimpio}_${userId.slice(0, 6)}`;
  };

  /**
   * Garantiza que el usuario autenticado también exista
   * en la tabla public.usuarios.
   */
  const crearUsuarioPublico = async (
    usuarioAuth,
    email
  ) => {
    if (!usuarioAuth?.id) {
      throw new Error(
        "No se recibió el identificador del usuario."
      );
    }

    // Revisar si ya existe por UUID.
    const {
      data: usuarioExistente,
      error: consultarError
    } = await supabase
      .from("usuarios")
      .select("id_usuario, username, email, rol")
      .eq("id_usuario", usuarioAuth.id)
      .maybeSingle();

    if (consultarError) {
      throw new Error(
        `No se pudo comprobar el usuario: ${consultarError.message}`
      );
    }

    if (usuarioExistente) {
      return usuarioExistente;
    }

    // Revisar si el correo está ligado a otro UUID.
    const {
      data: usuarioPorCorreo,
      error: correoError
    } = await supabase
      .from("usuarios")
      .select("id_usuario, email")
      .eq("email", email)
      .maybeSingle();

    if (correoError) {
      throw new Error(
        `No se pudo comprobar el correo: ${correoError.message}`
      );
    }

    if (
      usuarioPorCorreo &&
      usuarioPorCorreo.id_usuario !== usuarioAuth.id
    ) {
      throw new Error(
        "Este correo ya está relacionado con otro usuario."
      );
    }

    const username = generarUsername(
      email,
      usuarioAuth.id
    );

    const {
      data: usuarioCreado,
      error: crearError
    } = await supabase
      .from("usuarios")
      .insert({
        id_usuario: usuarioAuth.id,
        username,
        email,
        rol: "comprador",
        restringido: false,
        infracciones: 0
      })
      .select(
        "id_usuario, username, email, rol"
      )
      .single();

    if (crearError) {
      throw new Error(
        `No se pudo crear el perfil del usuario: ${crearError.message}`
      );
    }

    return usuarioCreado;
  };

  const registrarUsuario = async () => {
    try {
      setError(null);
      setExito(null);

      const correoLimpio = correo
        .trim()
        .toLowerCase();

      if (!correoLimpio) {
        setError(
          "Debes ingresar un correo electrónico."
        );
        return;
      }

      if (!contraseña) {
        setError(
          "Debes ingresar una contraseña."
        );
        return;
      }

      if (contraseña.length < 6) {
        setError(
          "La contraseña debe tener al menos 6 caracteres."
        );
        return;
      }

      if (
        contraseña !== confirmarContraseña
      ) {
        setError(
          "Las contraseñas no coinciden."
        );
        return;
      }

      setCargando(true);

      const {
        data,
        error: authError
      } = await supabase.auth.signUp({
        email: correoLimpio,
        password: contraseña,
        options: {
          data: {
            username:
              correoLimpio.split("@")[0]
          }
        }
      });

      if (authError) {
        const mensaje =
          authError.message || "";

        if (
          mensaje
            .toLowerCase()
            .includes("already registered")
        ) {
          setError(
            "Este correo ya está registrado."
          );
        } else if (
          mensaje
            .toLowerCase()
            .includes("password")
        ) {
          setError(
            "La contraseña debe tener al menos 6 caracteres."
          );
        } else {
          setError(
            `Error al registrar: ${mensaje}`
          );
        }

        return;
      }

      if (!data?.user) {
        throw new Error(
          "Supabase no devolvió el usuario creado."
        );
      }

      /*
       * Crear también la fila en public.usuarios.
       * Esto evita el error de llave foránea en suscripciones.
       */
      await crearUsuarioPublico(
        data.user,
        correoLimpio
      );

      localStorage.setItem(
        "rol-activo",
        "comprador"
      );

      setExito(
        "¡Cuenta creada correctamente!"
      );

      /*
       * Si Supabase requiere confirmación de correo,
       * data.session puede ser null.
       */
      if (!data.session) {
        setExito(
          "Cuenta creada. Revisa tu correo para confirmar la cuenta y luego inicia sesión."
        );

        setTimeout(() => {
          navegar("/login", {
            replace: true
          });
        }, 2500);

        return;
      }

      setTimeout(() => {
        navegar("/seleccion-rol", {
          replace: true
        });
      }, 1200);
    } catch (err) {
      console.error(
        "Error al registrar usuario:",
        err
      );

      setError(
        err.message ||
          "Error de conexión con el servidor."
      );
    } finally {
      setCargando(false);
    }
  };

  const registrarConGoogle = async () => {
    try {
      setCargando(true);
      setError(null);

      localStorage.removeItem(
        "rol-activo"
      );

      const { error: oauthError } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/seleccion-rol`
          }
        });

      if (oauthError) {
        throw oauthError;
      }
    } catch (err) {
      console.error(
        "Error con Google:",
        err
      );

      setError(
        "Error de conexión con Google."
      );

      setCargando(false);
    }
  };

  /**
   * También cubre usuarios que vuelven desde Google OAuth.
   */
  useEffect(() => {
    const asegurarUsuarioOAuth = async () => {
      if (!user?.id || !user?.email) {
        return;
      }

      try {
        await crearUsuarioPublico(
          user,
          user.email
        );

        const rolGuardado =
          localStorage.getItem(
            "rol-activo"
          );

        if (!rolGuardado) {
          localStorage.setItem(
            "rol-activo",
            "comprador"
          );
        }

        navegar("/seleccion-rol", {
          replace: true
        });
      } catch (err) {
        console.error(
          "Error creando usuario OAuth:",
          err
        );

        setError(
          err.message ||
            "No se pudo completar el perfil."
        );
      }
    };

    asegurarUsuarioOAuth();
  }, [user?.id, user?.email, navegar]);

  return (
    <div className="login-page-bg">
      <Container>
        <Row className="justify-content-center">
          <Col
            xs={11}
            sm={9}
            md={7}
            lg={5}
            xl={4}
          >
            <Card className="login-card-unique border-0">
              <Card.Body className="p-4 p-md-5">
                <div className="text-center mb-4">
                  <img
                    src={logo}
                    alt="InterMarket"
                    className="img-figma-style mb-4"
                  />

                  <h1 className="login-header-title">
                    Crear Cuenta
                  </h1>

                  <p className="login-header-subtitle">
                    Únete a InterMarket
                  </p>
                </div>

                <FormularioRegistro
                  correo={correo}
                  contraseña={contraseña}
                  confirmarContraseña={
                    confirmarContraseña
                  }
                  error={error}
                  exito={exito}
                  setCorreo={setCorreo}
                  setContraseña={
                    setContraseña
                  }
                  setConfirmarContraseña={
                    setConfirmarContraseña
                  }
                  registrarUsuario={
                    registrarUsuario
                  }
                  registrarConGoogle={
                    registrarConGoogle
                  }
                  cargando={cargando}
                />

                <div className="text-center mt-4">
                  <small className="text-muted">
                    ¿Ya tienes una cuenta?{" "}
                    <span
                      className="text-primary fw-bold"
                      style={{
                        cursor: "pointer"
                      }}
                      onClick={() =>
                        navegar("/login")
                      }
                    >
                      Inicia sesión aquí
                    </span>
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Registro;
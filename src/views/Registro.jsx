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
import { asegurarPerfil } from "../services/perfilService";
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

  /*
   * Evita que el useEffect de OAuth intente crear
   * al mismo usuario mientras el registro por correo
   * todavía se está procesando.
   */
  const [
    registroPorCorreoEnProceso,
    setRegistroPorCorreoEnProceso
  ] = useState(false);

  const navegar = useNavigate();
  const { user } = useAuth();

  const generarUsername = (email, userId) => {
    const nombreBase =
      email?.split("@")[0] || "usuario";

    const nombreLimpio = nombreBase
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");

    return `${nombreLimpio}_${userId.slice(0, 6)}`;
  };

  /*
   * Crea o recupera la fila correspondiente
   * en public.usuarios.
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

    const correoLimpio =
      email?.trim().toLowerCase() ||
      usuarioAuth.email?.trim().toLowerCase() ||
      null;

    /*
     * Primero intentamos recuperar por UUID.
     */
    const {
      data: usuarioExistente,
      error: consultarError
    } = await supabase
      .from("usuarios")
      .select(
        "id_usuario, username, email, rol, restringido, infracciones"
      )
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

    /*
     * Comprobar que el correo no pertenezca
     * a otro UUID.
     */
    if (correoLimpio) {
      const {
        data: usuarioPorCorreo,
        error: correoError
      } = await supabase
        .from("usuarios")
        .select("id_usuario, email")
        .eq("email", correoLimpio)
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
    }

    const username = generarUsername(
      correoLimpio || "usuario",
      usuarioAuth.id
    );

    /*
     * upsert evita el error de clave duplicada
     * si otra ejecución creó la fila primero.
     */
    const {
      data: usuarioGuardado,
      error: guardarError
    } = await supabase
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
        {
          onConflict: "id_usuario",
          ignoreDuplicates: true
        }
      )
      .select(
        "id_usuario, username, email, rol, restringido, infracciones"
      )
      .maybeSingle();

    if (guardarError) {
      /*
       * Si hubo una carrera y Supabase devuelve 23505,
       * recuperamos la fila existente.
       */
      if (guardarError.code !== "23505") {
        throw new Error(
          `No se pudo crear el perfil del usuario: ${guardarError.message}`
        );
      }
    }

    if (usuarioGuardado) {
      return usuarioGuardado;
    }

    /*
     * Cuando ignoreDuplicates evita el insert,
     * recuperamos el usuario ya creado.
     */
    const {
      data: usuarioRecuperado,
      error: recuperarError
    } = await supabase
      .from("usuarios")
      .select(
        "id_usuario, username, email, rol, restringido, infracciones"
      )
      .eq("id_usuario", usuarioAuth.id)
      .maybeSingle();

    if (recuperarError) {
      throw new Error(
        `No se pudo recuperar el usuario: ${recuperarError.message}`
      );
    }

    if (!usuarioRecuperado) {
      throw new Error(
        "No se pudo crear ni recuperar el usuario público."
      );
    }

    return usuarioRecuperado;
  };

  const registrarUsuario = async () => {
    setRegistroPorCorreoEnProceso(true);

    try {
      setError(null);
      setExito(null);

      const correoLimpio =
        correo.trim().toLowerCase();

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

        const mensajeNormalizado =
          mensaje.toLowerCase();

        if (
          mensajeNormalizado.includes(
            "already registered"
          ) ||
          mensajeNormalizado.includes(
            "already been registered"
          )
        ) {
          setError(
            "Este correo ya está registrado."
          );
        } else if (
          mensajeNormalizado.includes(
            "password"
          )
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

      await crearUsuarioPublico(
        data.user,
        correoLimpio
      );

      // Usa el servicio centralizado: si el listener de OAuth
      // llegara a dispararse casi al mismo tiempo, ambas llamadas
      // se resuelven con el MISMO perfil, nunca crean dos.
      await asegurarPerfil(data.user.id);

      localStorage.setItem(
        "rol-activo",
        "comprador"
      );

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

      setExito(
        "¡Cuenta creada correctamente!"
      );

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

      /*
       * Se deja una pequeña espera para evitar
       * que el useEffect se active en el mismo instante.
       */
      setTimeout(() => {
        setRegistroPorCorreoEnProceso(false);
      }, 500);
    }
  };

  const registrarConGoogle = async () => {
    try {
      setCargando(true);
      setError(null);

      localStorage.removeItem(
        "rol-activo"
      );

      const {
        error: oauthError
      } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo:
              `${window.location.origin}/registro`
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

  /*
   * Solo completa el usuario cuando regresa
   * desde Google o cuando ya existe una sesión
   * y no hay un registro por correo en proceso.
   */
  useEffect(() => {
    const asegurarUsuarioOAuth = async () => {
      if (
        registroPorCorreoEnProceso ||
        !user?.id ||
        !user?.email
      ) {
        return;
      }

      try {
        await crearUsuarioPublico(
          user,
          user.email
        );

        await asegurarPerfil(user.id);

        if (
          !localStorage.getItem(
            "rol-activo"
          )
        ) {
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
          "Error completando usuario autenticado:",
          err
        );

        setError(
          err.message ||
            "No se pudo completar el perfil."
        );
      }
    };

    asegurarUsuarioOAuth();
  }, [
    user?.id,
    user?.email,
    registroPorCorreoEnProceso,
    navegar
  ]);

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
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Row, Col } from 'react-bootstrap';
import FormularioRegistro from '../components/login/FormularioRegistro';
import { supabase } from "../database/supabaseconfig";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/icono_intermAeview.png";
import "../App.css";

function Registro() {
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [confirmarContraseña, setConfirmarContraseña] = useState("");
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [cargando, setCargando] = useState(false);
  const navegar = useNavigate();
  const { user } = useAuth();

  const registrarUsuario = async () => {
    try {
      setError(null);
      setExito(null);
      
      if (contraseña !== confirmarContraseña) {
        setError("Las contraseñas no coinciden.");
        return;
      }
      
      setCargando(true);
      
      const { data, error: authError } = await supabase.auth.signUp({
        email: correo,
        password: contraseña,
      });

      if (authError) {
        const msg = authError.message || "";
        if (msg.includes("already registered")) {
          setError("Este correo ya está registrado.");
        } else if (msg.includes("Password should be")) {
          setError("La contraseña debe tener al menos 6 caracteres.");
        } else {
          setError("Error al registrar: " + msg);
        }
        return;
      }
      
      if (data.user) {
        setExito("¡Cuenta creada exitosamente! Iniciando sesión...");
        setTimeout(() => {
          localStorage.removeItem("rol-activo");
          navegar("/seleccion-rol");
        }, 1500);
      }
    } catch (err) {
      setError("Error de conexión con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  const registrarConGoogle = async () => {
    try {
      setCargando(true);
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      setError("Error de conexión con Google.");
      setCargando(false);
    }
  };

  useEffect(() => { 
    if (user) navegar("/seleccion-rol");
  }, [user, navegar]);

  return (
    <div className="login-page-bg">
      <Container>
        <Row className="justify-content-center">
          <Col xs={11} sm={9} md={7} lg={5} xl={4}>
            <Card className="login-card-unique border-0">
              <Card.Body className="p-4 p-md-5">
                <div className="text-center mb-4">
                  <img src={logo} alt="InterMarket" className="img-figma-style mb-4" />
                  <h1 className="login-header-title">Crear Cuenta</h1>
                  <p className="login-header-subtitle">Únete a InterMarket</p>
                </div>
                
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
                  cargando={cargando}
                />
                
                <div className="text-center mt-4">
                  <small className="text-muted">
                    ¿Ya tienes una cuenta? <span className="text-primary fw-bold" style={{cursor: 'pointer'}} onClick={() => navegar("/login")}>Inicia sesión aquí</span>
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

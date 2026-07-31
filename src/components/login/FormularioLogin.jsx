import React, { useState } from 'react';
import { Form, Button, Alert, InputGroup } from 'react-bootstrap';

const FormularioLogin = ({ usuario, contraseña, error, setUsuario, setContraseña, iniciarSesion, iniciarSesionConGoogle, cargando }) => {
  const [mostrarContraseña, setMostrarContraseña] = useState(false);

  return (
    <Form onSubmit={(e) => { e.preventDefault(); iniciarSesion(); }} className="mt-2">
      {error && <Alert variant="danger" className="border-0 rounded-4 text-center small py-2 mb-3 shadow-sm">{error}</Alert>}
      
      <Form.Group className="mb-3">
        <InputGroup className="unique-input-group">
          <InputGroup.Text>
            <i className="bi bi-person-circle"></i>
          </InputGroup.Text>
          <Form.Control
            type="text"
            placeholder="Correo electrónico"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            required
          />
        </InputGroup>
      </Form.Group>

      <Form.Group className="mb-4">
        <InputGroup className="unique-input-group">
          <InputGroup.Text>
            <i className="bi bi-shield-lock-fill"></i>
          </InputGroup.Text>
          <Form.Control
            type={mostrarContraseña ? 'text' : 'password'}
            placeholder="Contraseña"
            value={contraseña}
            onChange={(e) => setContraseña(e.target.value)}
            required
          />
          <InputGroup.Text 
            onClick={() => setMostrarContraseña(!mostrarContraseña)} 
            className="cursor-pointer"
          >
            <i className={`bi ${mostrarContraseña ? 'bi-eye-slash' : 'bi-eye'}`}></i>
          </InputGroup.Text>
        </InputGroup>
      </Form.Group>

      <Button type="submit" className="unique-login-btn w-100 shadow mb-3" disabled={cargando}>
        {cargando ? (
          <><span className="spinner-border spinner-border-sm me-2"></span> Entrando...</>
        ) : 'Iniciar Sesión'}
      </Button>

      <div className="d-flex align-items-center mb-3">
        <hr className="flex-grow-1 text-muted" />
        <span className="px-3 text-muted small">o</span>
        <hr className="flex-grow-1 text-muted" />
      </div>

      <Button 
        type="button" 
        variant="outline-dark" 
        className="w-100 shadow-sm d-flex justify-content-center align-items-center mb-2" 
        onClick={iniciarSesionConGoogle}
        disabled={cargando}
      >
        <i className="bi bi-google me-2 text-danger"></i> Continuar con Google
      </Button>
    </Form>
  );
};

export default FormularioLogin;
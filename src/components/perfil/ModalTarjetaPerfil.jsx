import React from "react";
import { Modal, Form, Alert, Button, Spinner } from "react-bootstrap";

const ModalTarjetaPerfil = ({ show, onHide, nuevaTarjeta, setNuevaTarjeta, agregarNuevaTarjeta, guardandoTarjeta }) => {
  return (
    <Modal show={show} onHide={onHide} centered className="modern-modal">
      <Modal.Header closeButton className="border-0 bg-dark text-white p-4">
        <Modal.Title className="fw-bold">
          <i className="bi bi-credit-card-2-front me-2"></i>
          Añadir Nueva Tarjeta
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        <Form.Group className="mb-3">
          <Form.Label className="fw-bold text-muted small text-uppercase ls-1">Tipo de Tarjeta</Form.Label>
          <Form.Select 
            className="rounded-3 py-2"
            value={nuevaTarjeta.tipo}
            onChange={(e) => setNuevaTarjeta({...nuevaTarjeta, tipo: e.target.value})}
          >
            <option value="Visa">Visa</option>
            <option value="Mastercard">Mastercard</option>
            <option value="American Express">American Express</option>
            <option value="Débito">Tarjeta de Débito</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label className="fw-bold text-muted small text-uppercase ls-1">Últimos 4 Dígitos</Form.Label>
          <Form.Control
            className="rounded-3 py-2"
            type="text"
            maxLength="4"
            placeholder="Ej: 4242"
            value={nuevaTarjeta.ultimo4}
            onChange={(e) => setNuevaTarjeta({...nuevaTarjeta, ultimo4: e.target.value.replace(/\D/g, '')})}
          />
          <Form.Text className="text-muted">
            Por seguridad, solo guardamos los últimos 4 números.
          </Form.Text>
        </Form.Group>

        <Alert variant="info" className="small d-flex align-items-center border-0 bg-light rounded-4">
          <i className="bi bi-info-circle-fill me-2 fs-5 text-primary"></i>
          Esta tarjeta se añadirá como un método de pago simulado para tus compras.
        </Alert>
      </Modal.Body>
      <Modal.Footer className="border-0 p-4">
        <Button variant="light" className="rounded-pill px-4" onClick={onHide}>Cancelar</Button>
        <Button variant="dark" className="rounded-pill px-4 fw-bold" onClick={agregarNuevaTarjeta} disabled={guardandoTarjeta}>
          {guardandoTarjeta ? <Spinner animation="border" size="sm" /> : 'Añadir Tarjeta'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalTarjetaPerfil;

import React from "react";
import { Modal, Form, Row, Col, Button, Spinner } from "react-bootstrap";

const ModalDireccionPerfil = ({ show, onHide, nuevaDireccion, setNuevaDireccion, agregarDireccion, guardandoDireccion }) => {
  return (
    <Modal show={show} onHide={onHide} centered className="modern-modal">
      <Modal.Header closeButton className="border-0 bg-primary text-white p-4">
        <Modal.Title className="fw-bold">
          <i className="bi bi-geo-alt me-2"></i>
          Nueva Dirección
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        <Row className="g-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label className="small fw-bold text-muted text-uppercase ls-1">Nombre</Form.Label>
              <Form.Control 
                className="rounded-3"
                value={nuevaDireccion.nombre}
                onChange={(e) => setNuevaDireccion({...nuevaDireccion, nombre: e.target.value})}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label className="small fw-bold text-muted text-uppercase ls-1">Apellido</Form.Label>
              <Form.Control 
                className="rounded-3"
                value={nuevaDireccion.apellido}
                onChange={(e) => setNuevaDireccion({...nuevaDireccion, apellido: e.target.value})}
              />
            </Form.Group>
          </Col>
          <Col xs={12}>
            <Form.Group>
              <Form.Label className="small fw-bold text-muted text-uppercase ls-1">Calle y Número</Form.Label>
              <Form.Control 
                className="rounded-3"
                placeholder="Ej: Av. Reforma 123"
                value={nuevaDireccion.nombre_calle}
                onChange={(e) => setNuevaDireccion({...nuevaDireccion, nombre_calle: e.target.value})}
              />
            </Form.Group>
          </Col>
          <Col xs={12}>
            <Form.Group>
              <Form.Label className="small fw-bold text-muted text-uppercase ls-1">Referencias / Descripción</Form.Label>
              <Form.Control 
                className="rounded-3"
                as="textarea" rows={2} 
                placeholder="Ej: Portón verde, frente al parque..."
                value={nuevaDireccion.descripcion}
                onChange={(e) => setNuevaDireccion({...nuevaDireccion, descripcion: e.target.value})}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label className="small fw-bold text-muted text-uppercase ls-1">Código Postal</Form.Label>
              <Form.Control 
                className="rounded-3"
                value={nuevaDireccion.codigo_postal}
                onChange={(e) => setNuevaDireccion({...nuevaDireccion, codigo_postal: e.target.value})}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label className="small fw-bold text-muted text-uppercase ls-1">Teléfono</Form.Label>
              <Form.Control 
                className="rounded-3"
                type="tel"
                value={nuevaDireccion.numero_telefono}
                onChange={(e) => setNuevaDireccion({...nuevaDireccion, numero_telefono: e.target.value})}
              />
            </Form.Group>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer className="border-0 p-4">
        <Button variant="light" className="rounded-pill px-4" onClick={onHide}>Cancelar</Button>
        <Button variant="primary" className="rounded-pill px-4 fw-bold shadow-sm" onClick={agregarDireccion} disabled={guardandoDireccion}>
          {guardandoDireccion ? <Spinner animation="border" size="sm" /> : 'Guardar Dirección'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalDireccionPerfil;

import React from "react";
import { Modal, Badge, Row, Col, Alert, Button, Spinner } from "react-bootstrap";

const ModalSuscripcionVendedor = ({ show, onHide, suscripcion, cancelando, onTerminar }) => {
  return (
    <Modal show={show} onHide={() => !cancelando && onHide()} centered>
      <Modal.Header closeButton={!cancelando} className="border-0 pb-0">
        <Modal.Title className="fw-bold">
          <i className="bi bi-gem text-primary me-2"></i>
          Mi Suscripción
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-3">
        {suscripcion ? (
          <div className="text-center p-3">
            <div className="mb-4">
              <h3 className="fw-bold text-primary mb-1">{suscripcion.plan}</h3>
              <Badge bg="success" className="rounded-pill px-3 py-2 text-uppercase">
                {suscripcion.estado}
              </Badge>
            </div>
            
            <Row className="g-3 mb-4 text-start">
              <Col xs={12}>
                <div className="p-3 bg-light rounded-3 d-flex align-items-center">
                  <div className="bg-white p-2 rounded-circle me-3 shadow-sm">
                    <i className="bi bi-calendar-check text-primary"></i>
                  </div>
                  <div>
                    <small className="text-muted d-block">Fecha de inicio</small>
                    <span className="fw-bold">{new Date(suscripcion.fecha_inicio).toLocaleDateString()}</span>
                  </div>
                </div>
              </Col>
              <Col xs={12}>
                <div className="p-3 bg-light rounded-3 d-flex align-items-center">
                  <div className="bg-white p-2 rounded-circle me-3 shadow-sm">
                    <i className="bi bi-calendar-x text-danger"></i>
                  </div>
                  <div>
                    <small className="text-muted d-block">Próximo vencimiento</small>
                    <span className="fw-bold">
                      {suscripcion.fecha_fin ? new Date(suscripcion.fecha_fin).toLocaleDateString() : 'Indefinido'}
                    </span>
                  </div>
                </div>
              </Col>
              <Col xs={12}>
                <div className="p-3 bg-light rounded-3 d-flex align-items-center">
                  <div className="bg-white p-2 rounded-circle me-3 shadow-sm">
                    <i className="bi bi-cash-coin text-success"></i>
                  </div>
                  <div>
                    <small className="text-muted d-block">Monto del plan</small>
                    <span className="fw-bold">${Number(suscripcion.monto).toFixed(2)}</span>
                  </div>
                </div>
              </Col>
            </Row>

            <Alert variant="warning" className="small text-start border-0 shadow-sm mb-4">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              Al terminar la suscripción, perderás el acceso a las funciones de vendedor y tus productos dejarán de ser visibles.
            </Alert>

            <Button 
              variant="danger" 
              className="w-100 rounded-pill py-2 fw-bold"
              onClick={() => {
                if(window.confirm("¿Estás seguro de que deseas cancelar tu suscripción? Se te redirigirá a la selección de rol.")) {
                  onTerminar();
                }
              }}
              disabled={cancelando}
            >
              {cancelando ? (
                <><Spinner animation="border" size="sm" className="me-2" /> Cancelando...</>
              ) : (
                "Terminar Suscripción"
              )}
            </Button>
          </div>
        ) : (
          <div className="text-center p-5">
            <Spinner animation="border" variant="primary" />
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default ModalSuscripcionVendedor;

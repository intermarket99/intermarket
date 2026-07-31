import React from "react";
import { Card, Row, Col, Badge, Button } from "react-bootstrap";

const DireccionesPerfil = ({ direcciones, eliminarDireccion, setShowAddressModal }) => {
  if (direcciones.length === 0) {
    return (
      <div className="text-center py-5 bg-light rounded-4 border-dashed">
        <i className="bi bi-geo text-muted mb-3 d-block" style={{ fontSize: '4rem' }}></i>
        <h5 className="text-muted fw-bold">No tienes direcciones guardadas</h5>
      </div>
    );
  }

  return (
    <Row className="g-3">
      {direcciones.map(dir => (
        <Col key={dir.id_direccion} md={6}>
          <Card className="h-100 border shadow-sm rounded-4 hover-shadow transition-all bg-light border-0">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="bg-white p-2 rounded-circle shadow-sm">
                  <i className="bi bi-house-door-fill text-primary"></i>
                </div>
                <Button variant="link" className="text-danger p-0" onClick={() => eliminarDireccion(dir.id_direccion)}>
                  <i className="bi bi-trash fs-5"></i>
                </Button>
              </div>
              <h6 className="fw-bold mb-1 fs-5">{dir.nombre} {dir.apellido}</h6>
              <p className="text-secondary mb-3 small lh-sm">{dir.nombre_calle}</p>
              {dir.descripcion && <div className="small mb-3 font-italic text-muted px-3 border-start border-3">"{dir.descripcion}"</div>}
              <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top border-secondary border-opacity-10">
                <Badge bg="white" text="dark" className="border shadow-sm px-3 py-2 rounded-pill fw-bold">CP: {dir.codigo_postal || 'N/A'}</Badge>
                <span className="small fw-bold text-primary"><i className="bi bi-telephone-fill me-2"></i>{dir.numero_telefono}</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default DireccionesPerfil;

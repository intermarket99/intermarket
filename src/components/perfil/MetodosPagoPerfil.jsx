import React from "react";
import { Card, Row, Col, Badge, Button, Spinner } from "react-bootstrap";

const MetodosPagoPerfil = ({ metodosPago, eliminarTarjeta, eliminandoTarjetaId, setShowAddModal }) => {
  if (metodosPago.length === 0) {
    return (
      <div className="text-center py-5 bg-light rounded-4 border-dashed">
        <i className="bi bi-credit-card text-muted mb-3 d-block" style={{ fontSize: '4rem' }}></i>
        <h5 className="text-muted fw-bold">No hay métodos de pago guardados</h5>
      </div>
    );
  }

  return (
    <Row className="g-4">
      {metodosPago.map((metodo) => (
        <Col key={metodo.id_metodo_pago} md={6}>
          <div className="modern-card-container position-relative overflow-hidden rounded-4 shadow-sm p-4 text-white" style={{ background: metodo.tipo_metodo === 'Visa' ? 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)' : 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)' }}>
            <div className="d-flex justify-content-between align-items-start mb-4">
              <i className={`bi bi-${metodo.tipo_metodo === 'Visa' ? 'credit-card-2-front' : 'credit-card'} fs-2`}></i>
              <Button variant="link" className="text-white p-0 opacity-75 hover-opacity-100" onClick={() => eliminarTarjeta(metodo.id_metodo_pago)} disabled={eliminandoTarjetaId === metodo.id_metodo_pago}>
                {eliminandoTarjetaId === metodo.id_metodo_pago ? <Spinner animation="border" size="sm" /> : <i className="bi bi-trash fs-5"></i>}
              </Button>
            </div>
            <div className="fs-4 mb-4 ls-2 fw-bold">**** **** **** {metodo.ultimo4}</div>
            <div className="d-flex justify-content-between align-items-end">
              <div>
                <small className="text-white-50 d-block text-uppercase ls-1" style={{ fontSize: '0.65rem' }}>Tipo de Tarjeta</small>
                <span className="fw-bold">{metodo.tipo_metodo || 'Tarjeta'}</span>
              </div>
              <div className="text-end">
                <small className="text-white-50 d-block text-uppercase ls-1" style={{ fontSize: '0.65rem' }}>Guardada</small>
                <span className="fw-bold small">{new Date(metodo.creado_en).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="card-shine"></div>
          </div>
        </Col>
      ))}
    </Row>
  );
};

export default MetodosPagoPerfil;

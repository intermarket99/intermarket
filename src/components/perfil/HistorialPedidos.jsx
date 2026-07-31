import React from "react";
import { Card, Row, Col, Badge, Button } from "react-bootstrap";

const HistorialPedidos = ({ pedidos, getBadgeColor, getEstadoTexto, setPedidoDetalle, setShowShipmentModal, navegar }) => {
  if (pedidos.length === 0) {
    return (
      <div className="text-center py-5 bg-light rounded-4 border-dashed">
        <i className="bi bi-cart-x text-muted mb-3 d-block" style={{ fontSize: '4rem' }}></i>
        <h5 className="text-muted fw-bold">No has realizado pedidos todavía</h5>
        <Button variant="primary" className="rounded-pill mt-3 px-4 fw-bold shadow-sm" onClick={() => navegar("/catalogo")}>Ir al Catálogo</Button>
      </div>
    );
  }

  return (
    <div className="pedidos-list">
      {pedidos.map(pedido => (
        <Card key={pedido.id_pedido} className="border-0 shadow-sm rounded-4 mb-3 hover-shadow-lg transition-all overflow-hidden border-start border-4" style={{ borderLeftColor: `var(--bs-${getBadgeColor(pedido.id_estado)})` }}>
          <Card.Body className="p-3">
            <Row className="align-items-center">
              <Col xs={12} md={5} className="mb-3 mb-md-0">
                <div className="d-flex align-items-center">
                  <div className="bg-light p-1 rounded-3 me-3">
                    {pedido.productos?.imagen_url?.[0] ? (
                      <img src={pedido.productos.imagen_url[0]} alt="" style={{ width: 60, height: 60, objectFit: 'cover' }} className="rounded-2 shadow-sm" />
                    ) : (
                      <div className="d-flex align-items-center justify-content-center bg-white rounded-2" style={{ width: 60, height: 60 }}>
                        <i className="bi bi-image text-muted fs-4"></i>
                      </div>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <h6 className="fw-bold mb-0 text-truncate">{pedido.productos?.nombre_producto}</h6>
                    <small className="text-muted">ID: #{pedido.id_pedido.split('-')[0]}</small>
                  </div>
                </div>
              </Col>
              <Col xs={6} md={2} className="text-center">
                <small className="text-muted d-block">Fecha</small>
                <span className="fw-bold">{new Date(pedido.creado_en).toLocaleDateString()}</span>
              </Col>
              <Col xs={6} md={2} className="text-center">
                <small className="text-muted d-block">Total</small>
                <span className="text-success fw-bold">C${Number(pedido.precio_unitario).toFixed(2)}</span>
              </Col>
              <Col xs={12} md={3} className="text-end mt-3 mt-md-0">
                <Badge bg={getBadgeColor(pedido.id_estado)} className="rounded-pill px-3 py-2 text-uppercase ls-1 mb-2 d-inline-block w-100 mb-2 shadow-sm">
                  {getEstadoTexto(pedido.id_estado)}
                </Badge>
                <Button variant="outline-primary" size="sm" className="rounded-pill w-100 fw-bold border-2" onClick={() => { setPedidoDetalle(pedido); setShowShipmentModal(true); }}>
                  <i className="bi bi-truck me-2"></i>Seguir Pedido
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
};

export default HistorialPedidos;

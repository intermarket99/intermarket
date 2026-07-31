import React from "react";
import { Modal, Row, Col, Badge, Button, Alert } from "react-bootstrap";

const ModalEnvioPerfil = ({ show, onHide, pedido, getBadgeColor, getEstadoTexto }) => {
  if (!pedido) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered className="modern-modal">
      <Modal.Header closeButton className="border-0 bg-primary text-white p-4">
        <Modal.Title className="fw-bold">
          <i className="bi bi-truck me-2"></i>
          Detalle del Envío #{pedido.id_pedido.slice(0, 8)}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-4">
        <Row className="g-4">
          <Col md={6}>
            <div className="mb-4">
              <h6 className="text-muted fw-bold text-uppercase small mb-3">Producto</h6>
              <div className="d-flex align-items-center p-3 bg-light rounded-4">
                {pedido.productos?.imagen_url?.[0] && (
                  <img
                    src={pedido.productos.imagen_url[0]}
                    alt=""
                    style={{ width: '70px', height: '70px', objectFit: 'cover' }}
                    className="rounded-3 shadow-sm me-3"
                  />
                )}
                <div>
                  <div className="fw-bold">{pedido.productos?.nombre_producto}</div>
                  <div className="text-success fw-bold">C${Number(pedido.precio_unitario).toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div>
              <h6 className="text-muted fw-bold text-uppercase small mb-3">Estado del Envío</h6>
              <div className={`p-3 rounded-4 bg-${getBadgeColor(pedido.id_estado)} bg-opacity-10 text-${getBadgeColor(pedido.id_estado)} border border-${getBadgeColor(pedido.id_estado)} border-opacity-25`}>
                <div className="d-flex align-items-center">
                  <i className={`bi bi-${pedido.id_estado === 4 ? 'check-circle' : 'clock'} fs-4 me-3`}></i>
                  <div>
                    <div className="fw-bold">{getEstadoTexto(pedido.id_estado)}</div>
                    <small className="opacity-75">Actualizado el {new Date().toLocaleDateString()}</small>
                  </div>
                </div>
              </div>
            </div>
          </Col>

          <Col md={6}>
            <h6 className="text-muted fw-bold text-uppercase small mb-3">Dirección de Entrega</h6>
            {pedido.ventas?.direcciones ? (
              <div className="p-4 border rounded-4 shadow-sm bg-white h-100">
                <div className="d-flex align-items-center mb-3">
                  <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3">
                    <i className="bi bi-geo-alt text-primary"></i>
                  </div>
                  <div>
                    <div className="fw-bold">{pedido.ventas.direcciones.nombre} {pedido.ventas.direcciones.apellido}</div>
                    <div className="text-muted small">{pedido.ventas.direcciones.numero_telefono}</div>
                  </div>
                </div>

                <div className="ps-5">
                  <p className="mb-2 text-dark">{pedido.ventas.direcciones.nombre_calle}</p>
                  {pedido.ventas.direcciones.codigo_postal && (
                    <p className="mb-2"><Badge bg="light" text="dark" className="border">CP: {pedido.ventas.direcciones.codigo_postal}</Badge></p>
                  )}
                  {pedido.ventas.direcciones.descripcion && (
                    <div className="mt-3 pt-3 border-top">
                      <small className="text-muted d-block mb-1 italic">Referencias:</small>
                      <div className="small text-secondary px-2 border-start border-3">
                        {pedido.ventas.direcciones.descripcion}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Alert variant="warning">
                No se encontró información de dirección para este pedido.
              </Alert>
            )}
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer className="border-0 p-4">
        <Button variant="secondary" className="rounded-pill px-4" onClick={onHide}>Cerrar</Button>
        <Button variant="primary" className="rounded-pill px-4" onClick={() => window.print()}>
          <i className="bi bi-printer me-2"></i>Imprimir Recibo
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalEnvioPerfil;

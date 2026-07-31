import React from "react";
import { Row, Col, Card } from "react-bootstrap";

const StatsVendedor = ({ pedidos }) => {
  const totalPedidos = pedidos.length;
  const pedidosPendientes = pedidos.filter(p => p.id_estado === 1).length;
  const ingresosPotenciales = pedidos
    .filter(p => p.id_estado !== 3)
    .reduce((acc, p) => acc + Number(p.precio_unitario), 0)
    .toFixed(2);

  return (
    <Row className="mb-4">
      <Col md={4}>
        <Card className="text-center shadow-sm border-0">
          <Card.Body>
            <h5 className="text-muted">Total Pedidos</h5>
            <h2 className="fw-bold">{totalPedidos}</h2>
          </Card.Body>
        </Card>
      </Col>
      <Col md={4}>
        <Card className="text-center shadow-sm border-0">
          <Card.Body>
            <h5 className="text-muted">Pedidos Pendientes</h5>
            <h2 className="fw-bold text-warning">{pedidosPendientes}</h2>
          </Card.Body>
        </Card>
      </Col>
      <Col md={4}>
        <Card className="text-center shadow-sm border-0 bg-primary text-white">
          <Card.Body>
            <h5 className="text-white-50">Ingresos Potenciales</h5>
            <h2 className="fw-bold">${ingresosPotenciales}</h2>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default StatsVendedor;

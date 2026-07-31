import React from "react";
import { Col, Card, Button, Badge, Spinner } from "react-bootstrap";

const TarjetaPlan = ({ plan, loading, onSelect }) => {
  return (
    <Col lg={4} md={6}>
      <Card 
        className={`h-100 border-0 shadow-lg text-center p-3 position-relative ${plan.popular ? 'border-primary border-top' : ''}`} 
        style={plan.popular ? { borderTopWidth: '5px' } : {}}
      >
        {plan.popular && (
          <Badge bg="primary" className="position-absolute top-0 start-50 translate-middle rounded-pill px-3 py-2">
            MÁS POPULAR
          </Badge>
        )}
        <Card.Body className="d-flex flex-column">
          <div className="mb-4 mt-2">
            <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "60px", height: "60px", backgroundColor: plan.color + "20", color: plan.color }}>
              <i className="bi bi-gem fs-2"></i>
            </div>
            <h3 className="fw-bold">{plan.nombre}</h3>
            <div className="d-flex align-items-center justify-content-center mt-3">
              <span className="fs-2 fw-bold text-primary">$</span>
              <span className="display-4 fw-bold text-primary">{plan.precio}</span>
              <span className="text-muted ms-2">/ {plan.duracion}</span>
            </div>
          </div>

          <hr className="my-4" />

          <ul className="list-unstyled text-start mb-5 flex-grow-1">
            {plan.caracteristicas.map((feature, index) => (
              <li key={index} className="mb-3 d-flex align-items-center">
                <i className="bi bi-check-circle-fill text-success me-3 fs-5"></i>
                <span className="text-secondary">{feature}</span>
              </li>
            ))}
          </ul>

          <Button 
            variant={plan.popular ? "primary" : "outline-primary"} 
            size="lg" 
            className="w-100 rounded-pill py-3 fw-bold"
            onClick={() => onSelect(plan)}
            disabled={loading}
          >
            {loading ? (
              <><Spinner animation="border" size="sm" className="me-2" /> Procesando...</>
            ) : (
              "Comenzar Ahora"
            )}
          </Button>
        </Card.Body>
      </Card>
    </Col>
  );
};

export default TarjetaPlan;

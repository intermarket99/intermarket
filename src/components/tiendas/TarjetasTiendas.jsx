import React from "react";
import { Row, Col, Card, Button } from "react-bootstrap";

const TarjetasTiendas = ({ tiendas = [], abrirModalEdicion, abrirModalEliminacion }) => {
    return (
        <Row>
            {tiendas.map((tienda) => (
                <Col key={tienda.id_tienda} xs={12} sm={6} md={4} lg={3} className="mb-4">
                    <Card className="h-100 shadow-sm">
                        {tienda.imagen_url ? (
                            <Card.Img
                                variant="top"
                                src={tienda.imagen_url}
                                alt={tienda.nombre_tienda}
                                style={{ height: "200px", objectFit: "cover" }}
                                onError={(e) => {
                                    e.target.src = "https://via.placeholder.com/200x200?text=Sin+Imagen";
                                }}
                            />
                        ) : (
                            <div className="bg-light d-flex align-items-center justify-content-center" style={{ height: "200px" }}>
                                <i className="bi bi-shop text-muted" style={{ fontSize: "2.5rem" }} />
                            </div>
                        )}

                        <Card.Body className="d-flex flex-column">
                            <Card.Title className="text-truncate" title={tienda.nombre_tienda}>
                                {tienda.nombre_tienda}
                            </Card.Title>

                            <div className="mt-auto d-flex gap-2">
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="flex-fill"
                                    onClick={() => abrirModalEdicion(tienda)}
                                >
                                    <i className="bi bi-pencil" /> Editar
                                </Button>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    className="flex-fill"
                                    onClick={() => abrirModalEliminacion(tienda)}
                                >
                                    <i className="bi bi-trash" /> Eliminar
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            ))}
        </Row>
    );
};

export default TarjetasTiendas;

import React from 'react';
import { Container, Button, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const CheckoutCancel = () => {
    const navigate = useNavigate();

    return (
        <Container className="py-5 mt-5">
            <Card className="text-center shadow-sm border-0 p-5">
                <Card.Body>
                    <div className="mb-4 text-warning">
                        <i className="bi bi-x-circle-fill" style={{ fontSize: '4rem' }}></i>
                    </div>
                    <Card.Title as="h2" className="mb-3">Pago Cancelado</Card.Title>
                    <Card.Text className="text-muted mb-4">
                        El proceso de pago ha sido cancelado. Puedes volver al catálogo para seguir comprando.
                        Tus productos siguen en el carrito.
                    </Card.Text>
                    <Button variant="primary" onClick={() => navigate('/catalogo')}>
                        Volver al Catálogo
                    </Button>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default CheckoutCancel;

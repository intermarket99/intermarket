import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';

const ModalEliminacionVenta = ({
    mostrarModal,
    setMostrarModal,
    ventaAEliminar,
    eliminarVenta
}) => {
    const [desabilitado, setDesabilitado] = useState(false);

    const handleEliminar = async () => {
        if (desabilitado) return;
        setDesabilitado(true);
        await eliminarVenta();
        setDesabilitado(false);
    };

    if (!ventaAEliminar) return null;

    return (
        <Modal
            show={mostrarModal}
            onHide={() => setMostrarModal(false)}
            backdrop="static"
            keyboard={false}
            centered
        >
            <Modal.Header closeButton>
                <Modal.Title>Eliminar Venta</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <p>¿Estás seguro de que deseas eliminar la venta con ID de pedido <strong>{ventaAEliminar.pedido_id}</strong>?</p>
                <p className="text-muted">Esta acción no se puede deshacer.</p>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={() => setMostrarModal(false)}>
                    Cancelar
                </Button>
                <Button
                    variant="danger"
                    onClick={handleEliminar}
                    disabled={desabilitado}
                >
                    {desabilitado ? "Eliminando..." : "Eliminar"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalEliminacionVenta;
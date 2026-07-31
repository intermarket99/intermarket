import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';

const ModalEliminacionProducto = ({
    mostrarModal,
    setMostrarModal,
    productoAEliminar,
    eliminarProducto
}) => {
    const [deshabilitado, setDeshabilitado] = useState(false);

    const handleEliminar = async () => {
        if (deshabilitado) return;
        setDeshabilitado(true);
        await eliminarProducto();
        setDeshabilitado(false);
    };

    if (!productoAEliminar) return null;

    return (
        <Modal
            show={mostrarModal}
            onHide={() => setMostrarModal(false)}
            backdrop="static"
            keyboard={false}
            centered
        >
            <Modal.Header closeButton>
                <Modal.Title>Eliminar Producto</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <p>¿Está seguro de que desea eliminar el producto <strong>"{productoAEliminar.nombre_producto}"</strong>?</p>
                <p className="text-muted">Esta acción no se puede deshacer.</p>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={() => setMostrarModal(false)}>
                    Cancelar
                </Button>
                <Button
                    variant="danger"
                    onClick={handleEliminar}
                    disabled={deshabilitado}
                >
                    {deshabilitado ? "Eliminando..." : "Eliminar"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalEliminacionProducto;
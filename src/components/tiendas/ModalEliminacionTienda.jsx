import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";

const ModalEliminacionTienda = ({ mostrarModal, setMostrarModal, tiendaAEliminar, eliminarTienda }) => {
    const [deshabilitado, setDeshabilitado] = useState(false);

    const handleEliminar = async () => {
        if (deshabilitado) return;
        setDeshabilitado(true);
        await eliminarTienda();
        setDeshabilitado(false);
    };

    if (!tiendaAEliminar) return null;

    return (
        <Modal show={mostrarModal} onHide={() => setMostrarModal(false)} centered backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>Eliminar Tienda</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>
                    ¿Está seguro de eliminar la tienda <strong>"{tiendaAEliminar.nombre_tienda}"</strong>?
                </p>
                <p className="text-muted">Esta acción no se puede deshacer.</p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => setMostrarModal(false)}>
                    Cancelar
                </Button>
                <Button variant="danger" onClick={handleEliminar} disabled={deshabilitado}>
                    {deshabilitado ? "Eliminando..." : "Eliminar"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalEliminacionTienda;

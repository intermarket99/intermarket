import React, { useState } from 'react';
import {Modal, Button} from 'react-bootstrap';

const ModalEliminarCategoria = ({
    mostrarModalEdicion,
    setMostrarModalEliminacion,
    eliminarCategoria,
    categoria
}) =>{

    const [deshabilitado, setDeshabilido] = useState(false);

    const handleEliminar = async () => {
        if (deshabilitado) return;
        setDeshabilido(true);
        try {
            await eliminarCategoria();
        } finally {
            setDeshabilido(false);
        }
    };

    return(
    <Modal
        show={mostrarModalEdicion}
        onHide={() => setMostrarModalEliminacion(false)}
        backdrop="static"
        keyboard={false}
        centered
    >
        <Modal.Header closeButton>
            <Modal.Title>Eliminar Categoría</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <p>¿Está seguro que desea eliminar la categoría <strong>{categoria?.nombre_categoria}</strong>?</p>
            <p className="text-danger">Esta acción no se puede deshacer.</p>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={() => setMostrarModalEliminacion(false)}>
                Cancelar
            </Button>
            <Button variant="danger" onClick={handleEliminar} disabled={deshabilitado}>
                {deshabilitado ? 'Eliminando...' : 'Eliminar'}
            </Button>
        </Modal.Footer>
    </Modal>    

    )

};

export default ModalEliminarCategoria;
import React, { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";

const ModalRegistroTienda = ({
    mostrarModal,
    setMostrarModal,
    nuevaTienda,
    manejoCambioInput,
    manejoCambioArchivo,
    agregarTienda
}) => {
    const [deshabilitado, setDeshabilitado] = useState(false);

    const handleGuardar = async () => {
        if (deshabilitado) return;
        setDeshabilitado(true);
        await agregarTienda();
        setDeshabilitado(false);
    };

    return (
        <Modal show={mostrarModal} onHide={() => setMostrarModal(false)} centered backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>Registrar Tienda</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Nombre de la tienda *</Form.Label>
                        <Form.Control
                            type="text"
                            name="nombre_tienda"
                            value={nuevaTienda.nombre_tienda}
                            onChange={manejoCambioInput}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Imagen (opcional)</Form.Label>
                        <Form.Control type="file" accept="image/*" onChange={manejoCambioArchivo} />
                    </Form.Group>

                    {nuevaTienda.imagen_url && (
                        <div className="text-center">
                            <img
                                src={nuevaTienda.imagen_url}
                                alt="Vista previa"
                                style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain" }}
                            />
                        </div>
                    )}
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => setMostrarModal(false)}>
                    Cancelar
                </Button>
                <Button variant="primary" onClick={handleGuardar} disabled={deshabilitado}>
                    {deshabilitado ? "Guardando..." : "Guardar Tienda"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalRegistroTienda;

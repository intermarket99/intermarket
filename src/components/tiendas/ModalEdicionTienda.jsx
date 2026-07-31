import React, { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";

const ModalEdicionTienda = ({
    mostrarModalEdicion,
    setMostrarModalEdicion,
    tiendaEditar,
    manejoCambioInputEdicion,
    manejoCambioArchivoActualizar,
    actualizarTienda
}) => {
    const [deshabilitado, setDeshabilitado] = useState(false);

    const handleActualizar = async () => {
        if (deshabilitado) return;
        setDeshabilitado(true);
        await actualizarTienda();
        setDeshabilitado(false);
    };

    if (!tiendaEditar) return null;

    return (
        <Modal show={mostrarModalEdicion} onHide={() => setMostrarModalEdicion(false)} centered backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>Editar Tienda</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Nombre de la tienda *</Form.Label>
                        <Form.Control
                            type="text"
                            name="nombre_tienda"
                            value={tiendaEditar.nombre_tienda || ""}
                            onChange={manejoCambioInputEdicion}
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Nueva imagen (opcional)</Form.Label>
                        <Form.Control type="file" accept="image/*" onChange={manejoCambioArchivoActualizar} />
                    </Form.Group>

                    {tiendaEditar.imagen_url && (
                        <div className="text-center">
                            <img
                                src={tiendaEditar.imagen_url}
                                alt="Vista previa"
                                style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain" }}
                            />
                        </div>
                    )}
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => setMostrarModalEdicion(false)}>
                    Cancelar
                </Button>
                <Button variant="primary" onClick={handleActualizar} disabled={deshabilitado}>
                    {deshabilitado ? "Actualizando..." : "Actualizar Tienda"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalEdicionTienda;

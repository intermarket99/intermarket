import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';

const ModalEdicionVenta = ({
    mostrarModal,
    setMostrarModal,
    ventaEditar,
    manejoCambioEdicion,
    editarVenta,
    productos
}) => {
    const [desabilitado, setDesabilitado] = useState(false);

    const handleEditar = async () => {
        if (desabilitado) return;
        setDesabilitado(true);
        await editarVenta();
        setDesabilitado(false);
    };

    if (!ventaEditar) return null;

    return (
        <Modal
            show={mostrarModal}
            onHide={() => setMostrarModal(false)}
            backdrop="static"
            keyboard={false}
            centered
            size="lg"
        >
            <Modal.Header closeButton>
                <Modal.Title>Editar Venta</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Form>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>ID Pedido *</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="pedido_id"
                                    value={ventaEditar.pedido_id}
                                    onChange={manejoCambioEdicion}
                                    placeholder="Ingresa el ID del pedido"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Producto *</Form.Label>
                                <Form.Select
                                    name="id_producto"
                                    value={ventaEditar.id_producto}
                                    onChange={manejoCambioEdicion}
                                >
                                    <option value="">Selecciona un producto</option>
                                    {productos.map((producto) => (
                                        <option key={producto.id} value={producto.id}>
                                            {producto.nombre_producto}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>ID Comprador *</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="comprador_id"
                                    value={ventaEditar.comprador_id}
                                    onChange={manejoCambioEdicion}
                                    placeholder="Ingresa el ID del comprador"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Monto Total *</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    name="monto_total"
                                    value={ventaEditar.monto_total}
                                    onChange={manejoCambioEdicion}
                                    placeholder="0.00"
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Comisión *</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    name="comision"
                                    value={ventaEditar.comision}
                                    onChange={manejoCambioEdicion}
                                    placeholder="0.00"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Monto Neto *</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    name="monto_neto"
                                    value={ventaEditar.monto_neto}
                                    onChange={manejoCambioEdicion}
                                    placeholder="0.00"
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Estado</Form.Label>
                                <Form.Select
                                    name="estado"
                                    value={ventaEditar.estado}
                                    onChange={manejoCambioEdicion}
                                >
                                    <option value="pendiente">Pendiente</option>
                                    <option value="completada">Completada</option>
                                    <option value="cancelada">Cancelada</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Método de Pago</Form.Label>
                                <Form.Select
                                    name="metodo_pago"
                                    value={ventaEditar.metodo_pago}
                                    onChange={manejoCambioEdicion}
                                >
                                    <option value="efectivo">Efectivo</option>
                                    <option value="tarjeta">Tarjeta</option>
                                    <option value="transferencia">Transferencia</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Número de Transacción</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="numero_transaccion"
                                    value={ventaEditar.numero_transaccion}
                                    onChange={manejoCambioEdicion}
                                    placeholder="Ingresa el número de transacción"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Fecha de Venta *</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="fecha_venta"
                                    value={ventaEditar.fecha_venta}
                                    onChange={manejoCambioEdicion}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Fecha de Entrega</Form.Label>
                                <Form.Control
                                    type="date"
                                    name="fecha_entrega"
                                    value={ventaEditar.fecha_entrega}
                                    onChange={manejoCambioEdicion}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label>Comentarios</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            name="comentarios"
                            value={ventaEditar.comentarios}
                            onChange={manejoCambioEdicion}
                            placeholder="Ingresa comentarios adicionales"
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={() => setMostrarModal(false)}>
                    Cancelar
                </Button>
                <Button
                    variant="primary"
                    onClick={handleEditar}
                    disabled={
                        ventaEditar.pedido_id.trim() === "" ||
                        ventaEditar.id_producto === "" ||
                        ventaEditar.comprador_id.trim() === "" ||
                        ventaEditar.monto_total === "" ||
                        ventaEditar.comision === "" ||
                        ventaEditar.monto_neto === "" ||
                        ventaEditar.fecha_venta === "" ||
                        desabilitado
                    }
                >
                    {desabilitado ? "Actualizando..." : "Actualizar"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalEdicionVenta;
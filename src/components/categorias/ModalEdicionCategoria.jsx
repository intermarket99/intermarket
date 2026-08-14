import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

const ModalEdicionCategoria = ({
  mostrarModalEdicion,
  setMostrarModalEdicion,
  categoriaEditar,
  manejarCambioInputEdicion,
  actualizarCategoria,
}) => {
  const [deshabilitado, setDeshabilitado] = useState(false);

  const handleActualizar = async () => {
    if (deshabilitado) return;
    setDeshabilitado(true);
    await actualizarCategoria();
    setDeshabilitado(false);
  };

  const labelStyle = {
    color: "#0d5c63",
    fontWeight: 600,
    fontSize: "0.95rem",
    marginBottom: "6px",
  };

  const inputStyle = {
    backgroundColor: "#e8f4f8",
    border: "none",
    borderRadius: "12px",
    padding: "12px 16px",
    fontSize: "0.95rem",
    color: "#333",
    boxShadow: "none",
  };

  if (!categoriaEditar) return null;

  return (
    <Modal
      show={mostrarModalEdicion}
      onHide={() => setMostrarModalEdicion(false)}
      backdrop="static"
      keyboard={false}
      centered
      size="md"
      contentClassName="border-0 shadow-lg"
    >
      <Modal.Header className="border-0 pb-0 pt-4 px-4">
        <Modal.Title className="fw-bold" style={{ color: "#0d5c63", fontSize: "1.35rem" }}>
          Editar categoría
        </Modal.Title>
        <button
          type="button"
          className="btn-close"
          onClick={() => setMostrarModalEdicion(false)}
          aria-label="Cerrar"
        />
      </Modal.Header>

      <Modal.Body className="px-4 pt-3 pb-2">
        <Form>
          <Form.Group className="mb-3">
            <Form.Label style={labelStyle}>Nombre</Form.Label>
            <Form.Control
              type="text"
              name="nombre_categoria"
              value={categoriaEditar.nombre_categoria || ""}
              onChange={manejarCambioInputEdicion}
              style={inputStyle}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={labelStyle}>Descripción</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="descripcion"
              value={categoriaEditar.descripcion || ""}
              onChange={manejarCambioInputEdicion}
              style={{ ...inputStyle, resize: "none" }}
            />
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer className="border-0 pt-0 pb-4 px-4">
        <Button
          onClick={handleActualizar}
          disabled={deshabilitado}
          className="w-100 border-0 fw-semibold"
          style={{
            backgroundColor: "#a8e0ef",
            color: "#0d5c63",
            borderRadius: "50px",
            padding: "12px",
            fontSize: "1rem",
          }}
        >
          {deshabilitado ? "Guardando..." : "Guardar cambios"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalEdicionCategoria;
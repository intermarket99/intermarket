import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

const ModalRegistroCategoria = ({
  mostrarModal,
  setMostrarModal,
  nuevaCategoria,
  manejoCambioInput,
  agregarCategoria,
}) => {
  const [deshabilitado, setDeshabilitado] = useState(false);

  const handleRegistrar = async () => {
    if (deshabilitado) return;
    setDeshabilitado(true);
    await agregarCategoria();
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

  return (
    <Modal
      show={mostrarModal}
      onHide={() => setMostrarModal(false)}
      backdrop="static"
      keyboard={false}
      centered
      size="md"
      contentClassName="border-0 shadow-lg"
    >
      <Modal.Header className="border-0 pb-0 pt-4 px-4" style={{ background: "transparent" }}>
        <Modal.Title className="fw-bold" style={{ color: "#0d5c63", fontSize: "1.35rem" }}>
          Registrar categoría
        </Modal.Title>
        <button
          type="button"
          className="btn-close"
          onClick={() => setMostrarModal(false)}
          aria-label="Cerrar"
          style={{
            filter:
              "invert(15%) sepia(90%) saturate(5000%) hue-rotate(350deg) brightness(0.9)",
            opacity: 0.85,
          }}
        />
      </Modal.Header>

      <Modal.Body className="px-4 pt-3 pb-2">
        <Form>
          <Form.Group className="mb-3">
            <Form.Label style={labelStyle}>Nombre</Form.Label>
            <Form.Control
              type="text"
              name="nombre_categoria"
              value={nuevaCategoria.nombre_categoria}
              onChange={manejoCambioInput}
              placeholder="Ej: Ropa, Zapatos, Electrónica"
              style={inputStyle}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={labelStyle}>Descripción</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="descripcion"
              value={nuevaCategoria.descripcion}
              onChange={manejoCambioInput}
              placeholder="Describe para qué sirve esta categoría"
              style={{ ...inputStyle, resize: "none" }}
            />
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer className="border-0 pt-0 pb-4 px-4">
        <Button
          onClick={handleRegistrar}
          disabled={
            deshabilitado ||
            nuevaCategoria.nombre_categoria.trim() === "" ||
            nuevaCategoria.descripcion.trim() === ""
          }
          className="w-100 border-0 fw-semibold"
          style={{
            backgroundColor: "#a8e0ef",
            color: "#0d5c63",
            borderRadius: "50px",
            padding: "12px",
            fontSize: "1rem",
            boxShadow: "none",
            opacity:
              deshabilitado ||
              nuevaCategoria.nombre_categoria.trim() === "" ||
              nuevaCategoria.descripcion.trim() === ""
                ? 0.6
                : 1,
          }}
        >
          {deshabilitado ? "Guardando..." : "Guardar categoría"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalRegistroCategoria;
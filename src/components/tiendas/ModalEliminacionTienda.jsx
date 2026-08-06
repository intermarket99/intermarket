import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";

const ModalEliminacionTienda = ({
  mostrarModal,
  setMostrarModal,
  tiendaAEliminar,
  eliminarTienda,
}) => {
  const [deshabilitado, setDeshabilitado] = useState(false);

  const handleEliminar = async () => {
    if (deshabilitado) return;
    setDeshabilitado(true);
    await eliminarTienda();
    setDeshabilitado(false);
  };

  if (!tiendaAEliminar) return null;

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
      {/* Header */}
      <Modal.Header
        className="border-0 pb-0 pt-4 px-4"
        style={{ background: "transparent" }}
      >
        <Modal.Title
          className="fw-bold"
          style={{ color: "#0d5c63", fontSize: "1.35rem" }}
        >
          Eliminar tienda
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

      <Modal.Body className="px-4 pt-3 pb-2 text-center">
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            backgroundColor: "#fee2e2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <i
            className="bi bi-trash3"
            style={{ fontSize: "1.6rem", color: "#ef4444" }}
          />
        </div>

        <p style={{ fontSize: "1rem", color: "#0f172a", marginBottom: 8 }}>
          ¿Estás seguro de eliminar la tienda
        </p>
        <p
          style={{
            fontWeight: 700,
            fontSize: "1.1rem",
            color: "#0d5c63",
            marginBottom: 12,
          }}
        >
          "{tiendaAEliminar.nombre_tienda}"?
        </p>
        <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginBottom: 0 }}>
          Esta acción no se puede deshacer.
        </p>
      </Modal.Body>

      {/* Footer */}
      <Modal.Footer className="border-0 pt-2 pb-4 px-4 d-flex gap-2">
        <Button
          onClick={() => setMostrarModal(false)}
          className="flex-fill border-0 fw-semibold"
          style={{
            backgroundColor: "#e8f4f8",
            color: "#0d5c63",
            borderRadius: "50px",
            padding: "12px",
            fontSize: "0.95rem",
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleEliminar}
          disabled={deshabilitado}
          className="flex-fill border-0 fw-semibold"
          style={{
            backgroundColor: "#ef4444",
            color: "white",
            borderRadius: "50px",
            padding: "12px",
            fontSize: "0.95rem",
          }}
        >
          {deshabilitado ? "Eliminando..." : "Eliminar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalEliminacionTienda;
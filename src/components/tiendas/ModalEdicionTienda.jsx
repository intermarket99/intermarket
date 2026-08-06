import React, { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";

const ModalEdicionTienda = ({
  mostrarModalEdicion,
  setMostrarModalEdicion,
  tiendaEditar,
  manejoCambioInputEdicion,
  manejoCambioArchivoActualizar,
  actualizarTienda,
}) => {
  const [deshabilitado, setDeshabilitado] = useState(false);

  const handleActualizar = async () => {
    if (deshabilitado) return;
    setDeshabilitado(true);
    await actualizarTienda();
    setDeshabilitado(false);
  };

  if (!tiendaEditar) return null;

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
      show={mostrarModalEdicion}
      onHide={() => setMostrarModalEdicion(false)}
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
          Editar tienda
        </Modal.Title>
        <button
          type="button"
          className="btn-close"
          onClick={() => setMostrarModalEdicion(false)}
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
          {/* Nombre */}
          <Form.Group className="mb-3">
            <Form.Label style={labelStyle}>Nombre de la tienda</Form.Label>
            <Form.Control
              type="text"
              name="nombre_tienda"
              value={tiendaEditar.nombre_tienda || ""}
              onChange={manejoCambioInputEdicion}
              placeholder="Ingresa el nombre de la tienda"
              style={inputStyle}
            />
          </Form.Group>

          {/* Imagen */}
          <Form.Group className="mb-3">
            <Form.Label style={labelStyle}>Imagenes de la tienda</Form.Label>

            <div
              className="position-relative"
              style={{
                border: "2px dashed #f5c6cb",
                borderRadius: "12px",
                backgroundColor: "#fdf2f2",
                minHeight: "100px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              onClick={() =>
                document.getElementById("input-imagen-tienda-editar")?.click()
              }
            >
              <input
                id="input-imagen-tienda-editar"
                type="file"
                accept="image/*"
                onChange={manejoCambioArchivoActualizar}
                style={{ display: "none" }}
              />

              {tiendaEditar.archivo_imagen ? (
                <div className="p-2 w-100 text-center">
                  <img
                    src={URL.createObjectURL(tiendaEditar.archivo_imagen)}
                    alt="Vista previa"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "140px",
                      objectFit: "contain",
                      borderRadius: "8px",
                    }}
                    onLoad={(e) => URL.revokeObjectURL(e.target.src)}
                  />
                </div>
              ) : tiendaEditar.imagen_url ? (
                <div className="p-2 w-100 text-center">
                  <img
                    src={tiendaEditar.imagen_url}
                    alt="Vista previa"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "140px",
                      objectFit: "contain",
                      borderRadius: "8px",
                    }}
                  />
                </div>
              ) : (
                <div className="text-center text-muted py-3">
                  <i
                    className="bi bi-image"
                    style={{ fontSize: "1.6rem", color: "#e89a9a" }}
                  />
                  <div
                    style={{
                      fontSize: "0.85rem",
                      marginTop: "4px",
                      color: "#b07a7a",
                    }}
                  >
                    Toca para seleccionar imagen
                  </div>
                </div>
              )}
            </div>
          </Form.Group>
        </Form>
      </Modal.Body>

      {/* Footer */}
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
            boxShadow: "none",
          }}
          onMouseOver={(e) => {
            if (!deshabilitado) e.currentTarget.style.backgroundColor = "#8fd4e8";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "#a8e0ef";
          }}
        >
          {deshabilitado ? "Guardando..." : "Guardar cambios"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalEdicionTienda;
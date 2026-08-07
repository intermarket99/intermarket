import React from "react";

const TarjetasProductos = ({
  productos,
  abrirModalEdicion,
  abrirModalEliminacion,
  abrirModalDescuento,
}) => {
  const getImagen = (producto) => {
    const img = producto.imagen_url;
    if (Array.isArray(img) && img.length > 0) return img[0];
    if (typeof img === "string" && img) return img;
    return null;
  };

  if (!productos || productos.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <i className="bi bi-box-seam" style={{ fontSize: "2.5rem", color: "#cbd5e1" }} />
        <p className="mt-2 mb-0">No hay productos registrados.</p>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-3 px-1">
      {productos.map((producto) => {
        const imagen = getImagen(producto);
        const subtitulo =
          producto.descripcion?.trim() ||
          producto.categorias?.nombre_categoria ||
          "Sin descripción";

        return (
          <div
            key={producto.id_producto}
            style={{
              backgroundColor: "white",
              borderRadius: 18,
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            }}
          >
            {/* Imagen */}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                backgroundColor: "#f1f5f9",
                overflow: "hidden",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {imagen ? (
                <img
                  src={imagen}
                  alt={producto.nombre_producto}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <i className="bi bi-image" style={{ fontSize: "1.3rem", color: "#cbd5e1" }} />
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "#0f172a",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {producto.nombre_producto}
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#94a3b8",
                  marginTop: 2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {subtitulo.length > 40 ? `${subtitulo.substring(0, 40)}...` : subtitulo}
              </div>
            </div>

            {/* Acciones */}
            <div className="d-flex align-items-center gap-2" style={{ flexShrink: 0 }}>
              <button
                type="button"
                className="btn p-0 border-0 bg-transparent"
                onClick={() => abrirModalEliminacion(producto)}
                title="Eliminar"
              >
                <i className="bi bi-trash" style={{ fontSize: "1.1rem", color: "#ef4444" }} />
              </button>
              <button
                type="button"
                className="btn p-0 border-0 bg-transparent"
                onClick={() => abrirModalDescuento(producto)}
                title="Descuento"
              >
                <i className="bi bi-percent" style={{ fontSize: "1.1rem", color: "#0d5c63" }} />
              </button>
              <button
                type="button"
                className="btn p-0 border-0 bg-transparent"
                onClick={() => abrirModalEdicion(producto)}
                title="Editar"
              >
                <i className="bi bi-pencil-square" style={{ fontSize: "1.1rem", color: "#0d5c63" }} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TarjetasProductos;
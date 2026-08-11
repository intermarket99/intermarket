import React from "react";

const obtenerPrimeraImagen = (imagenUrl) => {
  if (Array.isArray(imagenUrl)) {
    return imagenUrl[0] || null;
  }
  return imagenUrl || null;
};

const TarjetaCatalogoMovile = ({
  producto,
  abrirModalDetalles,
  abrirModalContacto, /* NUEVO: Prop para contactar vendedor */
  agregarAlCarrito,
  miTiendaId
}) => {
  const precioVenta = Number(producto.precio_venta || 0);
  const precioOriginal = Number(producto.precio_original || 0);
  const stock = Number(producto.stock || 0);

  const esOferta = precioOriginal > 0 && precioOriginal > precioVenta;
  const porcentajeDescuento = esOferta ? Math.round((1 - precioVenta / precioOriginal) * 100) : 0;

  const esMiProducto = producto.id_tienda === miTiendaId;
  const estaAgotado = stock <= 0;

  const tieneTallas = Array.isArray(producto.tallas) && producto.tallas.length > 0;
  const tieneColores = Array.isArray(producto.colores) && producto.colores.length > 0;
  const tieneVariantes = tieneTallas || tieneColores;

  const imagen = obtenerPrimeraImagen(producto.imagen_url);

  const manejarAgregar = (event) => {
    event.stopPropagation();
    if (esMiProducto || estaAgotado) return;
    if (tieneVariantes) {
      abrirModalDetalles(producto);
      return;
    }
    agregarAlCarrito(producto);
  };

  const abrirDetallesConTeclado = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      abrirModalDetalles(producto);
    }
  };

  return (
    <article
      className="catalog-mobile-card"
      role="button"
      tabIndex={0}
      onClick={() => abrirModalDetalles(producto)}
      onKeyDown={abrirDetallesConTeclado}
    >
      <div className="catalog-mobile-media">
        <img
          src={imagen || "https://via.placeholder.com/500x650?text=Sin+Imagen"}
          alt={producto.nombre_producto}
          className="catalog-mobile-image"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = "https://via.placeholder.com/500x650?text=Sin+Imagen";
          }}
        />
        <span className="catalog-mobile-image-overlay" aria-hidden="true" />
        <div className="catalog-mobile-badges">
          {esOferta && (
            <span className="catalog-discount-ribbon">
              -{porcentajeDescuento}%
            </span>
          )}
          {estaAgotado && (
            <span className="catalog-soldout-label">Agotado</span>
          )}
        </div>
      </div>

      <div className="catalog-mobile-content">
        <div className="catalog-mobile-meta">
          <span className="catalog-mobile-category">
            {producto.categorias?.nombre_categoria || "General"}
          </span>
          {esMiProducto && (
            <span className="catalog-mobile-own">Mi producto</span>
          )}
        </div>

        <h3 className="catalog-mobile-title">
          {producto.nombre_producto}
        </h3>

        <div className="catalog-mobile-price-row">
          <span className="catalog-mobile-price">
            <small>C$</small>
            {precioVenta.toFixed(2)}
          </span>
          {esOferta && (
            <span className="catalog-mobile-old-price">
              C${precioOriginal.toFixed(2)}
            </span>
          )}
        </div>

        {!estaAgotado && stock <= 5 && (
          <div className="catalog-mobile-stock">
            <i className="bi bi-fire" />
            Últimos {stock}
          </div>
        )}

        {/* FILA DE ACCIONES CON NUEVOS BOTONES */}
        <div className="catalog-mobile-actions-row">
          {!esMiProducto && (
            <>
              {/* Botón de Mensaje */}
              <button
                type="button"
                className="catalog-mobile-msg-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  abrirModalContacto(producto);
                }}
                title="Contactar vendedor"
              >
                <i className="bi bi-chat-dots-fill"></i>
              </button>

              {/* Botón Píldora Teal (Añadir / Seleccionar) */}
              <button
                type="button"
                className="catalog-mobile-cart-pill"
                onClick={manejarAgregar}
                disabled={esMiProducto || estaAgotado}
              >
                <i className={`bi ${tieneVariantes ? "bi-sliders" : "bi-cart-plus"}`} />
                <span>
                  {estaAgotado
                    ? "Agotado"
                    : tieneVariantes
                    ? "Seleccionar"
                    : "Agregar"}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
};

export default TarjetaCatalogoMovile;
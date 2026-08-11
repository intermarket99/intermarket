import React from "react";
import {
  Card,
  Button,
  OverlayTrigger,
  Tooltip,
  Carousel
} from "react-bootstrap";

const TarjetaCatalogo = ({
  producto,
  abrirModalDetalles,
  abrirModalContacto,
  agregarAlCarrito,
  miTiendaId
}) => {
  const precioVenta = Number(producto.precio_venta || 0);
  const precioOriginal = Number(producto.precio_original || 0);
  const stock = Number(producto.stock || 0);

  const esOferta = precioOriginal > 0 && precioOriginal > precioVenta;
  const porcentajeDescuento = esOferta
    ? Math.round((1 - precioVenta / precioOriginal) * 100)
    : 0;

  const esMiProducto = producto.id_tienda === miTiendaId;
  const estaAgotado = stock <= 0;

  const tieneTallas = Array.isArray(producto.tallas) && producto.tallas.length > 0;
  const tieneColores = Array.isArray(producto.colores) && producto.colores.length > 0;
  const tieneVariantes = tieneTallas || tieneColores;

  const imagenes = Array.isArray(producto.imagen_url)
    ? producto.imagen_url.filter(Boolean)
    : producto.imagen_url
      ? [producto.imagen_url]
      : [];

  const tieneMultiplesImagenes = imagenes.length > 1;

  const manejarCompra = (event) => {
    event.stopPropagation();

    if (esMiProducto) {
      alert("No puedes comprar tus propios productos.");
      return;
    }
    if (estaAgotado) {
      alert("Este producto está agotado.");
      return;
    }
    if (tieneVariantes) {
      abrirModalDetalles(producto);
      return;
    }
    agregarAlCarrito(producto);
  };

  return (
    <Card className="catalog-product-card border-0">
      <div className="catalog-product-media">
        <div
          className="catalog-product-image-button"
          onClick={() => abrirModalDetalles(producto)}
        >
          {tieneMultiplesImagenes ? (
            <Carousel
              fade
              indicators={false}
              controls={false}
              interval={4000}
              pause={false}
              className="catalog-product-carousel"
            >
              {imagenes.map((url, indice) => (
                <Carousel.Item key={url}>
                  <img
                    src={url}
                    alt={`${producto.nombre_producto} ${indice + 1}`}
                    className="catalog-product-image"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.src =
                        "https://via.placeholder.com/500?text=Sin+Imagen";
                    }}
                  />
                </Carousel.Item>
              ))}
            </Carousel>
          ) : (
            <img
              src={imagenes[0] || "https://via.placeholder.com/500?text=Sin+Imagen"}
              alt={producto.nombre_producto}
              className="catalog-product-image"
              loading="lazy"
              onError={(event) => {
                event.currentTarget.src =
                  "https://via.placeholder.com/500?text=Sin+Imagen";
              }}
            />
          )}
          <div className="catalog-product-image-overlay" />
        </div>

        <div className="catalog-product-badges">
          {esOferta && (
            <span className="catalog-desktop-discount-ribbon">
              -{porcentajeDescuento}%
            </span>
          )}
          {estaAgotado && (
            <span className="catalog-desktop-soldout-label">
              Agotado
            </span>
          )}
        </div>

        <div className="catalog-product-actions">
          <OverlayTrigger placement="top" overlay={<Tooltip>Ver detalles</Tooltip>}>
            <Button
              className="catalog-action-button"
              onClick={() => abrirModalDetalles(producto)}
            >
              <i className="bi bi-eye" />
            </Button>
          </OverlayTrigger>

          <OverlayTrigger placement="top" overlay={<Tooltip>Contactar vendedor</Tooltip>}>
            <Button
              className="catalog-action-button"
              onClick={() => abrirModalContacto(producto)}
            >
              <i className="bi bi-chat-dots" />
            </Button>
          </OverlayTrigger>
        </div>
      </div>

      <div className="catalog-product-content">
        <div className="catalog-product-meta">
          <span className="catalog-product-category">
            {producto.categorias?.nombre_categoria || "General"}
          </span>
          <span className="catalog-product-store">
            <i className="bi bi-shop" />
            {producto.tiendas?.perfiles?.[0]?.usuarios?.username || "Tienda Local"}
          </span>
        </div>

        <button
          type="button"
          className="catalog-product-title"
          onClick={() => abrirModalDetalles(producto)}
        >
          {producto.nombre_producto}
        </button>

        <div className="catalog-product-bottom">
          <div className="catalog-product-price-row">
            <span className="catalog-product-price">
              <small>C$</small>
              {precioVenta.toFixed(2)}
            </span>
            {esOferta && (
              <span className="catalog-product-old-price">
                C${precioOriginal.toFixed(2)}
              </span>
            )}
          </div>

          {!estaAgotado && stock <= 5 && (
            <div className="catalog-stock-container">
              <div className="catalog-stock-bar">
                <span style={{ width: `${Math.min(100, (stock / 10) * 100)}%` }} />
              </div>
              <small>
                <i className="bi bi-fire" />
                ¡Solo quedan {stock}!
              </small>
            </div>
          )}

          <button
            type="button"
            className={`catalog-add-button ${esMiProducto || estaAgotado ? "disabled" : ""}`}
            onClick={manejarCompra}
            disabled={esMiProducto || estaAgotado}
          >
            <i
              className={`bi bi-${
                esMiProducto
                  ? "shop"
                  : estaAgotado
                    ? "x-circle"
                    : tieneVariantes
                      ? "sliders"
                      : "cart-plus"
              }`}
            />
            {esMiProducto
              ? "Mi producto"
              : estaAgotado
                ? "Agotado"
                : tieneVariantes
                  ? "Seleccionar opciones"
                  : "Añadir al carrito"}
          </button>
        </div>
      </div>
    </Card>
  );
};

export default TarjetaCatalogo;
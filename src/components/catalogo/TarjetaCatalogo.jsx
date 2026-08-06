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
  const precioVenta = Number(
    producto.precio_venta || 0
  );

  const precioOriginal = Number(
    producto.precio_original || 0
  );

  const stock = Number(
    producto.stock || 0
  );

  const esOferta =
    precioOriginal > 0 &&
    precioOriginal > precioVenta;

  const porcentajeDescuento = esOferta
    ? Math.round(
        (1 - precioVenta / precioOriginal) * 100
      )
    : 0;

  const esMiProducto =
    producto.id_tienda === miTiendaId;

  const estaAgotado = stock <= 0;

  const tieneTallas =
    Array.isArray(producto.tallas) &&
    producto.tallas.length > 0;

  const tieneColores =
    Array.isArray(producto.colores) &&
    producto.colores.length > 0;

  const tieneVariantes =
    tieneTallas || tieneColores;

  const imagenes = Array.isArray(
    producto.imagen_url
  )
    ? producto.imagen_url.filter(Boolean)
    : producto.imagen_url
      ? [producto.imagen_url]
      : [];

  const tieneMultiplesImagenes =
    imagenes.length > 1;

  const manejarCompra = (event) => {
    event.stopPropagation();

    if (esMiProducto) {
      alert(
        "No puedes comprar tus propios productos."
      );
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
    <Card className="h-100 border-0 shadow-sm modern-product-card bg-white overflow-hidden">
      <div className="modern-card-img-wrapper position-relative">
        <div
          className="modern-card-img-container"
          onClick={() =>
            abrirModalDetalles(producto)
          }
        >
          {tieneMultiplesImagenes ? (
            <Carousel
              fade
              indicators={false}
              controls={false}
              interval={4000}
              pause={false}
              className="modern-card-carousel"
            >
              {imagenes.map((url, indice) => (
                <Carousel.Item key={url}>
                  <img
                    src={url}
                    alt={`${producto.nombre_producto} ${
                      indice + 1
                    }`}
                    className="modern-card-img"
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
            <Card.Img
              variant="top"
              src={
                imagenes[0] ||
                "https://via.placeholder.com/500?text=Sin+Imagen"
              }
              alt={producto.nombre_producto}
              className="modern-card-img"
              loading="lazy"
              onError={(event) => {
                event.currentTarget.src =
                  "https://via.placeholder.com/500?text=Sin+Imagen";
              }}
            />
          )}

          <div className="modern-card-overlay" />
        </div>

        <div className="modern-card-badges">
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

        <div className="modern-card-actions">
          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip>Ver detalles</Tooltip>
            }
          >
            <Button
              variant="white"
              className="action-btn shadow-sm"
              onClick={() =>
                abrirModalDetalles(producto)
              }
            >
              <i className="bi bi-eye" />
            </Button>
          </OverlayTrigger>

          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip>
                Contactar vendedor
              </Tooltip>
            }
          >
            <Button
              variant="white"
              className="action-btn shadow-sm"
              onClick={() =>
                abrirModalContacto(producto)
              }
            >
              <i className="bi bi-chat-dots" />
            </Button>
          </OverlayTrigger>
        </div>
      </div>

      <Card.Body className="d-flex flex-column p-3 pt-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="modern-category-tag">
            {producto.categorias
              ?.nombre_categoria || "General"}
          </span>

          <span className="modern-store-name text-truncate">
            <i className="bi bi-shop me-1" />

            {producto.tiendas?.perfiles?.[0]
              ?.usuarios?.username ||
              "Tienda Local"}
          </span>
        </div>

        <Card.Title
          className="modern-product-title mb-3"
          onClick={() =>
            abrirModalDetalles(producto)
          }
        >
          {producto.nombre_producto}
        </Card.Title>

        <div className="mt-auto">
          <div className="d-flex align-items-baseline gap-2 mb-3">
            <span className="modern-price">
              <small className="me-1">
                C$
              </small>

              {precioVenta.toFixed(2)}
            </span>

            {esOferta && (
              <span className="modern-old-price">
                C${precioOriginal.toFixed(2)}
              </span>
            )}
          </div>

          {!estaAgotado && stock <= 5 && (
            <div className="modern-stock-alert mb-3">
              <div
                className="progress"
                style={{ height: "4px" }}
              >
                <div
                  className="progress-bar bg-warning"
                  style={{
                    width: `${Math.min(
                      100,
                      (stock / 10) * 100
                    )}%`
                  }}
                />
              </div>

              <small className="text-warning fw-bold mt-1 d-block">
                <i className="bi bi-fire me-1" />
                ¡Solo quedan {stock}!
              </small>
            </div>
          )}

          <Button
            variant={
              esMiProducto
                ? "outline-secondary"
                : estaAgotado
                  ? "secondary"
                  : "primary"
            }
            className={`w-100 modern-main-btn ${
              !estaAgotado && !esMiProducto
                ? "shadow-sm"
                : ""
            }`}
            onClick={manejarCompra}
            disabled={
              esMiProducto || estaAgotado
            }
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
              } me-2`}
            />

            {esMiProducto
              ? "Mi producto"
              : estaAgotado
                ? "Agotado"
                : tieneVariantes
                  ? "Seleccionar opciones"
                  : "Añadir al carrito"}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default TarjetaCatalogo;
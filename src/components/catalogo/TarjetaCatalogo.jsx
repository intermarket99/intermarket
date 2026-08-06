import React from "react";
import {
    Badge,
    Button,
    Carousel,
    OverlayTrigger,
    Tooltip
} from "react-bootstrap";

const obtenerImagenes = (
    imagenUrl
) => {
    if (
        Array.isArray(
            imagenUrl
        )
    ) {
        return imagenUrl.filter(
            Boolean
        );
    }

    if (imagenUrl) {
        return [imagenUrl];
    }

    return [];
};

const TarjetaCatalogo = ({
    producto,
    abrirModalDetalles,
    abrirModalContacto,
    agregarAlCarrito,
    miTiendaId
}) => {
    const precioVenta =
        Number(
            producto.precio_venta ||
                0
        );

    const precioOriginal =
        Number(
            producto.precio_original ||
                0
        );

    const stock =
        Number(
            producto.stock ||
                0
        );

    const esOferta =
        precioOriginal >
        precioVenta;

    const porcentajeDescuento =
        esOferta &&
        precioOriginal > 0
            ? Math.round(
                  (
                      1 -
                      precioVenta /
                          precioOriginal
                  ) *
                      100
              )
            : 0;

    const imagenes =
        obtenerImagenes(
            producto.imagen_url
        );

    const tieneMultiplesImagenes =
        imagenes.length > 1;

    const esMiProducto =
        producto.id_tienda ===
        miTiendaId;

    const estaAgotado =
        stock <= 0;

    const tieneTallas =
        Array.isArray(
            producto.tallas
        ) &&
        producto.tallas.length > 0;

    const tieneColores =
        Array.isArray(
            producto.colores
        ) &&
        producto.colores.length > 0;

    const tieneVariantes =
        tieneTallas ||
        tieneColores;

    const manejarCompra = (
        event
    ) => {
        event.stopPropagation();

        if (
            esMiProducto ||
            estaAgotado
        ) {
            return;
        }

        if (tieneVariantes) {
            abrirModalDetalles(
                producto
            );

            return;
        }

        agregarAlCarrito(
            producto
        );
    };

    const textoBoton =
        esMiProducto
            ? "Mi producto"
            : estaAgotado
              ? "Agotado"
              : tieneVariantes
                ? "Seleccionar opciones"
                : "Añadir al carrito";

    const iconoBoton =
        esMiProducto
            ? "shop"
            : estaAgotado
              ? "x-circle"
              : tieneVariantes
                ? "sliders"
                : "cart-plus";

    return (
        <article className="catalog-product-card">
            <div className="catalog-product-media">
                <button
                    type="button"
                    className="catalog-product-image-button"
                    onClick={() =>
                        abrirModalDetalles(
                            producto
                        )
                    }
                    aria-label={`Ver ${producto.nombre_producto}`}
                >
                    {tieneMultiplesImagenes ? (
                        <Carousel
                            fade
                            indicators={
                                false
                            }
                            controls={
                                false
                            }
                            interval={
                                4000
                            }
                            pause={
                                false
                            }
                            className="catalog-product-carousel"
                        >
                            {imagenes.map(
                                (
                                    imagen,
                                    indice
                                ) => (
                                    <Carousel.Item
                                        key={`${producto.id_producto}-${indice}`}
                                    >
                                        <img
                                            src={
                                                imagen
                                            }
                                            alt={`${producto.nombre_producto} ${indice + 1}`}
                                            className="catalog-product-image"
                                            loading="lazy"
                                            onError={(
                                                event
                                            ) => {
                                                event.currentTarget.src =
                                                    "https://via.placeholder.com/600x700?text=Sin+Imagen";
                                            }}
                                        />
                                    </Carousel.Item>
                                )
                            )}
                        </Carousel>
                    ) : (
                        <img
                            src={
                                imagenes[0] ||
                                "https://via.placeholder.com/600x700?text=Sin+Imagen"
                            }
                            alt={
                                producto.nombre_producto
                            }
                            className="catalog-product-image"
                            loading="lazy"
                            onError={(
                                event
                            ) => {
                                event.currentTarget.src =
                                    "https://via.placeholder.com/600x700?text=Sin+Imagen";
                            }}
                        />
                    )}

                    <span className="catalog-product-image-overlay"></span>
                </button>

                <div className="catalog-product-badges">
                    {esOferta && (
                        <Badge className="catalog-badge catalog-badge-discount">
                            <i className="bi bi-lightning-fill"></i>
                            -{porcentajeDescuento}%
                        </Badge>
                    )}

                    {estaAgotado && (
                        <Badge className="catalog-badge catalog-badge-soldout">
                            Agotado
                        </Badge>
                    )}

                    {!estaAgotado &&
                        stock <= 5 && (
                            <Badge className="catalog-badge catalog-badge-stock">
                                Últimos {stock}
                            </Badge>
                        )}
                </div>

                <div className="catalog-product-actions">
                    <OverlayTrigger
                        placement="left"
                        overlay={
                            <Tooltip>
                                Ver detalles
                            </Tooltip>
                        }
                    >
                        <Button
                            type="button"
                            className="catalog-action-button"
                            onClick={() =>
                                abrirModalDetalles(
                                    producto
                                )
                            }
                        >
                            <i className="bi bi-eye"></i>
                        </Button>
                    </OverlayTrigger>

                    <OverlayTrigger
                        placement="left"
                        overlay={
                            <Tooltip>
                                Contactar vendedor
                            </Tooltip>
                        }
                    >
                        <Button
                            type="button"
                            className="catalog-action-button"
                            onClick={() =>
                                abrirModalContacto(
                                    producto
                                )
                            }
                        >
                            <i className="bi bi-chat-dots"></i>
                        </Button>
                    </OverlayTrigger>
                </div>
            </div>

            <div className="catalog-product-content">
                <div className="catalog-product-meta">
                    <span className="catalog-product-category">
                        {producto
                            .categorias
                            ?.nombre_categoria ||
                            "General"}
                    </span>

                    <span className="catalog-product-store">
                        <i className="bi bi-shop"></i>

                        {producto
                            .tiendas
                            ?.nombre_tienda ||
                            producto
                                .tiendas
                                ?.perfiles?.[0]
                                ?.usuarios
                                ?.username ||
                            "Tienda local"}
                    </span>
                </div>

                <button
                    type="button"
                    className="catalog-product-title"
                    onClick={() =>
                        abrirModalDetalles(
                            producto
                        )
                    }
                >
                    {
                        producto.nombre_producto
                    }
                </button>

                {producto.descripcion && (
                    <p className="catalog-product-description">
                        {
                            producto.descripcion
                        }
                    </p>
                )}

                <div className="catalog-product-bottom">
                    <div className="catalog-product-price-row">
                        <span className="catalog-product-price">
                            <small>
                                C$
                            </small>

                            {precioVenta.toFixed(
                                2
                            )}
                        </span>

                        {esOferta && (
                            <span className="catalog-product-old-price">
                                C$
                                {precioOriginal.toFixed(
                                    2
                                )}
                            </span>
                        )}
                    </div>

                    {!estaAgotado &&
                        stock <= 5 && (
                            <div className="catalog-stock-container">
                                <div className="catalog-stock-bar">
                                    <span
                                        style={{
                                            width: `${Math.min(
                                                Math.max(
                                                    (
                                                        stock /
                                                        10
                                                    ) *
                                                        100,
                                                    8
                                                ),
                                                100
                                            )}%`
                                        }}
                                    ></span>
                                </div>

                                <small>
                                    <i className="bi bi-fire"></i>
                                    Solo quedan{" "}
                                    {stock}
                                </small>
                            </div>
                        )}

                    <button
                        type="button"
                        className={`catalog-add-button ${
                            esMiProducto ||
                            estaAgotado
                                ? "disabled"
                                : ""
                        }`}
                        onClick={
                            manejarCompra
                        }
                        disabled={
                            esMiProducto ||
                            estaAgotado
                        }
                    >
                        <i
                            className={`bi bi-${iconoBoton}`}
                        ></i>

                        <span>
                            {
                                textoBoton
                            }
                        </span>
                    </button>
                </div>
            </div>
        </article>
    );
};

export default TarjetaCatalogo;
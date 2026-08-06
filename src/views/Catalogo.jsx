import React, { useEffect, useState } from "react";
import {
    Container,
    Row,
    Col,
    Spinner
} from "react-bootstrap";

import { supabase } from "../database/supabaseconfig";
import { useAuth } from "../context/AuthContext";

import TarjetaCatalogo from "../components/catalogo/TarjetaCatalogo";
import TarjetaCatalogoMovile from "../components/catalogo/TarjetaCatalogoMovile";
import CarritoModal from "../components/catalogo/CarritoModal";
import ModalMensaje from "../components/catalogo/ModalMensaje";
import ModalDetalleProducto from "../components/catalogo/ModalDetalleProducto";
import ModalPostCompra from "../components/catalogo/ModalPostCompra";

function Catalogo() {
    const { user } = useAuth();

    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);

    const [cargando, setCargando] = useState(true);
    const [cargandoMas, setCargandoMas] = useState(false);

    const [pagina, setPagina] = useState(0);
    const [hayMas, setHayMas] = useState(true);

    const [busqueda, setBusqueda] = useState("");
    const [busquedaDebounced, setBusquedaDebounced] = useState("");

    const [sugerencias, setSugerencias] = useState([]);
    const [mostrarSugerencias, setMostrarSugerencias] =
        useState(false);

    const [mostrarSoloOfertas, setMostrarSoloOfertas] =
        useState(false);

    const [categoriaSeleccionada, setCategoriaSeleccionada] =
        useState(null);

    const [carrito, setCarrito] = useState([]);
    const [mostrarCarrito, setMostrarCarrito] = useState(false);

    const [mostrarModalMensaje, setMostrarModalMensaje] =
        useState(false);

    const [mostrarModalDetalle, setMostrarModalDetalle] =
        useState(false);

    const [mostrarModalPostCompra, setMostrarModalPostCompra] =
        useState(false);

    const [productoSeleccionado, setProductoSeleccionado] =
        useState(null);

    const [
        itemsCompradosRecientemente,
        setItemsCompradosRecientemente
    ] = useState([]);

    const [miTiendaId, setMiTiendaId] = useState(null);

    const [esMovil, setEsMovil] = useState(
        window.innerWidth < 768
    );

    const ITEMS_POR_PAGINA = 12;

    useEffect(() => {
        const manejarResize = () => {
            setEsMovil(window.innerWidth < 768);
        };

        window.addEventListener("resize", manejarResize);

        return () => {
            window.removeEventListener(
                "resize",
                manejarResize
            );
        };
    }, []);

    useEffect(() => {
        const carritoGuardado = JSON.parse(
            localStorage.getItem("carrito") || "[]"
        );

        setCarrito(carritoGuardado);

        const abrirCarrito = () => {
            setMostrarCarrito(true);
        };

        window.addEventListener(
            "abrirCarrito",
            abrirCarrito
        );

        return () => {
            window.removeEventListener(
                "abrirCarrito",
                abrirCarrito
            );
        };
    }, []);

    useEffect(() => {
        const temporizador = setTimeout(() => {
            setBusquedaDebounced(
                busqueda.trim()
            );

            setPagina(0);
        }, 450);

        return () => {
            clearTimeout(temporizador);
        };
    }, [busqueda]);

    useEffect(() => {
        const cargarSugerencias = async () => {
            if (busqueda.trim().length < 2) {
                setSugerencias([]);
                setMostrarSugerencias(false);
                return;
            }

            const { data, error } = await supabase
                .from("productos")
                .select(
                    "id_producto, nombre_producto, imagen_url, precio_venta"
                )
                .ilike(
                    "nombre_producto",
                    `%${busqueda.trim()}%`
                )
                .limit(5);

            if (error) {
                console.error(
                    "Error cargando sugerencias:",
                    error
                );

                return;
            }

            setSugerencias(data || []);
            setMostrarSugerencias(true);
        };

        cargarSugerencias();
    }, [busqueda]);

    const cargarProductos = async (
        paginaSolicitada = 0,
        nuevaCarga = false
    ) => {
        try {
            if (nuevaCarga) {
                setCargando(true);
            } else {
                setCargandoMas(true);
            }

            const desde =
                paginaSolicitada *
                ITEMS_POR_PAGINA;

            const hasta =
                desde +
                ITEMS_POR_PAGINA -
                1;

            let consulta = supabase
                .from("productos")
                .select(`
                    *,
                    categorias (
                        nombre_categoria
                    ),
                    tiendas (
                        nombre_tienda,
                        perfiles (
                            usuarios (
                                username
                            )
                        )
                    )
                `)
                .order(
                    "creado_en",
                    {
                        ascending: false
                    }
                )
                .range(desde, hasta);

            if (busquedaDebounced) {
                consulta = consulta.ilike(
                    "nombre_producto",
                    `%${busquedaDebounced}%`
                );
            }

            if (categoriaSeleccionada) {
                consulta = consulta.eq(
                    "categoria_id",
                    categoriaSeleccionada
                );
            }

            if (mostrarSoloOfertas) {
                consulta = consulta
                    .not(
                        "precio_original",
                        "is",
                        null
                    )
                    .gt(
                        "precio_original",
                        0
                    );
            }

            const { data, error } =
                await consulta;

            if (error) {
                throw error;
            }

            const resultados =
                data || [];

            if (nuevaCarga) {
                setProductos(resultados);
            } else {
                setProductos(
                    (anteriores) => [
                        ...anteriores,
                        ...resultados
                    ]
                );
            }

            setHayMas(
                resultados.length ===
                    ITEMS_POR_PAGINA
            );

            setPagina(
                paginaSolicitada
            );
        } catch (error) {
            console.error(
                "Error al cargar productos:",
                error
            );
        } finally {
            setCargando(false);
            setCargandoMas(false);
        }
    };

    const cargarCategorias = async () => {
        const { data, error } = await supabase
            .from("categorias")
            .select("*")
            .order(
                "nombre_categoria",
                {
                    ascending: true
                }
            );

        if (error) {
            console.error(
                "Error cargando categorías:",
                error
            );

            return;
        }

        setCategorias(data || []);
    };

    const cargarTiendaUsuario = async () => {
        if (!user?.id) {
            setMiTiendaId(null);
            return;
        }

        const { data, error } = await supabase
            .from("perfiles")
            .select("id_tienda")
            .eq(
                "id_usuario",
                user.id
            )
            .maybeSingle();

        if (error) {
            console.error(
                "Error cargando tienda:",
                error
            );

            return;
        }

        setMiTiendaId(
            data?.id_tienda || null
        );
    };

    useEffect(() => {
        const inicializar = async () => {
            await Promise.all([
                cargarCategorias(),
                cargarTiendaUsuario()
            ]);

            await cargarProductos(
                0,
                true
            );
        };

        inicializar();
    }, [
        user?.id,
        busquedaDebounced,
        mostrarSoloOfertas,
        categoriaSeleccionada
    ]);

    const abrirModalContacto = (
        producto
    ) => {
        setProductoSeleccionado(
            producto
        );

        setMostrarModalMensaje(true);
    };

    const abrirModalDetalles = (
        producto
    ) => {
        setProductoSeleccionado(
            producto
        );

        setMostrarModalDetalle(true);
    };

    const handleCompraExitosa = (
        itemsComprados
    ) => {
        setItemsCompradosRecientemente(
            itemsComprados
        );

        setMostrarModalPostCompra(true);
    };

    const actualizarCarritoGlobal = (
        nuevoCarrito
    ) => {
        setCarrito(nuevoCarrito);

        localStorage.setItem(
            "carrito",
            JSON.stringify(nuevoCarrito)
        );

        window.dispatchEvent(
            new Event(
                "carritoActualizado"
            )
        );
    };

    const mostrarToastCarrito = (
        producto
    ) => {
        const toast =
            document.createElement(
                "div"
            );

        toast.className =
            "catalogo-toast-carrito";

        const variante = [
            producto.talla_seleccionada,
            producto.color_seleccionado
        ]
            .filter(Boolean)
            .join(" / ");

        toast.innerHTML = `
            <div class="catalogo-toast-content">
                <span class="catalogo-toast-icon">
                    <i class="bi bi-cart-check-fill"></i>
                </span>

                <span class="catalogo-toast-text">
                    <strong>Añadido al carrito</strong>

                    <small>
                        ${producto.nombre_producto}
                        ${
                            variante
                                ? ` (${variante})`
                                : ""
                        }
                    </small>
                </span>
            </div>
        `;

        document.body.appendChild(
            toast
        );

        requestAnimationFrame(() => {
            toast.classList.add(
                "visible"
            );
        });

        setTimeout(() => {
            toast.classList.remove(
                "visible"
            );

            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 2600);
    };

    const agregarAlCarrito = (
        producto
    ) => {
        const existente =
            carrito.find(
                (item) =>
                    item.id_producto ===
                        producto.id_producto &&
                    item.talla_seleccionada ===
                        producto.talla_seleccionada &&
                    item.color_seleccionado ===
                        producto.color_seleccionado
            );

        let nuevoCarrito;

        if (existente) {
            nuevoCarrito = carrito.map(
                (item) => {
                    const esMismo =
                        item.id_producto ===
                            producto.id_producto &&
                        item.talla_seleccionada ===
                            producto.talla_seleccionada &&
                        item.color_seleccionado ===
                            producto.color_seleccionado;

                    if (!esMismo) {
                        return item;
                    }

                    return {
                        ...item,
                        cantidad:
                            (
                                item.cantidad ||
                                1
                            ) + 1
                    };
                }
            );
        } else {
            nuevoCarrito = [
                ...carrito,
                {
                    ...producto,
                    cantidad: 1
                }
            ];
        }

        actualizarCarritoGlobal(
            nuevoCarrito
        );

        mostrarToastCarrito(
            producto
        );
    };

    const cantidadCarrito =
        carrito.reduce(
            (
                total,
                producto
            ) =>
                total +
                (
                    producto.cantidad ||
                    1
                ),
            0
        );

    const totalCarrito =
        carrito.reduce(
            (
                total,
                producto
            ) =>
                total +
                parseFloat(
                    producto.precio_venta ||
                        0
                ) *
                    (
                        producto.cantidad ||
                        1
                    ),
            0
        );

    const seleccionarSugerencia = (
        producto
    ) => {
        setBusqueda(
            producto.nombre_producto
        );

        setMostrarSugerencias(false);

        abrirModalDetalles(
            producto
        );
    };

    const cargarSiguientePagina =
        () => {
            if (
                cargandoMas ||
                !hayMas
            ) {
                return;
            }

            cargarProductos(
                pagina + 1,
                false
            );
        };

    return (
        <main className="catalogo-pwa">
            <Container
                fluid="lg"
                className="catalogo-pwa-container"
            >
                <section className="catalogo-top-glass">
                    <div className="catalogo-welcome-row">
                        <div className="catalogo-welcome">
                            <div className="catalogo-welcome-icon">
                                <i className="bi bi-shop-window"></i>
                            </div>

                            <div>
                                <h1>
                                    Descubre
                                </h1>

                                <p>
                                    Encuentra productos de nuestra comunidad
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            className={`catalogo-cart-circle ${
                                cantidadCarrito >
                                0
                                    ? "has-items"
                                    : ""
                            }`}
                            onClick={() =>
                                setMostrarCarrito(
                                    true
                                )
                            }
                            aria-label="Abrir carrito"
                        >
                            <i className="bi bi-cart3"></i>

                            {cantidadCarrito >
                                0 && (
                                <span className="catalogo-cart-count">
                                    {
                                        cantidadCarrito
                                    }
                                </span>
                            )}
                        </button>
                    </div>

                    <div className="catalogo-search-wrapper">
                        <div className="catalogo-search-glass">
                            <i className="bi bi-search"></i>

                            <input
                                type="search"
                                placeholder="¿Qué estás buscando hoy?"
                                value={
                                    busqueda
                                }
                                onChange={(
                                    event
                                ) =>
                                    setBusqueda(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                onFocus={() => {
                                    if (
                                        busqueda
                                            .trim()
                                            .length >
                                        1
                                    ) {
                                        setMostrarSugerencias(
                                            true
                                        );
                                    }
                                }}
                                onBlur={() => {
                                    setTimeout(
                                        () =>
                                            setMostrarSugerencias(
                                                false
                                            ),
                                        180
                                    );
                                }}
                            />

                            {busqueda && (
                                <button
                                    type="button"
                                    className="catalogo-search-clear"
                                    onClick={() =>
                                        setBusqueda(
                                            ""
                                        )
                                    }
                                    aria-label="Limpiar búsqueda"
                                >
                                    <i className="bi bi-x-circle-fill"></i>
                                </button>
                            )}
                        </div>

                        {mostrarSugerencias &&
                            sugerencias.length >
                                0 && (
                                <div className="catalogo-suggestions-glass">
                                    {sugerencias.map(
                                        (
                                            producto
                                        ) => (
                                            <button
                                                type="button"
                                                key={
                                                    producto.id_producto
                                                }
                                                className="catalogo-suggestion"
                                                onMouseDown={() =>
                                                    seleccionarSugerencia(
                                                        producto
                                                    )
                                                }
                                            >
                                                <img
                                                    src={
                                                        producto
                                                            .imagen_url?.[0] ||
                                                        "https://via.placeholder.com/80?text=Sin+Imagen"
                                                    }
                                                    alt={
                                                        producto.nombre_producto
                                                    }
                                                />

                                                <span className="catalogo-suggestion-info">
                                                    <strong>
                                                        {
                                                            producto.nombre_producto
                                                        }
                                                    </strong>

                                                    <small>
                                                        C${" "}
                                                        {parseFloat(
                                                            producto.precio_venta ||
                                                                0
                                                        ).toFixed(
                                                            2
                                                        )}
                                                    </small>
                                                </span>

                                                <i className="bi bi-chevron-right"></i>
                                            </button>
                                        )
                                    )}
                                </div>
                            )}
                    </div>
                </section>

                <section className="catalogo-categories-section">
                    <div className="catalogo-section-heading">
                        <div>
                            <span className="catalogo-section-eyebrow">
                                Categorías
                            </span>

                            <h2>
                                Explorar productos
                            </h2>
                        </div>

                        {categoriaSeleccionada && (
                            <button
                                type="button"
                                className="catalogo-link-button"
                                onClick={() =>
                                    setCategoriaSeleccionada(
                                        null
                                    )
                                }
                            >
                                Ver todas
                            </button>
                        )}
                    </div>

                    <div className="catalogo-categories-scroll">
                        <button
                            type="button"
                            className={`catalogo-category-glass ${
                                !categoriaSeleccionada
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                setCategoriaSeleccionada(
                                    null
                                )
                            }
                        >
                            <span className="catalogo-category-icon">
                                <i className="bi bi-grid-fill"></i>
                            </span>

                            <span>
                                Todas
                            </span>
                        </button>

                        {categorias.map(
                            (
                                categoria
                            ) => (
                                <button
                                    type="button"
                                    key={
                                        categoria.id_categoria
                                    }
                                    className={`catalogo-category-glass ${
                                        categoriaSeleccionada ===
                                        categoria.id_categoria
                                            ? "active"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        setCategoriaSeleccionada(
                                            categoria.id_categoria
                                        )
                                    }
                                >
                                    <span className="catalogo-category-icon">
                                        <i className="bi bi-tag-fill"></i>
                                    </span>

                                    <span>
                                        {
                                            categoria.nombre_categoria
                                        }
                                    </span>
                                </button>
                            )
                        )}
                    </div>
                </section>

                <section className="catalogo-offer-banner">
                    <div className="catalogo-offer-content">
                        <span className="catalogo-offer-badge">
                            <i className="bi bi-stars"></i>
                            Ofertas especiales
                        </span>

                        <h2>
                            Temporada de ahorro
                        </h2>

                        <p>
                            Encuentra descuentos especiales en tus categorías favoritas.
                        </p>

                        <button
                            type="button"
                            className={`catalogo-offer-button ${
                                mostrarSoloOfertas
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                setMostrarSoloOfertas(
                                    (
                                        valor
                                    ) =>
                                        !valor
                                )
                            }
                        >
                            <i
                                className={`bi ${
                                    mostrarSoloOfertas
                                        ? "bi-grid-fill"
                                        : "bi-percent"
                                }`}
                            ></i>

                            {mostrarSoloOfertas
                                ? "Ver todos"
                                : "Ver ofertas"}
                        </button>
                    </div>

                    <div
                        className="catalogo-offer-orb orb-one"
                        aria-hidden="true"
                    ></div>

                    <div
                        className="catalogo-offer-orb orb-two"
                        aria-hidden="true"
                    ></div>
                </section>

                <section className="catalogo-products-section">
                    <div className="catalogo-section-heading">
                        <div>
                            <span className="catalogo-section-eyebrow">
                                Catálogo
                            </span>

                            <h2>
                                Productos disponibles
                            </h2>
                        </div>

                        <span className="catalogo-products-count">
                            {
                                productos.length
                            }{" "}
                            productos
                        </span>
                    </div>

                    {cargando ? (
                        <div className="catalogo-loading">
                            <span className="catalogo-loading-glass">
                                <Spinner
                                    animation="border"
                                    size="sm"
                                />

                                <span>
                                    Preparando catálogo...
                                </span>
                            </span>
                        </div>
                    ) : productos.length ===
                      0 ? (
                        <div className="catalogo-empty-glass">
                            <i className="bi bi-box-seam"></i>

                            <h3>
                                No se encontraron productos
                            </h3>

                            <p>
                                Prueba otra búsqueda o selecciona una categoría diferente.
                            </p>
                        </div>
                    ) : (
                        <>
                            <Row className="catalogo-products-grid">
                                {productos.map(
                                    (
                                        producto
                                    ) => (
                                        <Col
                                            key={
                                                producto.id_producto
                                            }
                                            xs={
                                                6
                                            }
                                            sm={
                                                6
                                            }
                                            md={
                                                4
                                            }
                                            lg={
                                                3
                                            }
                                            xl={
                                                3
                                            }
                                            className="catalogo-product-column"
                                        >
                                            {esMovil ? (
                                                <TarjetaCatalogoMovile
                                                    producto={
                                                        producto
                                                    }
                                                    abrirModalDetalles={
                                                        abrirModalDetalles
                                                    }
                                                    agregarAlCarrito={
                                                        agregarAlCarrito
                                                    }
                                                    miTiendaId={
                                                        miTiendaId
                                                    }
                                                />
                                            ) : (
                                                <TarjetaCatalogo
                                                    producto={
                                                        producto
                                                    }
                                                    abrirModalDetalles={
                                                        abrirModalDetalles
                                                    }
                                                    abrirModalContacto={
                                                        abrirModalContacto
                                                    }
                                                    agregarAlCarrito={
                                                        agregarAlCarrito
                                                    }
                                                    miTiendaId={
                                                        miTiendaId
                                                    }
                                                />
                                            )}
                                        </Col>
                                    )
                                )}
                            </Row>

                            {hayMas && (
                                <div className="catalogo-load-more-wrapper">
                                    <button
                                        type="button"
                                        className="catalogo-load-more"
                                        onClick={
                                            cargarSiguientePagina
                                        }
                                        disabled={
                                            cargandoMas
                                        }
                                    >
                                        {cargandoMas ? (
                                            <>
                                                <Spinner
                                                    animation="border"
                                                    size="sm"
                                                />

                                                Cargando...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-plus-circle"></i>
                                                Ver más productos
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </section>
            </Container>

            <CarritoModal
                mostrar={
                    mostrarCarrito
                }
                setMostrar={
                    setMostrarCarrito
                }
                carrito={carrito}
                setCarrito={
                    actualizarCarritoGlobal
                }
                total={
                    totalCarrito
                }
                onCompraExitosa={
                    handleCompraExitosa
                }
            />

            <ModalMensaje
                mostrar={
                    mostrarModalMensaje
                }
                setMostrar={
                    setMostrarModalMensaje
                }
                producto={
                    productoSeleccionado
                }
            />

            <ModalDetalleProducto
                mostrar={
                    mostrarModalDetalle
                }
                setMostrar={
                    setMostrarModalDetalle
                }
                producto={
                    productoSeleccionado
                }
                agregarAlCarrito={
                    agregarAlCarrito
                }
            />

            <ModalPostCompra
                mostrar={
                    mostrarModalPostCompra
                }
                setMostrar={
                    setMostrarModalPostCompra
                }
                items={
                    itemsCompradosRecientemente
                }
                alCalificar={
                    abrirModalDetalles
                }
            />
        </main>
    );
}

export default Catalogo;
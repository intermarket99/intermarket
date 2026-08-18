import React, { useEffect, useState } from "react";
import {
    Container,
    Row,
    Col,
    Spinner
} from "react-bootstrap";
import { useSearchParams } from "react-router-dom";

import { supabase } from "../database/supabaseconfig";
import { useAuth } from "../context/AuthContext";
import { leerCarritoGuardado, guardarCarrito } from "../utils/carritoStorage";

import TarjetaCatalogo from "../components/catalogo/TarjetaCatalogo";
import TarjetaCatalogoMovile from "../components/catalogo/TarjetaCatalogoMovile";
import CarritoModal from "../components/catalogo/CarritoModal";
import ModalMensaje from "../components/catalogo/ModalMensaje";
import ModalDetalleProducto from "../components/catalogo/ModalDetalleProducto";
import ModalPostCompra from "../components/catalogo/ModalPostCompra";

function Catalogo() {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);

    const [cargando, setCargando] = useState(true);
    const [cargandoMas, setCargandoMas] = useState(false);

    const [pagina, setPagina] = useState(0);
    const [hayMas, setHayMas] = useState(true);

    const [busqueda, setBusqueda] = useState("");
    const [busquedaDebounced, setBusquedaDebounced] = useState("");

    const [sugerencias, setSugerencias] = useState([]);
    const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

    const [mostrarSoloOfertas, setMostrarSoloOfertas] = useState(false);

    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
    const [tallaSeleccionada, setTallaSeleccionada] = useState("");
    const [colorSeleccionado, setColorSeleccionado] = useState("");
    const [tallasDisponibles, setTallasDisponibles] = useState([]);
    const [coloresDisponibles, setColoresDisponibles] = useState([]);
    const [filtroAbierto, setFiltroAbierto] = useState(null);

    const [carrito, setCarrito] = useState([]);
    const [mostrarCarrito, setMostrarCarrito] = useState(false);

    const [mostrarModalMensaje, setMostrarModalMensaje] = useState(false);
    const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);
    const [mostrarModalPostCompra, setMostrarModalPostCompra] = useState(false);

    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [itemsCompradosRecientemente, setItemsCompradosRecientemente] = useState([]);
    const [miTiendaId, setMiTiendaId] = useState(null);

    const [esMovil, setEsMovil] = useState(window.innerWidth < 768);

    // Evita reabrir el mismo producto del QR muchas veces
    const [productoQrProcesado, setProductoQrProcesado] = useState(null);

    const ITEMS_POR_PAGINA = 12;

    useEffect(() => {
        const manejarResize = () => {
            setEsMovil(window.innerWidth < 768);
        };
        window.addEventListener("resize", manejarResize);
        return () => {
            window.removeEventListener("resize", manejarResize);
        };
    }, []);

    useEffect(() => {
        const carritoGuardado = leerCarritoGuardado(user?.id);
        setCarrito(carritoGuardado);

        const abrirCarrito = () => {
            setMostrarCarrito(true);
        };
        window.addEventListener("abrirCarrito", abrirCarrito);
        return () => {
            window.removeEventListener("abrirCarrito", abrirCarrito);
        };
    }, [user?.id]);

    useEffect(() => {
        const temporizador = setTimeout(() => {
            setBusquedaDebounced(busqueda.trim());
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
                .select("id_producto, nombre_producto, imagen_url, precio_venta")
                .ilike("nombre_producto", `%${busqueda.trim()}%`)
                .limit(5);

            if (error) {
                console.error("Error cargando sugerencias:", error);
                return;
            }
            setSugerencias(data || []);
            setMostrarSugerencias(true);
        };
        cargarSugerencias();
    }, [busqueda]);

    // ============================================================
    // ABRIR PRODUCTO DESDE QR / ENLACE COMPARTIDO
    // URL: /catalogo?producto={id_producto}
    // ============================================================
    useEffect(() => {
        const productoUrlId = searchParams.get("producto");
        if (!productoUrlId) return;
        if (productoQrProcesado === productoUrlId) return;

        const abrirDesdeUrl = async () => {
            try {
                // 1) Buscar en la lista ya cargada
                const enLista = productos.find(
                    (p) => String(p.id_producto) === String(productoUrlId)
                );

                if (enLista) {
                    setProductoSeleccionado(enLista);
                    setMostrarModalDetalle(true);
                    setProductoQrProcesado(productoUrlId);
                    return;
                }

                // 2) Si no está en la página actual, traerlo de Supabase
                const { data, error } = await supabase
                    .from("productos")
                    .select(`
                        *,
                        categorias (nombre_categoria),
                        tiendas (
                            nombre_tienda,
                            imagen_url,
                            perfiles (usuarios (username))
                        )
                    `)
                    .eq("id_producto", productoUrlId)
                    .maybeSingle();

                if (error) {
                    console.error("Error al abrir producto desde QR:", error);
                    return;
                }

                if (data) {
                    setProductoSeleccionado(data);
                    setMostrarModalDetalle(true);
                    setProductoQrProcesado(productoUrlId);
                }
            } catch (err) {
                console.error("Error procesando enlace del producto:", err);
            }
        };

        abrirDesdeUrl();
    }, [searchParams, productos, productoQrProcesado]);

    // Al cerrar el modal, limpia el query param para no reabrir al refrescar
    const cerrarModalDetalle = (valor) => {
        setMostrarModalDetalle(valor);
        if (valor === false && searchParams.get("producto")) {
            const nuevos = new URLSearchParams(searchParams);
            nuevos.delete("producto");
            setSearchParams(nuevos, { replace: true });
        }
    };

    const cargarProductos = async (paginaSolicitada = 0, nuevaCarga = false) => {
        try {
            if (nuevaCarga) {
                setCargando(true);
            } else {
                setCargandoMas(true);
            }

            const desde = paginaSolicitada * ITEMS_POR_PAGINA;
            const hasta = desde + ITEMS_POR_PAGINA - 1;

            let consulta = supabase
                .from("productos")
                .select(`
                    *,
                    categorias (nombre_categoria),
                    tiendas (
                        nombre_tienda,
                        perfiles (usuarios (username))
                    )
                `)
                .order("creado_en", { ascending: false })
                .range(desde, hasta);

            if (busquedaDebounced) {
                consulta = consulta.ilike("nombre_producto", `%${busquedaDebounced}%`);
            }
            if (categoriaSeleccionada) {
                consulta = consulta.eq("categoria_id", categoriaSeleccionada);
            }

            if (tallaSeleccionada) {
                consulta = consulta.contains("tallas", [tallaSeleccionada]);
            }

            if (colorSeleccionado) {
                consulta = consulta.contains("colores", [colorSeleccionado]);
            }

            if (mostrarSoloOfertas) {
                consulta = consulta.not("precio_original", "is", null).gt("precio_original", 0);
            }

            const { data, error } = await consulta;
            if (error) throw error;

            const resultados = data || [];
            if (nuevaCarga) {
                setProductos(resultados);
            } else {
                setProductos((anteriores) => [...anteriores, ...resultados]);
            }
            setHayMas(resultados.length === ITEMS_POR_PAGINA);
            setPagina(paginaSolicitada);
        } catch (error) {
            console.error("Error al cargar productos:", error);
        } finally {
            setCargando(false);
            setCargandoMas(false);
        }
    };

    const normalizarArray = (valor) => {
        if (!valor) return [];
        if (Array.isArray(valor)) return valor.filter(Boolean);

        if (typeof valor === "string") {
            if (valor.startsWith("{") && valor.endsWith("}")) {
                return valor
                    .slice(1, -1)
                    .split(",")
                    .map((item) => item.trim().replace(/^"|"$/g, ""))
                    .filter(Boolean);
            }

            return valor
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);
        }

        return [];
    };

    const cargarOpcionesFiltros = async () => {
        const { data, error } = await supabase
            .from("productos")
            .select("tallas, colores");

        if (error) {
            console.error("Error cargando tallas y colores:", error);
            return;
        }

        const conjuntoTallas = new Set();
        const conjuntoColores = new Set();

        (data || []).forEach((producto) => {
            normalizarArray(producto.tallas).forEach((talla) => {
                conjuntoTallas.add(talla);
            });

            normalizarArray(producto.colores).forEach((color) => {
                conjuntoColores.add(color);
            });
        });

        const ordenarNatural = (a, b) =>
            a.localeCompare(b, "es", {
                numeric: true,
                sensitivity: "base"
            });

        setTallasDisponibles(
            [...conjuntoTallas].sort(ordenarNatural)
        );

        setColoresDisponibles(
            [...conjuntoColores].sort(ordenarNatural)
        );
    };

    const cargarCategorias = async () => {
        const { data, error } = await supabase
            .from("categorias")
            .select("*")
            .order("nombre_categoria", { ascending: true });

        if (error) {
            console.error("Error cargando categorías:", error);
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
            .eq("id_usuario", user.id)
            .maybeSingle();

        if (error) {
            console.error("Error cargando tienda:", error);
            return;
        }
        setMiTiendaId(data?.id_tienda || null);
    };

    useEffect(() => {
        const inicializar = async () => {
            await Promise.all([
                cargarCategorias(),
                cargarOpcionesFiltros(),
                cargarTiendaUsuario()
            ]);
            await cargarProductos(0, true);
        };
        inicializar();
    }, [user?.id, busquedaDebounced, mostrarSoloOfertas, categoriaSeleccionada, tallaSeleccionada, colorSeleccionado]);

    const abrirModalContacto = (producto) => {
        setProductoSeleccionado(producto);
        setMostrarModalMensaje(true);
    };

    const abrirModalDetalles = (producto) => {
        setProductoSeleccionado(producto);
        setMostrarModalDetalle(true);
    };

    const handleCompraExitosa = (itemsComprados) => {
        setItemsCompradosRecientemente(itemsComprados);
        setMostrarModalPostCompra(true);
    };

    const actualizarCarritoGlobal = (nuevoCarrito) => {
        setCarrito(nuevoCarrito);
        guardarCarrito(user?.id, nuevoCarrito);
        window.dispatchEvent(new Event("carritoActualizado"));
    };

    const mostrarToastCarrito = (producto) => {
        const toast = document.createElement("div");
        toast.className = "catalogo-toast-carrito";

        const variante = [producto.talla_seleccionada, producto.color_seleccionado].filter(Boolean).join(" / ");

        toast.innerHTML = `
            <div class="catalogo-toast-content">
                <span class="catalogo-toast-icon">
                    <i class="bi bi-cart-check-fill"></i>
                </span>
                <span class="catalogo-toast-text">
                    <strong>Añadido al carrito</strong>
                    <small>${producto.nombre_producto} ${variante ? ` (${variante})` : ""}</small>
                </span>
            </div>
        `;

        document.body.appendChild(toast);
        requestAnimationFrame(() => {
            toast.classList.add("visible");
        });
        setTimeout(() => {
            toast.classList.remove("visible");
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 2600);
    };

    const agregarAlCarrito = (producto) => {
        const existente = carrito.find(
            (item) =>
                item.id_producto === producto.id_producto &&
                item.talla_seleccionada === producto.talla_seleccionada &&
                item.color_seleccionado === producto.color_seleccionado
        );

        let nuevoCarrito;
        if (existente) {
            nuevoCarrito = carrito.map((item) => {
                const esMismo =
                    item.id_producto === producto.id_producto &&
                    item.talla_seleccionada === producto.talla_seleccionada &&
                    item.color_seleccionado === producto.color_seleccionado;

                if (!esMismo) return item;
                return {
                    ...item,
                    cantidad: (item.cantidad || 1) + 1
                };
            });
        } else {
            nuevoCarrito = [
                ...carrito,
                {
                    ...producto,
                    cantidad: 1
                }
            ];
        }

        actualizarCarritoGlobal(nuevoCarrito);
        mostrarToastCarrito(producto);
    };

    const cantidadCarrito = carrito.reduce((total, producto) => total + (producto.cantidad || 1), 0);
    const totalCarrito = carrito.reduce(
        (total, producto) => total + parseFloat(producto.precio_venta || 0) * (producto.cantidad || 1),
        0
    );

    const seleccionarSugerencia = (producto) => {
        setBusqueda(producto.nombre_producto);
        setMostrarSugerencias(false);
        abrirModalDetalles(producto);
    };

    const cargarSiguientePagina = () => {
        if (cargandoMas || !hayMas) return;
        cargarProductos(pagina + 1, false);
    };

    return (
        <main className="catalogo-pwa">
            <style>{`
                .catalogo-quick-filters {
                    margin-top: -0.25rem;
                    margin-bottom: 1.05rem;
                }

                .catalogo-quick-filter-bar {
                    display: flex;
                    align-items: center;
                    gap: 0.55rem;
                    overflow-x: auto;
                    padding: 0.15rem 0 0.5rem;
                    scrollbar-width: none;
                }

                .catalogo-quick-filter-bar::-webkit-scrollbar {
                    display: none;
                }

                .catalogo-quick-filter-btn {
                    flex: 0 0 auto;
                    min-height: 38px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.55rem 0.9rem;
                    border: 1px solid rgba(120, 120, 120, 0.18);
                    border-radius: 999px;
                    background: rgba(255, 255, 255, 0.7);
                    color: inherit;
                    font-size: 0.82rem;
                    font-weight: 650;
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
                    transition:
                        transform 0.16s ease,
                        border-color 0.16s ease,
                        background 0.16s ease,
                        box-shadow 0.16s ease;
                    white-space: nowrap;
                }

                .catalogo-quick-filter-btn:hover {
                    transform: translateY(-1px);
                    border-color: rgba(92, 82, 210, 0.35);
                }

                .catalogo-quick-filter-btn.active {
                    background: rgba(86, 76, 210, 0.12);
                    border-color: rgba(86, 76, 210, 0.35);
                    box-shadow: 0 6px 16px rgba(86, 76, 210, 0.08);
                }

                .catalogo-quick-filter-clear {
                    opacity: 0.78;
                }

                .catalogo-quick-filter-options {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    overflow-x: auto;
                    padding: 0.75rem 0.05rem 0.25rem;
                    margin-top: -0.15rem;
                    border-top: 1px solid rgba(120, 120, 120, 0.1);
                    scrollbar-width: none;
                    animation: catalogoFilterReveal 0.18s ease;
                }

                .catalogo-quick-filter-options::-webkit-scrollbar {
                    display: none;
                }

                @keyframes catalogoFilterReveal {
                    from {
                        opacity: 0;
                        transform: translateY(-4px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .catalogo-filter-option {
                    flex: 0 0 auto;
                    min-width: 42px;
                    min-height: 36px;
                    padding: 0.48rem 0.76rem;
                    border: 1px solid rgba(120, 120, 120, 0.16);
                    border-radius: 10px;
                    background: rgba(255, 255, 255, 0.72);
                    color: inherit;
                    font-size: 0.8rem;
                    font-weight: 600;
                    transition:
                        border-color 0.15s ease,
                        background 0.15s ease,
                        transform 0.15s ease;
                    white-space: nowrap;
                }

                .catalogo-filter-option:hover {
                    transform: translateY(-1px);
                    border-color: rgba(86, 76, 210, 0.3);
                }

                .catalogo-filter-option.active {
                    background: rgba(86, 76, 210, 0.12);
                    border-color: rgba(86, 76, 210, 0.4);
                }

                .catalogo-filter-option-color {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.45rem;
                }

                .catalogo-color-dot {
                    width: 9px;
                    height: 9px;
                    border-radius: 50%;
                    background: currentColor;
                    opacity: 0.55;
                    box-shadow: 0 0 0 2px rgba(120, 120, 120, 0.08);
                }

                @media (max-width: 767.98px) {
                    .catalogo-quick-filters {
                        margin-top: -0.4rem;
                        margin-bottom: 0.85rem;
                    }

                    .catalogo-quick-filter-bar {
                        gap: 0.45rem;
                        padding-bottom: 0.42rem;
                    }

                    .catalogo-quick-filter-btn {
                        min-height: 36px;
                        padding: 0.5rem 0.78rem;
                        font-size: 0.78rem;
                    }

                    .catalogo-quick-filter-options {
                        padding-top: 0.65rem;
                    }

                    .catalogo-filter-option {
                        min-height: 34px;
                        padding: 0.44rem 0.68rem;
                        font-size: 0.76rem;
                    }
                }
            `}</style>
            <Container fluid="lg" className="catalogo-pwa-container">
                <section className="catalogo-top-glass">
                    <div className="catalogo-welcome-row">
                        <div className="catalogo-welcome">
                            <div className="catalogo-welcome-icon">
                                <i className="bi bi-shop-window"></i>
                            </div>
                            <div>
                                <h1>Descubre</h1>
                                <p>Encuentra productos de nuestra comunidad</p>
                            </div>
                        </div>
                    </div>

                    <div className="catalogo-search-wrapper">
                        <div className="catalogo-search-glass">
                            <i className="bi bi-search"></i>
                            <input
                                type="search"
                                placeholder="¿Qué estás buscando hoy?"
                                value={busqueda}
                                onChange={(event) => setBusqueda(event.target.value)}
                                onFocus={() => {
                                    if (busqueda.trim().length > 1) {
                                        setMostrarSugerencias(true);
                                    }
                                }}
                                onBlur={() => {
                                    setTimeout(() => setMostrarSugerencias(false), 180);
                                }}
                            />
                            {busqueda && (
                                <button
                                    type="button"
                                    className="catalogo-search-clear"
                                    onClick={() => setBusqueda("")}
                                    aria-label="Limpiar búsqueda"
                                >
                                    <i className="bi bi-x-circle-fill"></i>
                                </button>
                            )}
                        </div>

                        {mostrarSugerencias && sugerencias.length > 0 && (
                            <div className="catalogo-suggestions-glass">
                                {sugerencias.map((producto) => (
                                    <button
                                        type="button"
                                        key={producto.id_producto}
                                        className="catalogo-suggestion"
                                        onMouseDown={() => seleccionarSugerencia(producto)}
                                    >
                                        <img
                                            src={producto.imagen_url?.[0] || "https://via.placeholder.com/80?text=Sin+Imagen"}
                                            alt={producto.nombre_producto}
                                        />
                                        <span className="catalogo-suggestion-info">
                                            <strong>{producto.nombre_producto}</strong>
                                            <small>C$ {parseFloat(producto.precio_venta || 0).toFixed(2)}</small>
                                        </span>
                                        <i className="bi bi-chevron-right"></i>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <section className="catalogo-categories-section">
                    <div className="catalogo-section-heading">
                        <div>
                            <span className="catalogo-section-eyebrow">Categorías</span>
                            <h2>Explorar productos</h2>
                        </div>
                        {categoriaSeleccionada && (
                            <button
                                type="button"
                                className="catalogo-link-button"
                                onClick={() => setCategoriaSeleccionada(null)}
                            >
                                Ver todas
                            </button>
                        )}
                    </div>

                    <div className="catalogo-categories-scroll">
                        <button
                            type="button"
                            className={`catalogo-category-glass ${!categoriaSeleccionada ? "active" : ""}`}
                            onClick={() => setCategoriaSeleccionada(null)}
                        >
                            <span className="catalogo-category-icon">
                                <i className="bi bi-grid-fill"></i>
                            </span>
                            <span>Todas</span>
                        </button>

                        {categorias.map((categoria) => (
                            <button
                                type="button"
                                key={categoria.id_categoria}
                                className={`catalogo-category-glass ${categoriaSeleccionada === categoria.id_categoria ? "active" : ""}`}
                                onClick={() => setCategoriaSeleccionada(categoria.id_categoria)}
                            >
                                <span className="catalogo-category-icon">
                                    <i className="bi bi-tag-fill"></i>
                                </span>
                                <span>{categoria.nombre_categoria}</span>
                            </button>
                        ))}
                    </div>
                </section>

                <section className="catalogo-quick-filters">
                    <div className="catalogo-quick-filter-bar">
                        <button
                            type="button"
                            className={`catalogo-quick-filter-btn ${tallaSeleccionada ? "active" : ""}`}
                            onClick={() =>
                                setFiltroAbierto((actual) =>
                                    actual === "talla" ? null : "talla"
                                )
                            }
                        >
                            <span>
                                {tallaSeleccionada
                                    ? `Talla: ${tallaSeleccionada}`
                                    : "Talla"}
                            </span>
                            <i
                                className={`bi ${
                                    filtroAbierto === "talla"
                                        ? "bi-chevron-up"
                                        : "bi-chevron-down"
                                }`}
                            ></i>
                        </button>

                        <button
                            type="button"
                            className={`catalogo-quick-filter-btn ${colorSeleccionado ? "active" : ""}`}
                            onClick={() =>
                                setFiltroAbierto((actual) =>
                                    actual === "color" ? null : "color"
                                )
                            }
                        >
                            <span>
                                {colorSeleccionado
                                    ? `Color: ${colorSeleccionado}`
                                    : "Color"}
                            </span>
                            <i
                                className={`bi ${
                                    filtroAbierto === "color"
                                        ? "bi-chevron-up"
                                        : "bi-chevron-down"
                                }`}
                            ></i>
                        </button>

                        <button
                            type="button"
                            className={`catalogo-quick-filter-btn ${mostrarSoloOfertas ? "active" : ""}`}
                            onClick={() => setMostrarSoloOfertas((valor) => !valor)}
                        >
                            <span>Ofertas</span>
                            <i className="bi bi-percent"></i>
                        </button>

                        {(tallaSeleccionada || colorSeleccionado || mostrarSoloOfertas) && (
                            <button
                                type="button"
                                className="catalogo-quick-filter-btn catalogo-quick-filter-clear"
                                onClick={() => {
                                    setTallaSeleccionada("");
                                    setColorSeleccionado("");
                                    setMostrarSoloOfertas(false);
                                    setFiltroAbierto(null);
                                }}
                            >
                                <span>Limpiar</span>
                                <i className="bi bi-x-lg"></i>
                            </button>
                        )}
                    </div>

                    {filtroAbierto === "talla" && (
                        <div className="catalogo-quick-filter-options">
                            <button
                                type="button"
                                className={`catalogo-filter-option ${!tallaSeleccionada ? "active" : ""}`}
                                onClick={() => {
                                    setTallaSeleccionada("");
                                    setFiltroAbierto(null);
                                }}
                            >
                                Todas
                            </button>

                            {tallasDisponibles.map((talla) => (
                                <button
                                    type="button"
                                    key={talla}
                                    className={`catalogo-filter-option ${tallaSeleccionada === talla ? "active" : ""}`}
                                    onClick={() => {
                                        setTallaSeleccionada(talla);
                                        setFiltroAbierto(null);
                                    }}
                                >
                                    {talla}
                                </button>
                            ))}
                        </div>
                    )}

                    {filtroAbierto === "color" && (
                        <div className="catalogo-quick-filter-options catalogo-color-options">
                            <button
                                type="button"
                                className={`catalogo-filter-option ${!colorSeleccionado ? "active" : ""}`}
                                onClick={() => {
                                    setColorSeleccionado("");
                                    setFiltroAbierto(null);
                                }}
                            >
                                Todos
                            </button>

                            {coloresDisponibles.map((color) => (
                                <button
                                    type="button"
                                    key={color}
                                    className={`catalogo-filter-option catalogo-filter-option-color ${colorSeleccionado === color ? "active" : ""}`}
                                    onClick={() => {
                                        setColorSeleccionado(color);
                                        setFiltroAbierto(null);
                                    }}
                                >
                                    <span className="catalogo-color-dot"></span>
                                    {color}
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                <section className="catalogo-offer-banner">
                    <div className="catalogo-offer-content">
                        <span className="catalogo-offer-badge">
                            <i className="bi bi-stars"></i>
                            Ofertas especiales
                        </span>
                        <h2>Temporada de ahorro</h2>
                        <p>Encuentra descuentos especiales en tus categorías favoritas.</p>
                        <button
                            type="button"
                            className={`catalogo-offer-button ${mostrarSoloOfertas ? "active" : ""}`}
                            onClick={() => setMostrarSoloOfertas((valor) => !valor)}
                        >
                            <i className={`bi ${mostrarSoloOfertas ? "bi-grid-fill" : "bi-percent"}`}></i>
                            {mostrarSoloOfertas ? "Ver todos" : "Ver ofertas"}
                        </button>
                    </div>
                    <div className="catalogo-offer-orb orb-one" aria-hidden="true"></div>
                    <div className="catalogo-offer-orb orb-two" aria-hidden="true"></div>
                </section>

                <section className="catalogo-products-section">
                    <div className="catalogo-section-heading">
                        <div>
                            <span className="catalogo-section-eyebrow">Catálogo</span>
                            <h2>Productos disponibles</h2>
                        </div>
                        <span className="catalogo-products-count">{productos.length} productos</span>
                    </div>

                    {cargando ? (
                        <div className="catalogo-loading">
                            <span className="catalogo-loading-glass">
                                <Spinner animation="border" size="sm" />
                                <span>Preparando catálogo...</span>
                            </span>
                        </div>
                    ) : productos.length === 0 ? (
                        <div className="catalogo-empty-glass">
                            <i className="bi bi-box-seam"></i>
                            <h3>No se encontraron productos</h3>
                            <p>Prueba otra búsqueda o cambia la categoría, talla o color seleccionado.</p>
                        </div>
                    ) : (
                        <>
                            <Row className="catalogo-products-grid">
                                {productos.map((producto) => (
                                    <Col
                                        key={producto.id_producto}
                                        xs={6}
                                        sm={6}
                                        md={4}
                                        lg={3}
                                        xl={3}
                                        className="catalogo-product-column"
                                    >
                                        {esMovil ? (
                                            <TarjetaCatalogoMovile
                                                producto={producto}
                                                abrirModalDetalles={abrirModalDetalles}
                                                abrirModalContacto={abrirModalContacto}
                                                agregarAlCarrito={agregarAlCarrito}
                                                miTiendaId={miTiendaId}
                                            />
                                        ) : (
                                            <TarjetaCatalogo
                                                producto={producto}
                                                abrirModalDetalles={abrirModalDetalles}
                                                abrirModalContacto={abrirModalContacto}
                                                agregarAlCarrito={agregarAlCarrito}
                                                miTiendaId={miTiendaId}
                                            />
                                        )}
                                    </Col>
                                ))}
                            </Row>

                            {hayMas && (
                                <div className="catalogo-load-more-wrapper">
                                    <button
                                        type="button"
                                        className="catalogo-load-more"
                                        onClick={cargarSiguientePagina}
                                        disabled={cargandoMas}
                                    >
                                        {cargandoMas ? (
                                            <>
                                                <Spinner animation="border" size="sm" />
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
                mostrar={mostrarCarrito}
                setMostrar={setMostrarCarrito}
                carrito={carrito}
                setCarrito={actualizarCarritoGlobal}
                total={totalCarrito}
                onCompraExitosa={handleCompraExitosa}
            />

            <ModalMensaje
                mostrar={mostrarModalMensaje}
                setMostrar={setMostrarModalMensaje}
                producto={productoSeleccionado}
            />

            <ModalDetalleProducto
                mostrar={mostrarModalDetalle}
                setMostrar={cerrarModalDetalle}
                producto={productoSeleccionado}
                agregarAlCarrito={agregarAlCarrito}
            />

            <ModalPostCompra
                mostrar={mostrarModalPostCompra}
                setMostrar={setMostrarModalPostCompra}
                items={itemsCompradosRecientemente}
                alCalificar={abrirModalDetalles}
            />
        </main>
    );
}

export default Catalogo;
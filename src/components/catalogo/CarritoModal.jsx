import React, { useState } from 'react';
import { Modal, Spinner, Form } from 'react-bootstrap';
import { supabase } from '../../database/supabaseconfig';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';



const limpiarNumeroTarjeta = (valor) => {
    return valor.replace(/\D/g, "").slice(0, 16);
};

const formatearNumeroTarjeta = (valor) => {
    return limpiarNumeroTarjeta(valor)
        .replace(/(\d{4})(?=\d)/g, "$1 ")
        .trim();
};

const formatearVencimiento = (valor) => {
    const limpio = valor.replace(/\D/g, "").slice(0, 4);

    if (limpio.length <= 2) {
        return limpio;
    }

    return `${limpio.slice(0, 2)}/${limpio.slice(2)}`;
};

const detectarTipoTarjeta = (numero) => {
    const limpio = limpiarNumeroTarjeta(numero);

    if (/^4/.test(limpio)) {
        return "visa";
    }

    if (/^(5[1-5]|2[2-7])/.test(limpio)) {
        return "mastercard";
    }

    return "tarjeta";
};

const validarLuhn = (numero) => {
    const limpio = limpiarNumeroTarjeta(numero);

    if (limpio.length < 13) {
        return false;
    }

    let suma = 0;
    let duplicar = false;

    for (let indice = limpio.length - 1; indice >= 0; indice -= 1) {
        let digito = Number(limpio[indice]);

        if (duplicar) {
            digito *= 2;

            if (digito > 9) {
                digito -= 9;
            }
        }

        suma += digito;
        duplicar = !duplicar;
    }

    return suma % 10 === 0;
};

const CarritoModal = ({ mostrar, setMostrar, carrito, setCarrito, total, onCompraExitosa }) => {
    const { user } = useAuth();
    const navegar = useNavigate();
    const [procesando, setProcesando] = useState(false);
    const [direcciones, setDirecciones] = useState([]);
    const [idDireccionSel, setIdDireccionSel] = useState("");
    const [cargandoDirecciones, setCargandoDirecciones] = useState(false);
    const [mostrarPago, setMostrarPago] = useState(false);
    const [numeroTarjeta, setNumeroTarjeta] = useState("");
    const [titular, setTitular] = useState("");
    const [vencimiento, setVencimiento] = useState("");
    const [cvv, setCvv] = useState("");
    const [errorPago, setErrorPago] = useState("");
    const [tarjetaGirando, setTarjetaGirando] = useState(false);


    React.useEffect(() => {
        if (mostrar && user) {
            cargarDirecciones();
        }
    }, [mostrar, user]);

    const cargarDirecciones = async () => {
        setCargandoDirecciones(true);
        try {
            const { data } = await supabase
                .from("direcciones")
                .select("*")
                .eq("id_usuario", user.id)
                .order("creado_en", { ascending: false });
            
            setDirecciones(data || []);
            if (data && data.length > 0) {
                setIdDireccionSel(data[0].id_direccion);
            }
        } catch (err) {
            console.error("Error cargando direcciones:", err);
        } finally {
            setCargandoDirecciones(false);
        }
    };

    const actualizarCantidad = (itemCarrito, nuevaCantidad, stockDisponible) => {
        if (nuevaCantidad < 1) return;
        if (stockDisponible !== undefined && nuevaCantidad > stockDisponible) {
            alert(`Solo hay ${stockDisponible} unidades disponibles.`);
            return;
        }
        const nuevoCarrito = carrito.map(item =>
            (item.id_producto === itemCarrito.id_producto && 
             item.talla_seleccionada === itemCarrito.talla_seleccionada && 
             item.color_seleccionado === itemCarrito.color_seleccionado)
                ? { ...item, cantidad: nuevaCantidad }
                : item
        );
        setCarrito(nuevoCarrito);
    };

    const eliminarDelCarrito = (itemCarrito) => {
        const nuevoCarrito = carrito.filter(item => 
            !(item.id_producto === itemCarrito.id_producto && 
              item.talla_seleccionada === itemCarrito.talla_seleccionada && 
              item.color_seleccionado === itemCarrito.color_seleccionado)
        );
        setCarrito(nuevoCarrito);
    };

    const vaciarCarrito = () => {
        setCarrito([]);
    };

    const asegurarArray = (valor) => {
        if (!valor) return [];
        if (Array.isArray(valor)) return valor;
        if (typeof valor === 'string') {
            if (valor.startsWith('{') && valor.endsWith('}')) {
                return valor.slice(1, -1).split(',').map(s => s.trim().replace(/^"|"$/g, ''));
            }
            return valor.split(',').map(s => s.trim()).filter(s => s !== '');
        }
        return [];
    };

    const cambiarVariante = (itemOriginal, campo, nuevoValor) => {
        const itemActualizado = { ...itemOriginal, [campo]: nuevoValor };
        
        // Buscar si ya existe otro item con las mismas características después del cambio
        const indiceDuplicado = carrito.findIndex(item => 
            item !== itemOriginal &&
            item.id_producto === itemActualizado.id_producto &&
            (campo === 'talla_seleccionada' ? nuevoValor : item.talla_seleccionada) === item.talla_seleccionada &&
            (campo === 'color_seleccionado' ? nuevoValor : item.color_seleccionado) === item.color_seleccionado
        );

        let nuevoCarrito;
        if (indiceDuplicado !== -1) {
            // Si hay duplicado, fusionar cantidades y eliminar el original
            nuevoCarrito = carrito.filter(item => item !== itemOriginal);
            nuevoCarrito[indiceDuplicado] = {
                ...nuevoCarrito[indiceDuplicado],
                cantidad: nuevoCarrito[indiceDuplicado].cantidad + itemOriginal.cantidad
            };
        } else {
            // Si no hay duplicado, solo actualizar el item
            nuevoCarrito = carrito.map(item => 
                item === itemOriginal ? itemActualizado : item
            );
        }

        setCarrito(nuevoCarrito);
    };

    const validarVariantes = () => {
        for (const item of carrito) {
            const tieneTallas = Array.isArray(item.tallas) && item.tallas.length > 0;
            const tieneColores = Array.isArray(item.colores) && item.colores.length > 0;

            if (tieneTallas && !item.talla_seleccionada) {
                alert(`Por favor, selecciona una talla para ${item.nombre_producto}`);
                return false;
            }
            if (tieneColores && !item.color_seleccionado) {
                alert(`Por favor, selecciona un color para ${item.nombre_producto}`);
                return false;
            }
        }
        return true;
    };

    const limpiarFormularioPago = () => {
        setNumeroTarjeta("");
        setTitular("");
        setVencimiento("");
        setCvv("");
        setErrorPago("");
        setTarjetaGirando(false);
    };

    const validarFormularioPago = () => {
        const numeroLimpio = limpiarNumeroTarjeta(numeroTarjeta);

        if (!validarLuhn(numeroLimpio)) {
            throw new Error(
                "El número de tarjeta no es válido. Para pruebas usa 4242 4242 4242 4242."
            );
        }

        if (titular.trim().length < 3) {
            throw new Error("Escribe el nombre del titular.");
        }

        if (!/^\d{2}\/\d{2}$/.test(vencimiento)) {
            throw new Error("El vencimiento debe tener el formato MM/AA.");
        }

        const [mesTexto, anioTexto] = vencimiento.split("/");
        const mes = Number(mesTexto);
        const anio = Number(`20${anioTexto}`);

        if (mes < 1 || mes > 12) {
            throw new Error("El mes de vencimiento no es válido.");
        }

        const ahora = new Date();
        const finDelMes = new Date(anio, mes, 0, 23, 59, 59);

        if (finDelMes < ahora) {
            throw new Error("La tarjeta se encuentra vencida.");
        }

        if (!/^\d{3,4}$/.test(cvv)) {
            throw new Error("El CVV debe contener 3 o 4 números.");
        }
    };

    const registrarMetodoPago = async () => {
        const ultimosCuatro = limpiarNumeroTarjeta(numeroTarjeta).slice(-4);
        const tipoMetodo = detectarTipoTarjeta(numeroTarjeta);

        const { error: metodoError } = await supabase
            .from("metodos_pago")
            .insert({
                id_usuario: user.id,
                id_stripe_customer: null,
                id_stripe_payment_method: null,
                ultimo4: ultimosCuatro,
                tipo_metodo: tipoMetodo
            });

        if (metodoError) {
            throw new Error(
                `No se pudo registrar el método de pago: ${metodoError.message}`
            );
        }
    };

    const abrirPago = () => {
        if (!user?.id) {
            alert("Debes iniciar sesión para realizar una compra.");
            return;
        }

        if (!validarVariantes()) return;

        if (!idDireccionSel) {
            alert("Por favor, selecciona una dirección de entrega.");
            return;
        }

        if (!Array.isArray(carrito) || carrito.length === 0) {
            alert("El carrito está vacío.");
            return;
        }

        setErrorPago("");
        setMostrarPago(true);
    };

    const procesarPagoConTarjeta = async (evento) => {
        evento.preventDefault();

        try {
            setProcesando(true);
            setErrorPago("");

            validarFormularioPago();

            // Simulación breve de autorización de tarjeta.
            await new Promise((resolve) => setTimeout(resolve, 900));

            await registrarMetodoPago();

            // Cierra la pasarela y ejecuta la compra real en Supabase.
            setMostrarPago(false);
            await simularCompra();

            limpiarFormularioPago();
        } catch (err) {
            console.error("Error procesando el pago con tarjeta:", err);
            setErrorPago(
                err?.message || "No se pudo procesar el pago con tarjeta."
            );
        } finally {
            setProcesando(false);
        }
    };

    /*
     * "Confirmar compra" registra la compra directamente en Supabase.
     *
     * Flujo:
     * 1. Valida sesión, variantes, dirección y carrito.
     * 2. Obtiene el perfil del comprador.
     * 3. Consulta los productos reales para validar stock y obtener tienda/precio.
     * 4. Crea la venta.
     * 5. Crea los pedidos asociados a esa venta.
     * 6. Descuenta el stock.
     * 7. Limpia el carrito y abre el flujo de post-compra.
     *
     * Nota:
     * El campo id_stripe_intent sigue siendo NOT NULL y UNIQUE en la base,
     * por eso se genera un identificador local SIM-... mientras el proyecto
     * trabaja con pago simulado.
     */
    const simularCompra = async () => {
        if (!user?.id) {
            alert("Debes iniciar sesión para realizar una compra.");
            return;
        }

        if (!validarVariantes()) return;

        if (!idDireccionSel) {
            alert("Por favor, selecciona una dirección de entrega.");
            return;
        }

        if (!Array.isArray(carrito) || carrito.length === 0) {
            alert("El carrito está vacío.");
            return;
        }

        try {
            setProcesando(true);

            // Guardamos una copia antes de limpiar el carrito.
            const itemsComprados = [...carrito];

            // ============================================================
            // 1. OBTENER PERFIL DEL COMPRADOR
            // ============================================================
            const { data: perfiles, error: perfilError } = await supabase
                .from("perfiles")
                .select("perfil_id")
                .eq("id_usuario", user.id)
                .limit(1);

            if (perfilError) {
                throw new Error(
                    `No se pudo obtener tu perfil: ${perfilError.message}`
                );
            }

            const perfil = perfiles?.[0];

            if (!perfil?.perfil_id) {
                throw new Error(
                    "No se encontró un perfil asociado a tu usuario."
                );
            }

            // ============================================================
            // 2. CONSULTAR PRODUCTOS REALES Y VALIDAR STOCK
            // ============================================================
            const idsProductos = [...new Set(
                carrito.map((item) => item.id_producto).filter(Boolean)
            )];

            if (idsProductos.length === 0) {
                throw new Error("No se encontraron productos válidos en el carrito.");
            }

            const { data: productosBD, error: productosError } = await supabase
                .from("productos")
                .select("id_producto, nombre_producto, precio_venta, stock, id_tienda")
                .in("id_producto", idsProductos);

            if (productosError) {
                throw new Error(
                    `No se pudieron verificar los productos: ${productosError.message}`
                );
            }

            const mapaProductos = new Map(
                (productosBD || []).map((producto) => [
                    producto.id_producto,
                    producto
                ])
            );

            // Sumar cantidades por producto por si el mismo producto aparece
            // varias veces con distintas tallas o colores.
            const cantidadesPorProducto = new Map();

            carrito.forEach((item) => {
                const cantidad = Number(item.cantidad) || 0;
                const acumulado = cantidadesPorProducto.get(item.id_producto) || 0;
                cantidadesPorProducto.set(
                    item.id_producto,
                    acumulado + cantidad
                );
            });

            for (const [idProducto, cantidadSolicitada] of cantidadesPorProducto) {
                const producto = mapaProductos.get(idProducto);

                if (!producto) {
                    throw new Error(
                        "Uno de los productos del carrito ya no está disponible."
                    );
                }

                const stockActual = Number(producto.stock) || 0;

                if (cantidadSolicitada < 1) {
                    throw new Error(
                        `La cantidad de ${producto.nombre_producto} no es válida.`
                    );
                }

                if (stockActual < cantidadSolicitada) {
                    throw new Error(
                        `No hay suficiente stock de ${producto.nombre_producto}. ` +
                        `Disponible: ${stockActual}.`
                    );
                }
            }

            // ============================================================
            // 3. CALCULAR TOTAL DESDE LOS PRECIOS REALES DE LA BASE
            // ============================================================
            const totalCompra = carrito.reduce((acumulado, item) => {
                const producto = mapaProductos.get(item.id_producto);

                if (!producto) return acumulado;

                return acumulado +
                    (Number(producto.precio_venta) * Number(item.cantidad));
            }, 0);

            if (!Number.isFinite(totalCompra) || totalCompra <= 0) {
                throw new Error("El total de la compra no es válido.");
            }

            // ============================================================
            // 4. CREAR LA VENTA
            // ============================================================
            const idOperacion =
                `SIM-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

            const { data: venta, error: ventaError } = await supabase
                .from("ventas")
                .insert({
                    id_usuario: user.id,
                    monto_total: totalCompra,
                    id_estado: 1,
                    id_stripe_intent: idOperacion,
                    id_direccion: idDireccionSel
                })
                .select("venta_id")
                .single();

            if (ventaError) {
                throw new Error(
                    `No se pudo registrar la venta: ${ventaError.message}`
                );
            }

            if (!venta?.venta_id) {
                throw new Error(
                    "La venta se creó, pero no se pudo obtener su identificador."
                );
            }

            // ============================================================
            // 5. CREAR PEDIDOS
            // ============================================================
            const pedidos = carrito.map((item) => {
                const producto = mapaProductos.get(item.id_producto);

                return {
                    perfil_id: perfil.perfil_id,
                    venta_id: venta.venta_id,
                    id_producto: item.id_producto,
                    id_estado: 1,
                    id_tienda: producto.id_tienda,
                    precio_unitario: Number(producto.precio_venta),
                    cantidad: Number(item.cantidad),
                    talla_seleccionada: item.talla_seleccionada || null,
                    color_seleccionado: item.color_seleccionado || null
                };
            });

            const { error: pedidosError } = await supabase
                .from("pedidos")
                .insert(pedidos);

            if (pedidosError) {
                // Intento de limpieza de la cabecera de venta si todavía
                // no se pudo crear ningún pedido.
                await supabase
                    .from("ventas")
                    .delete()
                    .eq("venta_id", venta.venta_id);

                throw new Error(
                    `No se pudieron registrar los pedidos: ${pedidosError.message}`
                );
            }

            // ============================================================
            // 6. DESCONTAR STOCK
            // ============================================================
            for (const [idProducto, cantidadComprada] of cantidadesPorProducto) {
                const producto = mapaProductos.get(idProducto);
                const nuevoStock =
                    Number(producto.stock) - Number(cantidadComprada);

                const { error: stockError } = await supabase
                    .from("productos")
                    .update({
                        stock: nuevoStock
                    })
                    .eq("id_producto", idProducto);

                if (stockError) {
                    throw new Error(
                        `La compra fue registrada, pero no se pudo actualizar ` +
                        `el stock de ${producto.nombre_producto}: ${stockError.message}`
                    );
                }
            }

            // ============================================================
            // 7. COMPRA COMPLETADA
            // ============================================================
            setCarrito([]);
            setMostrar(false);

            if (typeof onCompraExitosa === "function") {
                onCompraExitosa(itemsComprados);
            }
        } catch (err) {
            console.error("Error al procesar la compra:", err);

            alert(
                "Ocurrió un error al procesar tu compra: " +
                (err?.message || "Error desconocido")
            );
        } finally {
            setProcesando(false);
        }
    };

    return (
        <>
        <Modal
            show={mostrar}
            onHide={() => setMostrar(false)}
            size="lg"
            centered
            fullscreen="md-down"
            className="cg-modal"
            contentClassName="cg-content"
        >
            <Modal.Header className="cg-header" closeButton>
                <div className="cg-header-row">
                    <Modal.Title className="cg-title">
                        <span className="cg-title-word">Carrito</span>{" "}
                        <span className="cg-title-count">({carrito.length})</span>
                    </Modal.Title>
                    {carrito.length > 0 && (
                        <button
                            type="button"
                            className="cg-clear-btn"
                            onClick={vaciarCarrito}
                            disabled={procesando}
                            aria-label="Vaciar carrito"
                            title="Vaciar carrito"
                        >
                            <i className="bi bi-trash3"></i>
                        </button>
                    )}
                </div>
            </Modal.Header>

            <Modal.Body className="cg-body">
                {carrito.length === 0 ? (
                    <div className="cg-empty">
                        <div className="cg-empty-icon">
                            <i className="bi bi-cart-x"></i>
                        </div>
                        <h4 className="cg-empty-title">Tu carrito está vacío</h4>
                        <p className="cg-empty-text">¡Agrega algunos productos para comenzar!</p>
                        <button type="button" className="cg-confirm-btn cg-empty-btn" onClick={() => setMostrar(false)}>
                            Explorar catálogo
                        </button>
                    </div>
                ) : (
                    <div className="cg-items">
                        {carrito.map((item) => (
                            <div key={`${item.id_producto}-${item.talla_seleccionada || ""}-${item.color_seleccionado || ""}`} className="cg-item">
                                <span className="cg-item-sheen" aria-hidden="true"></span>

                                <div className="cg-item-img-wrap">
                                    {item.imagen_url && item.imagen_url.length > 0 ? (
                                        <img
                                            src={item.imagen_url[0]}
                                            alt={item.nombre_producto}
                                            className="cg-item-img"
                                        />
                                    ) : (
                                        <div className="cg-item-img cg-item-img-placeholder">
                                            <i className="bi bi-image"></i>
                                        </div>
                                    )}
                                </div>

                                <div className="cg-item-info">
                                    <h6 className="cg-item-name">{item.nombre_producto}</h6>

                                    <div className="cg-item-variants">
                                        {asegurarArray(item.tallas).length > 0 && (
                                            <Form.Select
                                                size="sm"
                                                className="cg-variant-select"
                                                value={item.talla_seleccionada || ""}
                                                onChange={(e) => cambiarVariante(item, 'talla_seleccionada', e.target.value)}
                                            >
                                                <option value="" disabled>Talla...</option>
                                                {asegurarArray(item.tallas).map(t => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </Form.Select>
                                        )}

                                        {asegurarArray(item.colores).length > 0 && (
                                            <Form.Select
                                                size="sm"
                                                className="cg-variant-select"
                                                value={item.color_seleccionado || ""}
                                                onChange={(e) => cambiarVariante(item, 'color_seleccionado', e.target.value)}
                                            >
                                                <option value="" disabled>Color...</option>
                                                {asegurarArray(item.colores).map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </Form.Select>
                                        )}
                                    </div>

                                    <div className="cg-item-prices">
                                        <span className="cg-item-price">
                                            C$ {(parseFloat(item.precio_venta) * item.cantidad).toFixed(2)}
                                        </span>
                                        {item.precio_original > 0 && (
                                            <span className="cg-item-price-old">
                                                C$ {(parseFloat(item.precio_original) * item.cantidad).toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="cg-item-side">
                                    <button
                                        type="button"
                                        className="cg-item-delete"
                                        onClick={() => eliminarDelCarrito(item)}
                                        aria-label="Quitar producto"
                                    >
                                        <i className="bi bi-x-lg"></i>
                                    </button>

                                    <div className="cg-stepper">
                                        <button
                                            type="button"
                                            className="cg-stepper-btn"
                                            onClick={() => actualizarCantidad(item, item.cantidad - 1, item.stock)}
                                        >
                                            <i className="bi bi-dash"></i>
                                        </button>
                                        <span className="cg-stepper-value">{item.cantidad}</span>
                                        <button
                                            type="button"
                                            className="cg-stepper-btn"
                                            onClick={() => actualizarCantidad(item, item.cantidad + 1, item.stock)}
                                            disabled={item.stock !== undefined && item.stock !== null && item.cantidad >= item.stock}
                                        >
                                            <i className="bi bi-plus"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Modal.Body>

            {carrito.length > 0 && (
                <div className="cg-footer">
                    <div className="cg-direccion">
                        <div className="cg-direccion-label">
                            <i className="bi bi-geo-alt-fill"></i>
                            <span>Dirección de entrega</span>
                        </div>

                        {direcciones.length === 0 ? (
                            <div className="cg-direccion-empty">
                                <span>No tienes direcciones registradas.</span>
                                <button
                                    type="button"
                                    className="cg-direccion-config-btn"
                                    onClick={() => { setMostrar(false); navegar("/perfil"); }}
                                >
                                    Configurar
                                </button>
                            </div>
                        ) : (
                            <Form.Select
                                className="cg-direccion-select"
                                value={idDireccionSel}
                                onChange={(e) => setIdDireccionSel(e.target.value)}
                                disabled={procesando}
                            >
                                {direcciones.map(dir => (
                                    <option key={dir.id_direccion} value={dir.id_direccion}>
                                        {dir.nombre_calle} ({dir.nombre})
                                    </option>
                                ))}
                            </Form.Select>
                        )}
                    </div>

                    <div className="cg-summary">
                        <span className="cg-summary-sheen" aria-hidden="true"></span>
                        <h6 className="cg-summary-title">Resumen de compra</h6>
                        <div className="cg-summary-row">
                            <span>Subtotal</span>
                            <span>C$ {total.toFixed(2)}</span>
                        </div>
                        <div className="cg-summary-row">
                            <span>Envío</span>
                            <span className="cg-summary-free">Gratis</span>
                        </div>
                        <div className="cg-summary-divider"></div>
                        <div className="cg-summary-row cg-summary-total">
                            <span>Total</span>
                            <span>C$ {total.toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="cg-confirm-btn"
                        onClick={abrirPago}
                        disabled={procesando}
                    >
                        <span className="cg-confirm-sheen" aria-hidden="true"></span>
                        {procesando ? (
                            <>
                                <Spinner as="span" animation="border" size="sm" className="me-2" />
                                Procesando...
                            </>
                        ) : (
                            "Confirmar compra"
                        )}
                    </button>

                    <button
                        type="button"
                        className="cg-seguir-btn"
                        onClick={() => setMostrar(false)}
                    >
                        Seguir explorando productos
                    </button>
                </div>
            )}
        </Modal>

        <Modal
            show={mostrarPago}
            onHide={() => {
                if (!procesando) {
                    setMostrarPago(false);
                    setErrorPago("");
                    setTarjetaGirando(false);
                }
            }}
            centered
            size="lg"
            dialogClassName="payment-modal-dialog"
            contentClassName="payment-modal-content"
        >
            <Modal.Body className="p-0">
                <div className="payment-shell">
                    <button
                        type="button"
                        className="payment-close"
                        onClick={() => {
                            if (!procesando) {
                                setMostrarPago(false);
                                setErrorPago("");
                                setTarjetaGirando(false);
                            }
                        }}
                        disabled={procesando}
                        aria-label="Cerrar"
                    >
                        <i className="bi bi-x-lg" />
                    </button>

                    <div className="payment-heading">
                        <span>Pago seguro</span>
                        <h2>Completa tu compra</h2>
                        <p>
                            Esta pantalla simula el pago para pruebas del sistema.
                        </p>
                    </div>

                    <div className="payment-layout">
                        <div className="payment-card-column">
                            <div className={`payment-card-scene ${tarjetaGirando ? "is-flipped" : ""}`}>
                                <div className="payment-card-3d">
                                    <div className="payment-card-face payment-card-front">
                                        <div className="payment-card-top">
                                            <span className="payment-chip">
                                                <i className="bi bi-credit-card-2-front" />
                                            </span>

                                            <span className="payment-contactless">
                                                <i className="bi bi-wifi" />
                                            </span>
                                        </div>

                                        <div className="payment-card-number">
                                            {numeroTarjeta || "0000 0000 0000 0000"}
                                        </div>

                                        <div className="payment-card-bottom">
                                            <div>
                                                <small>Titular</small>
                                                <strong>
                                                    {titular || "NOMBRE DEL TITULAR"}
                                                </strong>
                                            </div>

                                            <div>
                                                <small>Vence</small>
                                                <strong>
                                                    {vencimiento || "MM/AA"}
                                                </strong>
                                            </div>

                                            <div className="payment-brand">
                                                {detectarTipoTarjeta(numeroTarjeta) === "mastercard"
                                                    ? "Mastercard"
                                                    : detectarTipoTarjeta(numeroTarjeta) === "visa"
                                                        ? "VISA"
                                                        : "CARD"}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="payment-card-face payment-card-back">
                                        <div className="payment-magnetic-strip" />

                                        <div className="payment-signature-area">
                                            <span>Firma autorizada</span>
                                            <strong>{cvv || "CVV"}</strong>
                                        </div>

                                        <div className="payment-back-name">
                                            {titular || "NOMBRE DEL TITULAR"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="payment-summary">
                                <div>
                                    <span>Productos</span>
                                    <strong>{carrito.length}</strong>
                                </div>

                                <div>
                                    <span>Envío</span>
                                    <strong>Gratis</strong>
                                </div>

                                <div className="payment-summary-total">
                                    <span>Total a pagar</span>
                                    <strong>
                                        C$ {Number(total).toFixed(2)}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        <form
                            className="payment-form"
                            onSubmit={procesarPagoConTarjeta}
                        >
                            {errorPago && (
                                <div className="payment-error">
                                    <i className="bi bi-exclamation-circle" />
                                    <span>{errorPago}</span>
                                </div>
                            )}

                            <div className="payment-methods">
                                <span>Método de pago</span>

                                <div className="payment-method-options">
                                    <button
                                        type="button"
                                        className={`payment-method ${
                                            detectarTipoTarjeta(numeroTarjeta) === "visa"
                                                ? "active"
                                                : ""
                                        }`}
                                    >
                                        VISA
                                    </button>

                                    <button
                                        type="button"
                                        className={`payment-method mastercard ${
                                            detectarTipoTarjeta(numeroTarjeta) === "mastercard"
                                                ? "active"
                                                : ""
                                        }`}
                                    >
                                        <span />
                                        <span />
                                    </button>

                                    <button
                                        type="button"
                                        className="payment-method"
                                        disabled
                                    >
                                        PayPal
                                    </button>
                                </div>
                            </div>

                            <label className="payment-field">
                                <span>Número de tarjeta</span>

                                <div className="payment-input-wrapper">
                                    <i className="bi bi-credit-card" />

                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="cc-number"
                                        placeholder="0000 0000 0000 0000"
                                        value={numeroTarjeta}
                                        onFocus={() => setTarjetaGirando(false)}
                                        onChange={(e) =>
                                            setNumeroTarjeta(
                                                formatearNumeroTarjeta(e.target.value)
                                            )
                                        }
                                        disabled={procesando}
                                    />
                                </div>
                            </label>

                            <label className="payment-field">
                                <span>Nombre del titular</span>

                                <div className="payment-input-wrapper">
                                    <i className="bi bi-person" />

                                    <input
                                        type="text"
                                        autoComplete="cc-name"
                                        placeholder="Como aparece en la tarjeta"
                                        value={titular}
                                        onFocus={() => setTarjetaGirando(false)}
                                        onChange={(e) =>
                                            setTitular(
                                                e.target.value
                                                    .replace(/[0-9]/g, "")
                                                    .slice(0, 35)
                                                    .toUpperCase()
                                            )
                                        }
                                        disabled={procesando}
                                    />
                                </div>
                            </label>

                            <div className="payment-field-row">
                                <label className="payment-field">
                                    <span>Vencimiento</span>

                                    <div className="payment-input-wrapper">
                                        <i className="bi bi-calendar3" />

                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="cc-exp"
                                            placeholder="MM/AA"
                                            value={vencimiento}
                                            onFocus={() => setTarjetaGirando(false)}
                                            onChange={(e) =>
                                                setVencimiento(
                                                    formatearVencimiento(e.target.value)
                                                )
                                            }
                                            disabled={procesando}
                                        />
                                    </div>
                                </label>

                                <label className="payment-field">
                                    <span>CVV</span>

                                    <div className="payment-input-wrapper">
                                        <i className="bi bi-shield-lock" />

                                        <input
                                            type="password"
                                            inputMode="numeric"
                                            autoComplete="cc-csc"
                                            placeholder="123"
                                            value={cvv}
                                            onFocus={() => setTarjetaGirando(true)}
                                            onBlur={() => setTarjetaGirando(false)}
                                            onChange={(e) =>
                                                setCvv(
                                                    e.target.value
                                                        .replace(/\D/g, "")
                                                        .slice(0, 4)
                                                )
                                            }
                                            disabled={procesando}
                                        />
                                    </div>
                                </label>
                            </div>

                            <div className="payment-security">
                                <i className="bi bi-shield-check" />
                                Los datos completos de la tarjeta y el CVV no se guardan.
                            </div>

                            <button
                                type="submit"
                                className="payment-submit"
                                disabled={procesando}
                            >
                                {procesando ? (
                                    <>
                                        <Spinner
                                            animation="border"
                                            size="sm"
                                        />
                                        Procesando...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-lock-fill" />
                                        Pagar C$ {Number(total).toFixed(2)}
                                    </>
                                )}
                            </button>

                            <small className="payment-test-number">
                                Tarjeta de prueba: 4242 4242 4242 4242,
                                vencimiento futuro y cualquier CVV de 3 dígitos.
                            </small>
                        </form>
                    </div>
                </div>
            </Modal.Body>
        </Modal>
        </>
    );
};

export default CarritoModal;
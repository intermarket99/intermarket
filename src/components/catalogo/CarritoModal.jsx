import React, { useState } from 'react';
import { Modal, Button, Row, Col, Spinner, Form } from 'react-bootstrap';
import { supabase } from '../../database/supabaseconfig';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { enviarNotificacionPorCorreo } from '../../services/emailService';


const CarritoModal = ({ mostrar, setMostrar, carrito, setCarrito, total, onCompraExitosa }) => {
    const { user, session } = useAuth();
    const navegar = useNavigate();
    const [procesando, setProcesando] = useState(false);
    const [direcciones, setDirecciones] = useState([]);
    const [idDireccionSel, setIdDireccionSel] = useState("");
    const [cargandoDirecciones, setCargandoDirecciones] = useState(false);

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
        localStorage.setItem('carrito', JSON.stringify(nuevoCarrito));
        window.dispatchEvent(new Event('carritoActualizado'));
    };

    const eliminarDelCarrito = (itemCarrito) => {
        const nuevoCarrito = carrito.filter(item => 
            !(item.id_producto === itemCarrito.id_producto && 
              item.talla_seleccionada === itemCarrito.talla_seleccionada && 
              item.color_seleccionado === itemCarrito.color_seleccionado)
        );
        setCarrito(nuevoCarrito);
        localStorage.setItem('carrito', JSON.stringify(nuevoCarrito));
        window.dispatchEvent(new Event('carritoActualizado'));
    };

    const vaciarCarrito = () => {
        setCarrito([]);
        localStorage.removeItem('carrito');
        window.dispatchEvent(new Event('carritoActualizado'));
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
        localStorage.setItem('carrito', JSON.stringify(nuevoCarrito));
        window.dispatchEvent(new Event('carritoActualizado'));
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

    const realizarCompra = async () => {
        if (!user) {
            alert("Debes iniciar sesión como comprador para realizar una compra.");
            return;
        }

        if (!validarVariantes()) return;

        if (!idDireccionSel) {
            alert("Por favor, selecciona una dirección de entrega.");
            return;
        }
        
        try {
            setProcesando(true);
            
            // Llamar a la Netlify Function
            const response = await fetch('/.netlify/functions/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
                },
                body: JSON.stringify({ 
                    carrito, 
                    id_direccion: idDireccionSel 
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al procesar la compra');
            }

            const data = await response.json();
            
            if (data?.url) {
                // Save cart temporarily so we can process it after redirect
                localStorage.setItem('carritoPendiente', JSON.stringify(carrito));
                localStorage.setItem('totalPendiente', total.toString());
                localStorage.setItem('direccionPendiente', idDireccionSel);
                
                // Redirect to Stripe
                window.location.href = data.url;
            } else {
                throw new Error("No se obtuvo la URL de pago.");
            }
            
        } catch (err) {
            console.error("Error al procesar compra:", err);
            // Mostrar mensaje más descriptivo si es posible
            const mensajeError = err.message.includes('Invalid URL') 
                ? "Error de URL: Posiblemente una imagen de producto es demasiado grande o inválida para Stripe."
                : `Ocurrió un error al procesar tu compra: ${err.message}`;
            alert(mensajeError);
        } finally {
            setProcesando(false);
        }
    };

    const simularCompra = async () => {
        if (!user) {
            alert("Debes iniciar sesión para simular una compra.");
            return;
        }

        if (!validarVariantes()) return;

        if (!idDireccionSel) {
            alert("Por favor, selecciona una dirección de entrega.");
            return;
        }

        try {
            setProcesando(true);
            const idOperacion = Date.now().toString(); // ID único para esta operación
            const response = await fetch('/.netlify/functions/simular-pago', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
                },
                body: JSON.stringify({ 
                    carrito, 
                    total, 
                    id_operacion: idOperacion,
                    id_direccion: idDireccionSel
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error en la simulación');
            }

            const data = await response.json();
            if (data.success) {
                alert('¡Pago Simulado Exitosamente! La venta ha sido registrada.');
                setCarrito([]);
                localStorage.removeItem('carrito');
                window.dispatchEvent(new Event('carritoActualizado'));
                setMostrar(false);
            }
        } catch (err) {
            console.error("Error en simulación:", err);
            alert("Error al simular el pago: " + err.message);
        } finally {
            setProcesando(false);
        }
    };

    return (
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
                        onClick={realizarCompra}
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
    );
};

export default CarritoModal;
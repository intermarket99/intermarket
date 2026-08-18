import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Modal,
  Button,
  Row,
  Col,
  Badge,
  Form,
  Spinner,
  Card,
  Carousel,
} from "react-bootstrap";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "../../database/supabaseconfig";
import { useAuth } from "../../context/AuthContext";
import ModalTienda from "./ModalTienda";

const TIEMPO_LIMITE_MS = 6000;

const consultaSegura = async (consulta, valorPorDefecto = null, ms = TIEMPO_LIMITE_MS) => {
  let temporizador;

  try {
    const timeout = new Promise((resolve) => {
      temporizador = setTimeout(() => {
        resolve({
          data: valorPorDefecto,
          error: { message: "tiempo_agotado" },
        });
      }, ms);
    });

    return await Promise.race([Promise.resolve(consulta), timeout]);
  } catch (error) {
    return {
      data: valorPorDefecto,
      error,
    };
  } finally {
    clearTimeout(temporizador);
  }
};

const cacheDetalles = new Map();
const DURACION_CACHE_MS = 2 * 60 * 1000;

const obtenerTiendaInicial = (producto) => {
  if (!producto?.id_tienda) return null;

  const tiendaRelacion = Array.isArray(producto?.tiendas)
    ? producto.tiendas[0]
    : producto?.tiendas;

  return {
    id_tienda: producto.id_tienda,
    nombre_tienda:
      tiendaRelacion?.nombre_tienda || producto?.nombre_tienda || "Tienda",
    imagen_url: tiendaRelacion?.imagen_url || null,
  };
};

const obtenerVendedorInicial = (producto) => {
  const tiendaRelacion = Array.isArray(producto?.tiendas)
    ? producto.tiendas[0]
    : producto?.tiendas;

  const perfiles = tiendaRelacion?.perfiles;

  if (Array.isArray(perfiles)) {
    return perfiles[0] || null;
  }

  return perfiles || null;
};

const ModalDetalleProducto = ({
  mostrar,
  setMostrar,
  producto,
  agregarAlCarrito,
}) => {
  const { user } = useAuth();
  const idCargaActualRef = useRef(0);

  const [tienda, setTienda] = useState(null);
  const [vendedor, setVendedor] = useState(null);
  const [perfilUsuario, setPerfilUsuario] = useState(null);
  const [mostrarModalTienda, setMostrarModalTienda] = useState(false);
  const [esMiProducto, setEsMiProducto] = useState(false);

  const [resenas, setResenas] = useState([]);
  const [calificacionesTienda, setCalificacionesTienda] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState(false);
  const [comprado, setComprado] = useState(false);

  const [tallaSeleccionada, setTallaSeleccionada] = useState("");
  const [colorSeleccionado, setColorSeleccionado] = useState("");
  const [productoDetalle, setProductoDetalle] = useState(producto);

  const [nuevaResena, setNuevaResena] = useState({
    calificacion: 5,
    comentario: "",
  });
  const [nuevaCalificacionTienda, setNuevaCalificacionTienda] = useState({
    puntuacion: 5,
    comentario: "",
  });

  // QR / compartir
  const [mostrarQR, setMostrarQR] = useState(false);
  const [enlaceCopiado, setEnlaceCopiado] = useState(false);

  const idProducto = producto?.id_producto;

  // Enlace ÚNICO por producto
  const enlaceProducto = useMemo(() => {
  if (!idProducto) return "";

  // Mientras desarrollas: pon la IP de tu PC en la WiFi
  const origenDev = "http://192.168.1.25:5173"; // ← cámbiala por la tuya

  const origen =
    typeof window !== "undefined" && window.location.hostname !== "localhost"
      ? window.location.origin
      : origenDev;

  return `${origen}/catalogo?producto=${idProducto}`;
}, [idProducto]);

  const copiarEnlace = async () => {
    if (!enlaceProducto) return;
    try {
      await navigator.clipboard.writeText(enlaceProducto);
      setEnlaceCopiado(true);
      setTimeout(() => setEnlaceCopiado(false), 2000);
    } catch {
      alert("No se pudo copiar el enlace");
    }
  };

  const compartirProducto = async () => {
    const nombre =
      productoDetalle?.nombre_producto ||
      producto?.nombre_producto ||
      "Producto";

    if (navigator.share) {
      try {
        await navigator.share({
          title: nombre,
          text: `Mira este producto en InterMarket: ${nombre}`,
          url: enlaceProducto,
        });
      } catch {
        // usuario canceló
      }
    } else {
      await copiarEnlace();
    }
  };

  useEffect(() => {
    if (!mostrar || !producto?.id_producto) {
      idCargaActualRef.current += 1;
      return;
    }

    setTallaSeleccionada("");
    setColorSeleccionado("");
    setProductoDetalle(producto);
    setErrorCarga(false);
    setMostrarQR(false);
    setEnlaceCopiado(false);

    setTienda(obtenerTiendaInicial(producto));
    setVendedor(obtenerVendedorInicial(producto));
    setPerfilUsuario(null);
    setEsMiProducto(false);
    setResenas([]);
    setCalificacionesTienda([]);
    setComprado(false);

    const cache = cacheDetalles.get(producto.id_producto);

    if (cache && Date.now() - cache.guardadoEn < DURACION_CACHE_MS) {
      setProductoDetalle(cache.productoDetalle || producto);
      setTienda(cache.tienda || null);
      setVendedor(cache.vendedor || null);
      setResenas(cache.resenas || []);
      setCalificacionesTienda(cache.calificacionesTienda || []);
      setCargando(false);
    }

    cargarDetalles(Boolean(cache));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrar, producto?.id_producto, user?.id]);

  const ultimoReintentoRef = useRef(0);
  const reintentoTimerRef = useRef(null);

  useEffect(() => {
    const programarReintento = () => {
      if (
        !mostrar ||
        !producto?.id_producto ||
        document.visibilityState !== "visible"
      ) {
        return;
      }

      const ahora = Date.now();
      if (ahora - ultimoReintentoRef.current < 800) return;
      ultimoReintentoRef.current = ahora;

      if (reintentoTimerRef.current) {
        clearTimeout(reintentoTimerRef.current);
      }

      setErrorCarga(false);

      reintentoTimerRef.current = setTimeout(() => {
        if (
          mostrar &&
          producto?.id_producto &&
          document.visibilityState === "visible"
        ) {
          cargarDetalles(true);
        }
      }, 700);
    };

    const alCambiarVisibilidad = () => {
      if (document.visibilityState === "hidden") {
        idCargaActualRef.current += 1;
        setCargando(false);
        if (reintentoTimerRef.current) {
          clearTimeout(reintentoTimerRef.current);
        }
        return;
      }
      programarReintento();
    };

    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    window.addEventListener("focus", programarReintento);

    return () => {
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      window.removeEventListener("focus", programarReintento);
      if (reintentoTimerRef.current) {
        clearTimeout(reintentoTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrar, producto?.id_producto, user?.id]);

  const cargarDetalles = async (cargaEnSegundoPlano = false) => {
    if (!producto?.id_producto) {
      setCargando(false);
      return;
    }

    idCargaActualRef.current += 1;
    const idCarga = idCargaActualRef.current;
    const esCargaVigente = () => idCargaActualRef.current === idCarga;

    if (!cargaEnSegundoPlano) setCargando(true);
    setErrorCarga(false);

    try {
      const promesas = [
        consultaSegura(
          supabase
            .from("productos")
            .select("*, categorias(nombre_categoria)")
            .eq("id_producto", producto.id_producto)
            .maybeSingle(),
          producto,
          6000
        ),
        producto.id_tienda
          ? consultaSegura(
              supabase
                .from("tiendas")
                .select("*")
                .eq("id_tienda", producto.id_tienda)
                .maybeSingle(),
              null,
              6000
            )
          : Promise.resolve({ data: null, error: null }),
        consultaSegura(
          supabase
            .from("reseñas_productos")
            .select("*, perfiles(usuarios(username))")
            .eq("producto_id", producto.id_producto)
            .order("creado_en", { ascending: false }),
          [],
          6000
        ),
        user?.id
          ? consultaSegura(
              supabase
                .from("perfiles")
                .select("perfil_id, id_tienda")
                .eq("id_usuario", user.id)
                .maybeSingle(),
              null,
              6000
            )
          : Promise.resolve({ data: null, error: null }),
        producto.id_tienda
          ? consultaSegura(
              supabase
                .from("perfiles")
                .select("*, usuarios(username)")
                .eq("id_tienda", producto.id_tienda)
                .maybeSingle(),
              null,
              6000
            )
          : Promise.resolve({ data: null, error: null }),
        producto.id_tienda
          ? consultaSegura(
              supabase
                .from("calificaciones_tiendas")
                .select("*, perfiles(usuarios(username))")
                .eq("tienda_id", producto.id_tienda)
                .order("creado_en", { ascending: false }),
              [],
              6000
            )
          : Promise.resolve({ data: [], error: null }),
      ];

      const [
        productoResultado,
        tiendaResultado,
        resenasResultado,
        miPerfilResultado,
        vendedorResultado,
        califTiendaResultado,
      ] = await Promise.all(promesas);

      if (!esCargaVigente()) return;

      const detalleFinal = productoResultado?.data || producto;
      const tiendaFinal =
        tiendaResultado?.data || obtenerTiendaInicial(producto) || null;
      const vendedorFinal =
        vendedorResultado?.data || obtenerVendedorInicial(producto) || null;
      const resenasFinal = Array.isArray(resenasResultado?.data)
        ? resenasResultado.data
        : [];
      const calificacionesFinal = Array.isArray(califTiendaResultado?.data)
        ? califTiendaResultado.data
        : [];
      const miPerfil = miPerfilResultado?.data || null;

      setProductoDetalle(detalleFinal);
      setTienda(tiendaFinal);
      setVendedor(vendedorFinal);
      setResenas(resenasFinal);
      setCalificacionesTienda(calificacionesFinal);
      setPerfilUsuario(miPerfil);
      setEsMiProducto(
        Boolean(miPerfil && miPerfil.id_tienda === producto.id_tienda)
      );

      const erroresSecundarios = [
        tiendaResultado?.error,
        resenasResultado?.error,
        vendedorResultado?.error,
        califTiendaResultado?.error,
      ].filter(Boolean);

      if (erroresSecundarios.length > 0) {
        console.warn("Datos secundarios no disponibles:", erroresSecundarios);
        cacheDetalles.delete(producto.id_producto);
      } else {
        cacheDetalles.set(producto.id_producto, {
          guardadoEn: Date.now(),
          productoDetalle: detalleFinal,
          tienda: tiendaFinal,
          vendedor: vendedorFinal,
          resenas: resenasFinal,
          calificacionesTienda: calificacionesFinal,
        });
      }

      if (productoResultado?.error && !detalleFinal) {
        setErrorCarga(true);
      }

      if (!miPerfil?.perfil_id) {
        setComprado(false);
        return;
      }

      const pedidosResultado = await consultaSegura(
        supabase
          .from("pedidos")
          .select("id_pedido")
          .eq("perfil_id", miPerfil.perfil_id)
          .eq("id_producto", producto.id_producto)
          .gte("id_estado", 2)
          .limit(1),
        [],
        5000
      );

      if (!esCargaVigente()) return;

      if (pedidosResultado?.error) {
        console.warn("No se pudo verificar la compra:", pedidosResultado.error);
        setComprado(false);
        return;
      }

      const pedidos = pedidosResultado?.data || [];
      setComprado(Array.isArray(pedidos) && pedidos.length > 0);
    } catch (error) {
      console.error("Error inesperado al cargar detalles:", error);
      if (esCargaVigente()) setErrorCarga(false);
    } finally {
      if (esCargaVigente()) setCargando(false);
    }
  };

  const enviarResenaProducto = async (e) => {
    e.preventDefault();
    if (!nuevaResena.comentario.trim()) return;

    if (!perfilUsuario?.perfil_id) {
      alert("No se pudo identificar tu perfil de usuario. Intenta recargar la página.");
      return;
    }

    try {
      const { error } = await supabase.from("reseñas_productos").insert([
        {
          producto_id: producto.id_producto,
          comprador_id: perfilUsuario.perfil_id,
          calificacion: nuevaResena.calificacion,
          comentario: nuevaResena.comentario,
        },
      ]);

      if (error) {
        if (error.code === "23505") {
          alert("Ya has dejado una reseña para este producto.");
        } else {
          throw error;
        }
        return;
      }

      setNuevaResena({ calificacion: 5, comentario: "" });
      cargarDetalles();
    } catch (error) {
      console.error("Error al enviar reseña:", error);
      alert("Error al enviar la reseña: " + (error.message || "Error desconocido"));
    }
  };

  const enviarCalificacionTienda = async (e) => {
    e.preventDefault();
    if (!nuevaCalificacionTienda.comentario.trim()) return;
    try {
      const { error } = await supabase.from("calificaciones_tiendas").insert([
        {
          tienda_id: producto.id_tienda,
          comprador_id: perfilUsuario.perfil_id,
          puntuacion: nuevaCalificacionTienda.puntuacion,
          comentario: nuevaCalificacionTienda.comentario,
        },
      ]);
      if (error) throw error;
      setNuevaCalificacionTienda({ puntuacion: 5, comentario: "" });
      cargarDetalles();
    } catch (error) {
      console.error("Error al enviar calificación:", error);
      alert("No se pudo calificar. Solo puedes calificar a la tienda una vez.");
    }
  };

  const Estrellas = ({ valor }) => (
    <span className="text-warning">
      {[1, 2, 3, 4, 5].map((s) => (
        <i key={s} className={`bi bi-star${s <= valor ? "-fill" : ""}`}></i>
      ))}
    </span>
  );

  const EstrellasInteractivas = ({ valor, setValor }) => {
    const [hover, setHover] = useState(0);
    return (
      <div className="mb-2" style={{ cursor: "pointer", fontSize: "1.5rem" }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <i
            key={s}
            className={`bi bi-star${s <= (hover || valor) ? "-fill" : ""} text-warning me-1`}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setValor(s)}
          ></i>
        ))}
      </div>
    );
  };

  const PromedioEstrellas = ({ datos, campo }) => {
    if (!datos || datos.length === 0) {
      return <span className="text-muted small">Sin calificaciones</span>;
    }
    const promedio = Math.round(
      datos.reduce((a, c) => a + c[campo], 0) / datos.length
    );
    return <Estrellas valor={promedio} />;
  };

  const asegurarArray = (valor) => {
    if (!valor) return [];
    if (Array.isArray(valor)) return valor;
    if (typeof valor === "string") {
      if (valor.startsWith("{") && valor.endsWith("}")) {
        return valor
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().replace(/^"|"$/g, ""));
      }
      return valor
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s !== "");
    }
    return [];
  };

  if (!producto) return null;

  const tallas = asegurarArray(productoDetalle?.tallas);
  const colores = asegurarArray(productoDetalle?.colores);

  return (
    <>
      <Modal show={mostrar} onHide={() => setMostrar(false)} size="lg" centered>
        <Modal.Header
          closeButton
          className="border-0"
          style={{
            background:
              "linear-gradient(135deg, var(--color-primario) 0%, #1a7a8a 100%)",
            padding: "0.65rem 1.25rem",
          }}
        >
          <Modal.Title
            className="fw-bold text-white d-flex align-items-center gap-2"
            style={{ fontSize: "1rem" }}
          >
            <i className="bi bi-bag-heart"></i>
            Detalles del Producto
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {cargando && (
            <div className="d-flex align-items-center justify-content-center gap-2 text-muted small mb-3">
              <Spinner animation="border" variant="primary" size="sm" />
              <span>Actualizando información del producto...</span>
            </div>
          )}

          {errorCarga && (
            <div className="alert alert-warning d-flex align-items-center justify-content-between gap-3 py-2">
              <span className="small">
                <i className="bi bi-wifi-off me-2"></i>
                Algunos datos adicionales no pudieron actualizarse.
              </span>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => cargarDetalles(false)}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Reintentar
              </Button>
            </div>
          )}

          <Row>
            <Col md={5}>
              <div
                className="mb-4 text-center rounded overflow-hidden shadow-sm"
                style={{ height: "250px", backgroundColor: "#f8f9fa" }}
              >
                {producto.imagen_url && producto.imagen_url.length > 1 ? (
                  <Carousel
                    variant="dark"
                    style={{ height: "100%" }}
                    interval={3000}
                    pause="hover"
                  >
                    {producto.imagen_url.map((url, idx) => (
                      <Carousel.Item key={idx} style={{ height: "250px" }}>
                        <img
                          src={url}
                          alt={`${producto.nombre_producto} ${idx + 1}`}
                          className="d-block w-100 h-100"
                          style={{ objectFit: "contain" }}
                        />
                      </Carousel.Item>
                    ))}
                  </Carousel>
                ) : producto.imagen_url && producto.imagen_url.length === 1 ? (
                  <img
                    src={producto.imagen_url[0]}
                    alt={producto.nombre_producto}
                    className="img-fluid h-100"
                    style={{ objectFit: "contain" }}
                  />
                ) : (
                  <i
                    className="bi bi-image text-muted d-flex justify-content-center align-items-center h-100"
                    style={{ fontSize: "4rem" }}
                  ></i>
                )}
              </div>

              {tienda && (
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body>
                    <h6 className="fw-bold text-uppercase text-muted mb-2 small">
                      Vendido por:
                    </h6>
                    <div
                      className="d-flex align-items-center mb-2 p-2 rounded-3 store-link-hover"
                      style={{ cursor: "pointer", transition: "background 0.2s" }}
                      onClick={() => setMostrarModalTienda(true)}
                      title="Ver tienda completa"
                    >
                      {tienda.imagen_url ? (
                        <img
                          src={tienda.imagen_url}
                          alt="Logo"
                          className="rounded-circle me-2 shadow-sm"
                          style={{
                            width: "44px",
                            height: "44px",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          className="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center me-2 shadow-sm"
                          style={{ width: "44px", height: "44px" }}
                        >
                          <i className="bi bi-shop"></i>
                        </div>
                      )}
                      <div className="flex-grow-1">
                        <h6 className="mb-0 fw-bold text-primary d-flex align-items-center gap-1">
                          {tienda.nombre_tienda}
                          <i
                            className="bi bi-chevron-right text-muted"
                            style={{ fontSize: "0.75rem" }}
                          ></i>
                        </h6>
                        <small className="text-muted">
                          {vendedor?.usuarios?.username ||
                            vendedor?.username ||
                            "Vendedor"}
                        </small>
                      </div>
                      <span
                        className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-2"
                        style={{ fontSize: "0.7rem" }}
                      >
                        Ver tienda
                      </span>
                    </div>

                    <div className="mb-2">
                      <small className="me-2">Reputación:</small>
                      <PromedioEstrellas
                        datos={calificacionesTienda}
                        campo="puntuacion"
                      />
                    </div>

                    {user && !esMiProducto && (
                      <div className="mt-3 pt-3 border-top">
                        <h6 className="small fw-bold">Calificar Tienda</h6>
                        <Form onSubmit={enviarCalificacionTienda}>
                          <EstrellasInteractivas
                            valor={nuevaCalificacionTienda.puntuacion}
                            setValor={(val) =>
                              setNuevaCalificacionTienda({
                                ...nuevaCalificacionTienda,
                                puntuacion: val,
                              })
                            }
                          />
                          <Form.Control
                            size="sm"
                            as="textarea"
                            placeholder="Opinión sobre la tienda..."
                            className="mb-2"
                            value={nuevaCalificacionTienda.comentario}
                            onChange={(e) =>
                              setNuevaCalificacionTienda({
                                ...nuevaCalificacionTienda,
                                comentario: e.target.value,
                              })
                            }
                          />
                          <Button
                            type="submit"
                            variant="outline-primary"
                            size="sm"
                            className="w-100"
                          >
                            Enviar calificación
                          </Button>
                        </Form>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              )}
            </Col>

            <Col md={7}>
              <h3 className="fw-bold mb-2">
                {productoDetalle?.nombre_producto || producto.nombre_producto}
              </h3>
              <Badge bg="info" className="mb-3">
                {productoDetalle?.categorias?.nombre_categoria ||
                  producto.categorias?.nombre_categoria ||
                  "Categoría"}
              </Badge>

              <div className="mb-4">
                {(productoDetalle?.precio_original || producto.precio_original) >
                  (productoDetalle?.precio_venta || producto.precio_venta) && (
                  <span className="text-decoration-line-through text-muted me-2 fs-5">
                    C$
                    {parseFloat(
                      productoDetalle?.precio_original || producto.precio_original
                    ).toFixed(2)}
                  </span>
                )}
                <span className="fs-2 fw-bold text-success">
                  C$
                  {parseFloat(
                    productoDetalle?.precio_venta || producto.precio_venta
                  ).toFixed(2)}
                </span>

                {(productoDetalle?.stock !== undefined ||
                  producto.stock !== undefined) && (
                  <div className="mt-2">
                    {(productoDetalle?.stock ?? producto.stock) === 0 ? (
                      <span className="badge bg-danger rounded-pill px-3 py-2">
                        <i className="bi bi-x-circle me-1"></i>Sin stock
                      </span>
                    ) : (productoDetalle?.stock ?? producto.stock) <= 5 ? (
                      <span className="badge bg-warning text-dark rounded-pill px-3 py-2">
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        ¡Quedan solo {productoDetalle?.stock ?? producto.stock}!
                      </span>
                    ) : (
                      <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2">
                        <i className="bi bi-check-circle me-1"></i>
                        {productoDetalle?.stock ?? producto.stock} en stock
                      </span>
                    )}
                  </div>
                )}
              </div>

              <p className="text-secondary mb-4">
                {productoDetalle?.descripcion ||
                  producto.descripcion ||
                  "Sin descripción detallada."}
              </p>

              {(tallas.length > 0 || colores.length > 0) && (
                <div className="mb-4 bg-white p-3 rounded-4 shadow-sm border">
                  <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                    <i className="bi bi-sliders2 text-primary"></i>
                    Personaliza tu pedido
                  </h6>

                  {tallas.length > 0 && (
                    <div className="mb-3">
                      <label className="fw-bold small text-uppercase text-muted mb-2 d-block">
                        Talla:
                      </label>
                      <div className="d-flex flex-wrap gap-2">
                        {tallas.map((talla) => (
                          <Button
                            key={talla}
                            variant={
                              tallaSeleccionada === talla
                                ? "primary"
                                : "outline-light"
                            }
                            size="sm"
                            className={`rounded-3 px-3 py-2 fw-bold ${
                              tallaSeleccionada === talla
                                ? "shadow-sm"
                                : "text-dark border-secondary border-opacity-25"
                            }`}
                            onClick={() => setTallaSeleccionada(talla)}
                            style={{ minWidth: "45px" }}
                          >
                            {talla}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {colores.length > 0 && (
                    <div>
                      <label className="fw-bold small text-uppercase text-muted mb-2 d-block">
                        Color:
                      </label>
                      <div className="d-flex flex-wrap gap-2">
                        {colores.map((color) => (
                          <Button
                            key={color}
                            variant={
                              colorSeleccionado === color
                                ? "primary"
                                : "outline-light"
                            }
                            size="sm"
                            className={`rounded-3 px-3 py-2 fw-bold ${
                              colorSeleccionado === color
                                ? "shadow-sm"
                                : "text-dark border-secondary border-opacity-25"
                            }`}
                            onClick={() => setColorSeleccionado(color)}
                          >
                            {color}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {!tallaSeleccionada && tallas.length > 0 && (
                    <small className="text-danger d-block mt-2">
                      * Por favor elige una talla
                    </small>
                  )}
                  {!colorSeleccionado && colores.length > 0 && (
                    <small className="text-danger d-block mt-1">
                      * Por favor elige un color
                    </small>
                  )}
                </div>
              )}

              {esMiProducto ? (
                <div className="alert alert-warning border-0 shadow-sm rounded-4 d-flex align-items-center mb-4">
                  <i className="bi bi-exclamation-triangle-fill fs-4 me-3"></i>
                  <div>
                    <strong className="d-block">¡Aviso de Propietario!</strong>
                    Este producto pertenece a tu tienda. No puedes comprar tus
                    propios productos.
                  </div>
                </div>
              ) : (productoDetalle?.stock ?? producto.stock) === 0 ? (
                <div className="alert alert-danger border-0 shadow-sm rounded-4 d-flex align-items-center mb-4">
                  <i className="bi bi-x-circle-fill fs-4 me-3"></i>
                  <div>
                    <strong className="d-block">Producto Agotado</strong>
                    Este producto no tiene unidades disponibles en este momento.
                  </div>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2 mb-3">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-100 rounded-pill fw-bold shadow-sm"
                    style={{
                      backgroundColor:
                        (tallas.length > 0 && !tallaSeleccionada) ||
                        (colores.length > 0 && !colorSeleccionado)
                          ? "#ccc"
                          : "var(--color-primario)",
                      borderColor:
                        (tallas.length > 0 && !tallaSeleccionada) ||
                        (colores.length > 0 && !colorSeleccionado)
                          ? "#ccc"
                          : "var(--color-primario)",
                      cursor:
                        (tallas.length > 0 && !tallaSeleccionada) ||
                        (colores.length > 0 && !colorSeleccionado)
                          ? "not-allowed"
                          : "pointer",
                    }}
                    disabled={
                      (tallas.length > 0 && !tallaSeleccionada) ||
                      (colores.length > 0 && !colorSeleccionado)
                    }
                    onClick={() => {
                      agregarAlCarrito({
                        ...(productoDetalle || producto),
                        talla_seleccionada: tallaSeleccionada,
                        color_seleccionado: colorSeleccionado,
                      });
                      setMostrar(false);
                    }}
                  >
                    <i className="bi bi-cart-plus me-2"></i> Añadir al Carrito
                  </Button>

                  {((tallas.length > 0 && !tallaSeleccionada) ||
                    (colores.length > 0 && !colorSeleccionado)) && (
                    <div className="text-center">
                      <small className="text-danger fw-bold">
                        <i className="bi bi-info-circle me-1"></i>
                        Selecciona{" "}
                        {tallas.length > 0 && !tallaSeleccionada ? "talla" : ""}
                        {tallas.length > 0 &&
                        !tallaSeleccionada &&
                        colores.length > 0 &&
                        !colorSeleccionado
                          ? " y "
                          : ""}
                        {colores.length > 0 && !colorSeleccionado
                          ? "color"
                          : ""}{" "}
                        para continuar
                      </small>
                    </div>
                  )}
                </div>
              )}

              {/* ========== QR ÚNICO POR PRODUCTO ========== */}
              <div
                className="mb-4 p-3 rounded-4 border"
                style={{
                  backgroundColor: "#f0f7fa",
                  borderColor: "#e2e8f0",
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6
                    className="fw-bold mb-0"
                    style={{ color: "#0d5c63" }}
                  >
                    <i className="bi bi-qr-code me-2"></i>
                    Compartir producto
                  </h6>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="rounded-pill"
                    onClick={() => setMostrarQR((v) => !v)}
                  >
                    {mostrarQR ? "Ocultar QR" : "Ver QR"}
                  </Button>
                </div>

                <p className="small text-muted mb-2">
                  Cada producto tiene su propio código QR y enlace.
                </p>

                <div className="d-flex flex-wrap gap-2 mb-2">
                  <Button
                    size="sm"
                    className="rounded-pill border-0"
                    style={{ backgroundColor: "#0d5c63", color: "#fff" }}
                    onClick={compartirProducto}
                  >
                    <i className="bi bi-share me-1"></i>
                    Compartir
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    className="rounded-pill"
                    onClick={copiarEnlace}
                  >
                    <i
                      className={`bi bi-${
                        enlaceCopiado ? "check2" : "link-45deg"
                      } me-1`}
                    ></i>
                    {enlaceCopiado ? "¡Copiado!" : "Copiar enlace"}
                  </Button>
                </div>

                {mostrarQR && enlaceProducto && (
                  <div className="text-center mt-3 p-3 bg-white rounded-4 shadow-sm">
                    <QRCodeSVG
                      value={enlaceProducto}
                      size={180}
                      level="M"
                      includeMargin
                      bgColor="#ffffff"
                      fgColor="#0d5c63"
                    />
                    <div className="small text-muted mt-2 text-break px-2">
                      {enlaceProducto}
                    </div>
                    <small className="text-muted d-block mt-1">
                      ID producto: {idProducto}
                    </small>
                  </div>
                )}
              </div>

              <hr />

              <h5 className="fw-bold mb-3">
                Reseñas del Producto{" "}
                <PromedioEstrellas datos={resenas} campo="calificacion" />
              </h5>

              {user && !esMiProducto ? (
                <Form
                  onSubmit={enviarResenaProducto}
                  className="mb-4 bg-light p-3 rounded"
                >
                  <h6 className="fw-bold mb-2">Dejar una reseña</h6>
                  <EstrellasInteractivas
                    valor={nuevaResena.calificacion}
                    setValor={(val) =>
                      setNuevaResena({ ...nuevaResena, calificacion: val })
                    }
                  />
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="¿Qué te pareció este producto?"
                    className="mb-2"
                    value={nuevaResena.comentario}
                    onChange={(e) =>
                      setNuevaResena({
                        ...nuevaResena,
                        comentario: e.target.value,
                      })
                    }
                  />
                  <div className="text-end">
                    <Button type="submit" variant="primary" size="sm">
                      Comentar
                    </Button>
                  </div>
                </Form>
              ) : !user ? (
                <div className="alert alert-secondary small py-2">
                  <i className="bi bi-info-circle me-2"></i>
                  Inicia sesión para dejar una reseña.
                </div>
              ) : null}

              <div
                className="list-group list-group-flush"
                style={{
                  maxHeight: "260px",
                  overflowY: "auto",
                  overflowX: "hidden",
                }}
              >
                {resenas.length > 0 ? (
                  resenas.map((resena) => (
                    <div
                      key={resena.id_resena}
                      className="list-group-item px-0 py-3"
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <h6 className="fw-bold mb-0">
                          <i className="bi bi-person-circle me-2 text-muted"></i>
                          {resena.perfiles?.usuarios?.username ||
                            "Usuario Anónimo"}
                        </h6>
                        <Estrellas valor={resena.calificacion} />
                      </div>
                      <p className="text-muted mb-0 small">
                        {resena.comentario}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted text-center py-3">
                    Aún no hay reseñas para este producto.
                  </p>
                )}
              </div>
            </Col>
          </Row>
        </Modal.Body>
      </Modal>

      {tienda && (
        <ModalTienda
          mostrar={mostrarModalTienda}
          onCerrar={() => setMostrarModalTienda(false)}
          tiendaId={tienda.id_tienda}
          onVerProducto={() => setMostrarModalTienda(false)}
        />
      )}
    </>
  );
};

export default ModalDetalleProducto;
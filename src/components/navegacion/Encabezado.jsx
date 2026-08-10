import React, { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Container,
  Dropdown,
  Nav,
  Navbar,
  Offcanvas
} from "react-bootstrap";

import {
  useLocation,
  useNavigate
} from "react-router-dom";

import logo from "../../assets/icono_intermAeview.png";
import { supabase } from "../../database/supabaseconfig";
import { useAuth } from "../../context/AuthContext";
import { obtenerMiPerfil } from "../../services/perfilService";

import "../../App.css";

const Encabezado = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    user,
    role,
    signOut
  } = useAuth();

  const [mostrarMenu, setMostrarMenu] =
    useState(false);

  const [scrolled, setScrolled] =
    useState(false);

  const [fotoUrl, setFotoUrl] =
    useState("");

  const [carritoCount, setCarritoCount] =
    useState(0);

  const [
    notificaciones,
    setNotificaciones
  ] = useState([]);

  const [noLeidas, setNoLeidas] =
    useState(0);

  const esLogin =
    location.pathname === "/login";

  const nombreUsuario = useMemo(() => {
    if (!user?.email) {
      return "Usuario";
    }

    return user.email.split("@")[0];
  }, [user]);

  const inicialUsuario = useMemo(() => {
    return nombreUsuario
      .charAt(0)
      .toUpperCase();
  }, [nombreUsuario]);

  const rutaInicio = useMemo(() => {
    if (role === "admin") {
      return "/admin-inicio";
    }

    if (role === "vendedor") {
      return "/vendedor";
    }

    return "/catalogo";
  }, [role]);

  const navegar = (ruta) => {
    navigate(ruta);
    setMostrarMenu(false);
  };

  const esRutaActiva = (ruta) => {
    if (ruta === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(ruta);
  };

  // Detectar scroll
  useEffect(() => {
    const manejarScroll = () => {
      setScrolled(
        window.scrollY > 18
      );
    };

    manejarScroll();

    window.addEventListener(
      "scroll",
      manejarScroll
    );

    return () => {
      window.removeEventListener(
        "scroll",
        manejarScroll
      );
    };
  }, []);

  // Leer cantidad del carrito
  const actualizarCarritoCount = () => {
    try {
      const carritoGuardado =
        JSON.parse(
          localStorage.getItem(
            "carrito"
          ) || "[]"
        );

      const cantidad =
        carritoGuardado.reduce(
          (total, producto) =>
            total +
            Number(
              producto.cantidad || 1
            ),
          0
        );

      setCarritoCount(cantidad);
    } catch (error) {
      console.error(
        "Error leyendo carrito:",
        error
      );

      setCarritoCount(0);
    }
  };

  useEffect(() => {
    actualizarCarritoCount();

    window.addEventListener(
      "storage",
      actualizarCarritoCount
    );

    window.addEventListener(
      "carritoActualizado",
      actualizarCarritoCount
    );

    return () => {
      window.removeEventListener(
        "storage",
        actualizarCarritoCount
      );

      window.removeEventListener(
        "carritoActualizado",
        actualizarCarritoCount
      );
    };
  }, []);

  // Perfil y notificaciones
  useEffect(() => {
    if (!user?.id) {
      setFotoUrl("");
      setNotificaciones([]);
      setNoLeidas(0);
      return;
    }

    let canalNotificaciones;

    const cargarDatosUsuario =
      async () => {
        try {
          /*
           * obtenerMiPerfil es una lectura "segura": si por algún
           * duplicado viejo llegara a haber más de una fila en
           * perfiles para este usuario, NO truena con
           * "JSON object requested, multiple (or no) rows returned"
           * — simplemente toma la primera.
           */
          const perfil = await obtenerMiPerfil(user.id);

          setFotoUrl(
            perfil?.foto_perfil || ""
          );

          if (!perfil?.perfil_id) {
            setNotificaciones([]);
            setNoLeidas(0);
            return;
          }

          const {
            data: notificacionesData,
            error: notificacionesError
          } = await supabase
            .from("notificaciones")
            .select(`
              id_notificacion,
              perfil_id,
              titulo,
              mensaje,
              leido,
              creado_en
            `)
            .eq(
              "perfil_id",
              perfil.perfil_id
            )
            .order(
              "creado_en",
              {
                ascending: false
              }
            )
            .limit(15);

          if (notificacionesError) {
            throw notificacionesError;
          }

          const lista =
            notificacionesData || [];

          setNotificaciones(lista);

          setNoLeidas(
            lista.filter(
              (notificacion) =>
                !notificacion.leido
            ).length
          );
        } catch (error) {
          console.error(
            "Error cargando datos del encabezado:",
            error
          );
        }
      };

    cargarDatosUsuario();

    canalNotificaciones = supabase
      .channel(
        `notificaciones-${user.id}`
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notificaciones"
        },
        () => {
          cargarDatosUsuario();
        }
      )
      .subscribe();

    return () => {
      if (canalNotificaciones) {
        supabase.removeChannel(
          canalNotificaciones
        );
      }
    };
  }, [user?.id]);

  const marcarComoLeidas =
    async () => {
      const idsNoLeidas =
        notificaciones
          .filter(
            (notificacion) =>
              !notificacion.leido
          )
          .map(
            (notificacion) =>
              notificacion.id_notificacion
          );

      if (
        idsNoLeidas.length === 0
      ) {
        return;
      }

      setNotificaciones(
        (anteriores) =>
          anteriores.map(
            (notificacion) => ({
              ...notificacion,
              leido: true
            })
          )
      );

      setNoLeidas(0);

      const { error } =
        await supabase
          .from("notificaciones")
          .update({
            leido: true
          })
          .in(
            "id_notificacion",
            idsNoLeidas
          );

      if (error) {
        console.error(
          "No se pudieron marcar como leídas:",
          error
        );
      }
    };

  const borrarNotificacion =
    async (
      idNotificacion,
      evento
    ) => {
      evento.preventDefault();
      evento.stopPropagation();

      const notificacion =
        notificaciones.find(
          (item) =>
            item.id_notificacion ===
            idNotificacion
        );

      const { error } =
        await supabase
          .from("notificaciones")
          .delete()
          .eq(
            "id_notificacion",
            idNotificacion
          );

      if (error) {
        console.error(
          "No se pudo borrar la notificación:",
          error
        );

        return;
      }

      setNotificaciones(
        (anteriores) =>
          anteriores.filter(
            (item) =>
              item.id_notificacion !==
              idNotificacion
          )
      );

      if (
        notificacion &&
        !notificacion.leido
      ) {
        setNoLeidas(
          (cantidad) =>
            Math.max(
              0,
              cantidad - 1
            )
        );
      }
    };

  const vaciarNotificaciones =
    async () => {
      if (
        notificaciones.length === 0
      ) {
        return;
      }

      const confirmar =
        window.confirm(
          "¿Deseas eliminar todas las notificaciones?"
        );

      if (!confirmar) {
        return;
      }

      const ids =
        notificaciones.map(
          (notificacion) =>
            notificacion.id_notificacion
        );

      const { error } =
        await supabase
          .from("notificaciones")
          .delete()
          .in(
            "id_notificacion",
            ids
          );

      if (error) {
        console.error(
          "No se pudieron eliminar las notificaciones:",
          error
        );

        return;
      }

      setNotificaciones([]);
      setNoLeidas(0);
    };

  const abrirCarrito = () => {
    if (
      location.pathname ===
      "/catalogo"
    ) {
      window.dispatchEvent(
        new Event("abrirCarrito")
      );

      return;
    }

    navigate("/catalogo");

    setTimeout(() => {
      window.dispatchEvent(
        new Event("abrirCarrito")
      );
    }, 250);
  };

  const cerrarSesion =
    async () => {
      try {
        await signOut();

        setMostrarMenu(false);

        navigate(
          "/login",
          {
            replace: true
          }
        );
      } catch (error) {
        console.error(
          "Error cerrando sesión:",
          error
        );
      }
    };

  const AvatarUsuario = ({
    movil = false
  }) => {
    if (fotoUrl) {
      return (
        <img
          src={fotoUrl}
          alt="Foto del usuario"
          className={
            movil
              ? "liquid-mobile-user-photo"
              : "liquid-user-photo"
          }
        />
      );
    }

    return (
      <span
        className={
          movil
            ? "liquid-mobile-user-avatar"
            : "liquid-user-avatar"
        }
      >
        {inicialUsuario}
      </span>
    );
  };

  const NotificacionesDropdown =
    () => (
      <Dropdown
        align="end"
        className="liquid-notification-dropdown"
        onToggle={(abierto) => {
          if (abierto) {
            marcarComoLeidas();
          }
        }}
      >
        <Dropdown.Toggle
          variant="link"
          className="liquid-navbar-icon-btn position-relative"
          aria-label="Notificaciones"
        >
          <i className="bi bi-bell"></i>

          {noLeidas > 0 && (
            <span className="liquid-notification-count">
              {noLeidas > 99
                ? "99+"
                : noLeidas}
            </span>
          )}
        </Dropdown.Toggle>

        <Dropdown.Menu className="liquid-dropdown-menu liquid-notifications-menu">
          <div className="liquid-dropdown-header">
            <div>
              <strong>
                Notificaciones
              </strong>

              <small>
                {notificaciones.length ===
                0
                  ? "No tienes novedades"
                  : `${notificaciones.length} notificaciones`}
              </small>
            </div>

            {notificaciones.length >
              0 && (
              <button
                type="button"
                className="liquid-clear-notifications"
                onClick={
                  vaciarNotificaciones
                }
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="liquid-notifications-list">
            {notificaciones.length ===
            0 ? (
              <div className="liquid-empty-notifications">
                <span>
                  <i className="bi bi-bell-slash"></i>
                </span>

                <p>
                  No hay notificaciones
                </p>
              </div>
            ) : (
              notificaciones.map(
                (notificacion) => (
                  <Dropdown.Item
                    key={
                      notificacion.id_notificacion
                    }
                    className={`liquid-notification-item ${
                      !notificacion.leido
                        ? "unread"
                        : ""
                    }`}
                  >
                    <span className="liquid-notification-icon">
                      <i className="bi bi-bell-fill"></i>
                    </span>

                    <span className="liquid-notification-content">
                      <strong>
                        {
                          notificacion.titulo
                        }
                      </strong>

                      <small>
                        {
                          notificacion.mensaje
                        }
                      </small>
                    </span>

                    <button
                      type="button"
                      className="liquid-delete-notification"
                      onClick={(
                        evento
                      ) =>
                        borrarNotificacion(
                          notificacion.id_notificacion,
                          evento
                        )
                      }
                      aria-label="Eliminar notificación"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </Dropdown.Item>
                )
              )
            )}
          </div>
        </Dropdown.Menu>
      </Dropdown>
    );

  const PerfilDropdown = () => (
    <Dropdown
      align="end"
      className="liquid-profile-dropdown"
    >
      <Dropdown.Toggle
        variant="link"
        className="liquid-profile-toggle"
      >
        <AvatarUsuario />

        <span className="liquid-profile-information">
          <strong>
            {nombreUsuario}
          </strong>

          <small>
            {role || "Usuario"}
          </small>
        </span>

        <i className="bi bi-chevron-down"></i>
      </Dropdown.Toggle>

      <Dropdown.Menu className="liquid-dropdown-menu liquid-profile-menu">
        <div className="liquid-profile-menu-header">
          <AvatarUsuario movil />

          <div>
            <strong>
              {nombreUsuario}
            </strong>

            <small>
              {user?.email}
            </small>
          </div>
        </div>

        {role === "comprador" && (
          <Dropdown.Item
            onClick={() =>
              navegar("/perfil")
            }
          >
            <i className="bi bi-person"></i>
            Mi perfil
          </Dropdown.Item>
        )}

        <Dropdown.Item
          onClick={() =>
            navegar(
              "/seleccion-rol"
            )
          }
        >
          <i className="bi bi-arrow-left-right"></i>
          Cambiar de rol
        </Dropdown.Item>

        <Dropdown.Divider />

        <Dropdown.Item
          onClick={
            cerrarSesion
          }
          className="liquid-logout-item"
        >
          <i className="bi bi-box-arrow-right"></i>
          Cerrar sesión
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );

  const MobileBottomItem = ({
    ruta,
    icono,
    texto
  }) => (
    <button
      type="button"
      className={`liquid-mobile-bottom-item ${
        esRutaActiva(ruta)
          ? "active"
          : ""
      }`}
      onClick={() =>
        navegar(ruta)
      }
    >
      <span className="liquid-mobile-bottom-icon">
        <i
          className={`bi bi-${icono}`}
        ></i>
      </span>

      <small>{texto}</small>
    </button>
  );

  return (
    <>
      <Navbar
        fixed="top"
        expand="md"
        className={`liquid-navbar ${
          scrolled
            ? "scrolled"
            : ""
        }`}
      >
        <Container
          fluid="lg"
          className="liquid-navbar-container"
        >
          <Navbar.Brand
            className="liquid-navbar-brand-wrapper"
            onClick={() =>
              navegar(rutaInicio)
            }
          >
            <img
              src={logo}
              alt="InterMarket"
              className="liquid-navbar-logo"
            />

            <span className="liquid-navbar-brand">
              InterMarket
            </span>
          </Navbar.Brand>

          {/* ACCIONES MÓVILES */}
          <div className="liquid-navbar-mobile-actions d-md-none">
            {user && !esLogin && (
              <NotificacionesDropdown />
            )}

            {role === "comprador" &&
              !esLogin && (
                <button
                  type="button"
                  className="liquid-navbar-icon-btn liquid-mobile-cart-button"
                  onClick={
                    abrirCarrito
                  }
                  aria-label="Abrir carrito"
                >
                  <i className="bi bi-cart3"></i>

                  {carritoCount >
                    0 && (
                    <span className="liquid-cart-count">
                      {carritoCount >
                      99
                        ? "99+"
                        : carritoCount}
                    </span>
                  )}
                </button>
              )}

            <button
              type="button"
              className="liquid-navbar-menu-button"
              onClick={() =>
                setMostrarMenu(true)
              }
              aria-controls="liquid-mobile-menu"
              aria-label="Abrir menú"
            >
              <i className="bi bi-list"></i>
            </button>
          </div>

          {/* NAVEGACIÓN DE ESCRITORIO */}
          <Navbar.Collapse className="liquid-desktop-navbar d-none d-md-flex">
            <Nav className="liquid-desktop-nav">
              {role === "admin" && (
                <>
                  <Nav.Link
                    className={
                      esRutaActiva(
                        "/admin-inicio"
                      )
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      navegar(
                        "/admin-inicio"
                      )
                    }
                  >
                    Administración
                  </Nav.Link>

                  <Nav.Link
                    className={
                      esRutaActiva(
                        "/dasboard-admin"
                      )
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      navegar(
                        "/dasboard-admin"
                      )
                    }
                  >
                    Dashboard
                  </Nav.Link>
                </>
              )}

              {role === "vendedor" && (
                <>
                  <Nav.Link
                    className={
                      esRutaActiva(
                        "/vendedor"
                      )
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      navegar(
                        "/vendedor"
                      )
                    }
                  >
                    Inicio
                  </Nav.Link>

                  <Nav.Link
                    className={
                      esRutaActiva(
                        "/productos"
                      )
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      navegar(
                        "/productos"
                      )
                    }
                  >
                    Productos
                  </Nav.Link>

                  <Nav.Link
                    className={
                      esRutaActiva(
                        "/tiendas"
                      )
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      navegar(
                        "/tiendas"
                      )
                    }
                  >
                    Tienda
                  </Nav.Link>

                  <Nav.Link
                    className={
                      esRutaActiva(
                        "/envios"
                      )
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      navegar(
                        "/envios"
                      )
                    }
                  >
                    Envíos
                  </Nav.Link>
                </>
              )}

              {role === "comprador" && (
                <Nav.Link
                  className={
                    esRutaActiva(
                      "/catalogo"
                    )
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    navegar(
                      "/catalogo"
                    )
                  }
                >
                  Catálogo
                </Nav.Link>
              )}

              {user && (
                <Nav.Link
                  className={
                    esRutaActiva(
                      "/mensajes"
                    )
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    navegar(
                      "/mensajes"
                    )
                  }
                >
                  Mensajes
                </Nav.Link>
              )}
            </Nav>

            <div className="liquid-navbar-desktop-actions">
              {user && !esLogin && (
                <NotificacionesDropdown />
              )}

              {role === "comprador" &&
                !esLogin && (
                  <button
                    type="button"
                    className="liquid-navbar-cart-btn"
                    onClick={
                      abrirCarrito
                    }
                  >
                    <i className="bi bi-cart3"></i>

                    <span>
                      Carrito
                    </span>

                    {carritoCount >
                      0 && (
                      <Badge className="liquid-desktop-cart-count">
                        {
                          carritoCount
                        }
                      </Badge>
                    )}
                  </button>
                )}

              {user ? (
                <PerfilDropdown />
              ) : (
                <button
                  type="button"
                  className="liquid-login-button"
                  onClick={() =>
                    navegar(
                      "/login"
                    )
                  }
                >
                  <i className="bi bi-person-circle"></i>
                  Acceso
                </button>
              )}
            </div>
          </Navbar.Collapse>

          {/* MENÚ LATERAL SOLO MÓVIL */}
          <Navbar.Offcanvas
            id="liquid-mobile-menu"
            aria-labelledby="liquid-mobile-menu-title"
            placement="end"
            show={mostrarMenu}
            onHide={() =>
              setMostrarMenu(false)
            }
            className="liquid-mobile-offcanvas d-md-none"
          >
            <Offcanvas.Header
              closeButton
              className="liquid-offcanvas-header"
            >
              <Offcanvas.Title id="liquid-mobile-menu-title">
                InterMarket
              </Offcanvas.Title>
            </Offcanvas.Header>

            <Offcanvas.Body className="liquid-offcanvas-body">
              {user ? (
                <>
                  <div className="liquid-offcanvas-user">
                    <AvatarUsuario movil />

                    <div>
                      <strong>
                        {nombreUsuario}
                      </strong>

                      <small>
                        {user.email}
                      </small>

                      <span className="liquid-role-badge">
                        {role}
                      </span>
                    </div>
                  </div>

                  <nav className="liquid-offcanvas-nav">
                    {role ===
                      "admin" && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            navegar(
                              "/admin-inicio"
                            )
                          }
                        >
                          <i className="bi bi-grid"></i>
                          Administración
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navegar(
                              "/dasboard-admin"
                            )
                          }
                        >
                          <i className="bi bi-bar-chart"></i>
                          Dashboard
                        </button>
                      </>
                    )}

                    {role ===
                      "vendedor" && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            navegar(
                              "/vendedor"
                            )
                          }
                        >
                          <i className="bi bi-house"></i>
                          Inicio
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navegar(
                              "/productos"
                            )
                          }
                        >
                          <i className="bi bi-box-seam"></i>
                          Mis productos
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navegar(
                              "/tiendas"
                            )
                          }
                        >
                          <i className="bi bi-shop"></i>
                          Mi tienda
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navegar(
                              "/envios"
                            )
                          }
                        >
                          <i className="bi bi-truck"></i>
                          Envíos
                        </button>
                      </>
                    )}

                    {role ===
                      "comprador" && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            navegar(
                              "/catalogo"
                            )
                          }
                        >
                          <i className="bi bi-grid"></i>
                          Catálogo
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navegar(
                              "/perfil"
                            )
                          }
                        >
                          <i className="bi bi-person"></i>
                          Mi perfil
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        navegar(
                          "/mensajes"
                        )
                      }
                    >
                      <i className="bi bi-chat-dots"></i>
                      Mensajes
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        navegar(
                          "/seleccion-rol"
                        )
                      }
                    >
                      <i className="bi bi-arrow-left-right"></i>
                      Cambiar de rol
                    </button>

                    <button
                      type="button"
                      className="liquid-offcanvas-logout"
                      onClick={
                        cerrarSesion
                      }
                    >
                      <i className="bi bi-box-arrow-right"></i>
                      Cerrar sesión
                    </button>
                  </nav>
                </>
              ) : (
                <nav className="liquid-offcanvas-nav">
                  <button
                    type="button"
                    onClick={() =>
                      navegar(
                        "/catalogo"
                      )
                    }
                  >
                    <i className="bi bi-grid"></i>
                    Ver catálogo
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      navegar(
                        "/login"
                      )
                    }
                  >
                    <i className="bi bi-person-circle"></i>
                    Iniciar sesión
                  </button>
                </nav>
              )}
            </Offcanvas.Body>
          </Navbar.Offcanvas>
        </Container>
      </Navbar>

      {/* BARRA INFERIOR SOLO MÓVIL */}
      {!esLogin && user && (
        <nav className="liquid-mobile-bottom-nav d-md-none">
          {role ===
            "comprador" && (
            <>
              <MobileBottomItem
                ruta="/catalogo"
                icono="grid"
                texto="Catálogo"
              />

              <button
                type="button"
                className="liquid-mobile-bottom-item"
                onClick={
                  abrirCarrito
                }
              >
                <span className="liquid-mobile-bottom-icon">
                  <i className="bi bi-cart3"></i>

                  {carritoCount >
                    0 && (
                    <span className="liquid-bottom-cart-count">
                      {
                        carritoCount
                      }
                    </span>
                  )}
                </span>

                <small>
                  Carrito
                </small>
              </button>

              <MobileBottomItem
                ruta="/mensajes"
                icono="chat-dots"
                texto="Mensajes"
              />

              <MobileBottomItem
                ruta="/perfil"
                icono="person"
                texto="Perfil"
              />
            </>
          )}

          {role ===
            "vendedor" && (
            <>
              <MobileBottomItem
                ruta="/vendedor"
                icono="house"
                texto="Inicio"
              />

              <MobileBottomItem
                ruta="/productos"
                icono="box-seam"
                texto="Productos"
              />

              <MobileBottomItem
                ruta="/tiendas"
                icono="shop"
                texto="Tienda"
              />

              <MobileBottomItem
                ruta="/mensajes"
                icono="chat-dots"
                texto="Mensajes"
              />
            </>
          )}

          {role ===
            "admin" && (
            <>
              <MobileBottomItem
                ruta="/admin-inicio"
                icono="grid"
                texto="Admin"
              />

              <MobileBottomItem
                ruta="/dasboard-admin"
                icono="bar-chart"
                texto="Dashboard"
              />

              <MobileBottomItem
                ruta="/mensajes"
                icono="chat-dots"
                texto="Mensajes"
              />

              <button
                type="button"
                className="liquid-mobile-bottom-item"
                onClick={() =>
                  setMostrarMenu(true)
                }
              >
                <span className="liquid-mobile-bottom-icon">
                  <i className="bi bi-list"></i>
                </span>

                <small>
                  Más
                </small>
              </button>
            </>
          )}
        </nav>
      )}
    </>
  );
};

export default Encabezado;
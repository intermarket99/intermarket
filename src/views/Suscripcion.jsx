import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, Spinner } from "react-bootstrap";

import { useAuth } from "../context/AuthContext";
import { supabase } from "../database/supabaseconfig";

const sufijoDuracion = (duracion) => {
  switch (duracion) {
    case "Mensual":
      return "/mes";
    case "Trimestral":
      return "/trimestre";
    case "Anual":
      return "/año";
    default:
      return "";
  }
};

const obtenerDiasPlan = (duracion) => {
  switch (duracion) {
    case "Trimestral":
      return 90;
    case "Anual":
      return 365;
    default:
      return 30;
  }
};

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

const Suscripcion = () => {
  const navigate = useNavigate();
  const { user, changeRole } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [btnActivo, setBtnActivo] = useState("primario");

  const [mostrarPago, setMostrarPago] = useState(false);
  const [tarjetaGirando, setTarjetaGirando] = useState(false);

  const [numeroTarjeta, setNumeroTarjeta] = useState("");
  const [titular, setTitular] = useState("");
  const [vencimiento, setVencimiento] = useState("");
  const [cvv, setCvv] = useState("");

  const planes = [
    {
      id: "plan_bronce",
      nombre: "Plan Bronce",
      precio: 9.99,
      duracion: "Mensual",
      caracteristicas: [
        "Hasta 50 productos",
        "Soporte por email",
        "Estadísticas básicas",
        "Panel de vendedor"
      ],
      popular: false
    },
    {
      id: "plan_plata",
      nombre: "Plan Plata",
      precio: 24.99,
      duracion: "Trimestral",
      caracteristicas: [
        "Hasta 200 productos",
        "Soporte prioritario",
        "Estadísticas avanzadas",
        "Destacados en catálogo"
      ],
      popular: true
    },
    {
      id: "plan_oro",
      nombre: "Plan Oro",
      precio: 79.99,
      duracion: "Anual",
      caracteristicas: [
        "Productos ilimitados",
        "Soporte 24/7",
        "Asesoría de marketing",
        "Cero comisiones por venta"
      ],
      popular: false
    }
  ];

  const [planSeleccionado, setPlanSeleccionado] = useState(
    () => planes.find((plan) => plan.popular) || planes[0]
  );

  const tipoTarjeta = useMemo(
    () => detectarTipoTarjeta(numeroTarjeta),
    [numeroTarjeta]
  );

  const ultimosCuatro = useMemo(() => {
    const limpio = limpiarNumeroTarjeta(numeroTarjeta);
    return limpio.slice(-4);
  }, [numeroTarjeta]);

  const abrirPasarela = () => {
    setError(null);

    if (!user?.id) {
      setError("Debes iniciar sesión para continuar.");
      return;
    }

    setMostrarPago(true);
  };

  const limpiarFormularioPago = () => {
    setNumeroTarjeta("");
    setTitular("");
    setVencimiento("");
    setCvv("");
    setTarjetaGirando(false);
  };

  const asegurarPerfil = async () => {
    const {
      data: perfiles,
      error: perfilConsultaError
    } = await supabase
      .from("perfiles")
      .select("perfil_id, id_usuario, id_tienda")
      .eq("id_usuario", user.id)
      .limit(1);

    if (perfilConsultaError) {
      throw new Error(
        `No se pudo comprobar el perfil: ${perfilConsultaError.message}`
      );
    }

    if (perfiles?.length > 0) {
      return perfiles[0];
    }

    const {
      data: perfilCreado,
      error: perfilCrearError
    } = await supabase
      .from("perfiles")
      .insert({
        id_usuario: user.id,
        id_tienda: null,
        foto_perfil: null
      })
      .select("perfil_id, id_usuario, id_tienda")
      .single();

    if (perfilCrearError) {
      throw new Error(
        `No se pudo crear el perfil: ${perfilCrearError.message}`
      );
    }

    return perfilCreado;
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

    const [mesTexto, añoTexto] = vencimiento.split("/");
    const mes = Number(mesTexto);
    const año = Number(`20${añoTexto}`);

    if (mes < 1 || mes > 12) {
      throw new Error("El mes de vencimiento no es válido.");
    }

    const ahora = new Date();
    const finDelMes = new Date(año, mes, 0, 23, 59, 59);

    if (finDelMes < ahora) {
      throw new Error("La tarjeta se encuentra vencida.");
    }

    if (!/^\d{3,4}$/.test(cvv)) {
      throw new Error("El CVV debe contener 3 o 4 números.");
    }
  };

  const registrarMetodoPago = async () => {
    /*
     * Por seguridad:
     * - No guardamos el número completo.
     * - No guardamos el CVV.
     * - Solo guardamos los últimos cuatro dígitos y el tipo.
     */
    const {
      error: metodoError
    } = await supabase
      .from("metodos_pago")
      .insert({
        id_usuario: user.id,
        id_stripe_customer: null,
        id_stripe_payment_method: null,
        ultimo4: ultimosCuatro,
        tipo_metodo: tipoTarjeta
      });

    if (metodoError) {
      throw new Error(
        `No se pudo registrar el método de pago: ${metodoError.message}`
      );
    }
  };

  const registrarSuscripcion = async () => {
    const dias = obtenerDiasPlan(planSeleccionado.duracion);

    const fechaInicio = new Date();
    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaFin.getDate() + dias);

    const {
      error: cancelarAnteriorError
    } = await supabase
      .from("suscripciones")
      .update({
        estado: "cancelado"
      })
      .eq("id_usuario", user.id)
      .eq("estado", "activo");

    if (cancelarAnteriorError) {
      console.warn(
        "No se pudo cancelar la suscripción anterior:",
        cancelarAnteriorError
      );
    }

    const {
      data: suscripcionCreada,
      error: suscripcionError
    } = await supabase
      .from("suscripciones")
      .insert({
        id_usuario: user.id,
        plan: planSeleccionado.nombre,
        estado: "activo",
        monto: planSeleccionado.precio,
        fecha_inicio: fechaInicio.toISOString(),
        fecha_fin: fechaFin.toISOString()
      })
      .select()
      .single();

    if (suscripcionError) {
      throw new Error(
        `No se pudo registrar la suscripción: ${suscripcionError.message}`
      );
    }

    return suscripcionCreada;
  };

  const convertirEnVendedor = async () => {
    const {
      error: rolError
    } = await supabase
      .from("usuarios")
      .update({
        rol: "vendedor"
      })
      .eq("id_usuario", user.id);

    if (rolError) {
      throw new Error(
        `No se pudo activar el rol de vendedor: ${rolError.message}`
      );
    }

    await asegurarPerfil();

    localStorage.setItem("rol-activo", "vendedor");

    if (typeof changeRole === "function") {
      changeRole("vendedor");
    }
  };

  const procesarPago = async (evento) => {
    evento.preventDefault();

    setLoading(true);
    setError(null);

    try {
      if (!user?.id) {
        throw new Error("La sesión no está disponible.");
      }

      validarFormularioPago();

      /*
       * Simulación breve de autorización.
       * Aquí se conectará el proveedor de pagos real posteriormente.
       */
      await new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });

      await registrarMetodoPago();
      await registrarSuscripcion();
      await convertirEnVendedor();

      limpiarFormularioPago();
      setMostrarPago(false);

      navigate("/vendedor", {
        replace: true
      });
    } catch (err) {
      console.error("Error procesando el pago:", err);

      setError(
        err.message ||
          "No se pudo completar el pago."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="susc-page">
        <div
          className="susc-blob blob-a"
          aria-hidden="true"
        />

        <div
          className="susc-blob blob-b"
          aria-hidden="true"
        />

        <div className="susc-wrapper">
          <div className="susc-header">
            <h1 className="susc-title">
              Activa tu tienda
            </h1>

            <p className="susc-subtitle">
              Elige tu plan para comenzar a vender
            </p>
          </div>

          {error && !mostrarPago && (
            <div className="susc-alert">
              {error}
            </div>
          )}

          <div className="susc-planes">
            {planes.map((plan) => {
              const seleccionado =
                planSeleccionado.id === plan.id;

              return (
                <div
                  key={plan.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={seleccionado}
                  className={`susc-plan-card ${
                    seleccionado ? "is-selected" : ""
                  }`}
                  onClick={() => setPlanSeleccionado(plan)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" ||
                      event.key === " "
                    ) {
                      event.preventDefault();
                      setPlanSeleccionado(plan);
                    }
                  }}
                >
                  {plan.popular && (
                    <span className="susc-badge-popular">
                      Más popular
                    </span>
                  )}

                  <div className="susc-plan-top">
                    <span className="susc-plan-nombre">
                      {plan.nombre}
                    </span>

                    <span className="susc-plan-precio">
                      ${plan.precio.toFixed(2)}

                      <small>
                        {sufijoDuracion(plan.duracion)}
                      </small>
                    </span>
                  </div>

                  <p className="susc-plan-desc">
                    {plan.caracteristicas
                      .slice(0, 2)
                      .join(", ")}
                  </p>

                  <span
                    className="susc-plan-check"
                    aria-hidden="true"
                  >
                    <i className="bi bi-check-lg" />
                  </span>
                </div>
              );
            })}
          </div>

          <div className="susc-actions">
            <button
              type="button"
              className={`susc-btn susc-btn-primary ${
                btnActivo === "primario"
                  ? "is-active"
                  : "is-inactive"
              }`}
              onClick={abrirPasarela}
              onMouseEnter={() => setBtnActivo("primario")}
              onFocus={() => setBtnActivo("primario")}
              disabled={loading}
            >
              <span
                className="susc-btn-sheen"
                aria-hidden="true"
              />

              <span className="susc-btn-label">
                Continuar al pago
              </span>
            </button>

            <button
              type="button"
              className={`susc-btn susc-btn-secondary ${
                btnActivo === "secundario"
                  ? "is-active"
                  : "is-inactive"
              }`}
              onClick={() => navigate("/seleccion-rol")}
              onMouseEnter={() => setBtnActivo("secundario")}
              onMouseLeave={() => setBtnActivo("primario")}
              onFocus={() => setBtnActivo("secundario")}
              onBlur={() => setBtnActivo("primario")}
              disabled={loading}
            >
              <span
                className="susc-btn-sheen"
                aria-hidden="true"
              />

              <span className="susc-btn-label">
                Cancelar
              </span>
            </button>
          </div>
        </div>
      </section>

      <Modal
        show={mostrarPago}
        onHide={() => {
          if (!loading) {
            setMostrarPago(false);
            setTarjetaGirando(false);
            setError(null);
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
                setMostrarPago(false);
                setTarjetaGirando(false);
                setError(null);
              }}
              disabled={loading}
              aria-label="Cerrar"
            >
              <i className="bi bi-x-lg" />
            </button>

            <div className="payment-heading">
              <span>Pago seguro</span>
              <h2>Completa tu suscripción</h2>
              <p>
                Esta pantalla simula el pago para pruebas del sistema.
              </p>
            </div>

            <div className="payment-layout">
              <div className="payment-card-column">
                <div
                  className={`payment-card-scene ${
                    tarjetaGirando ? "is-flipped" : ""
                  }`}
                >
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
                        {numeroTarjeta ||
                          "0000 0000 0000 0000"}
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
                          {tipoTarjeta === "mastercard"
                            ? "Mastercard"
                            : tipoTarjeta === "visa"
                              ? "VISA"
                              : "CARD"}
                        </div>
                      </div>
                    </div>

                    <div className="payment-card-face payment-card-back">
                      <div className="payment-magnetic-strip" />

                      <div className="payment-signature-area">
                        <span>Firma autorizada</span>

                        <strong>
                          {cvv || "CVV"}
                        </strong>
                      </div>

                      <div className="payment-back-name">
                        {titular || "NOMBRE DEL TITULAR"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="payment-summary">
                  <div>
                    <span>Plan seleccionado</span>
                    <strong>{planSeleccionado.nombre}</strong>
                  </div>

                  <div>
                    <span>Duración</span>
                    <strong>{planSeleccionado.duracion}</strong>
                  </div>

                  <div className="payment-summary-total">
                    <span>Total a pagar</span>
                    <strong>
                      ${planSeleccionado.precio.toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>

              <form
                className="payment-form"
                onSubmit={procesarPago}
              >
                {error && (
                  <div className="payment-error">
                    <i className="bi bi-exclamation-circle" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="payment-methods">
                  <span>Método de pago</span>

                  <div className="payment-method-options">
                    <button
                      type="button"
                      className={`payment-method ${
                        tipoTarjeta === "visa"
                          ? "active"
                          : ""
                      }`}
                    >
                      VISA
                    </button>

                    <button
                      type="button"
                      className={`payment-method mastercard ${
                        tipoTarjeta === "mastercard"
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
                      onChange={(event) => {
                        setNumeroTarjeta(
                          formatearNumeroTarjeta(
                            event.target.value
                          )
                        );
                      }}
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
                      onChange={(event) => {
                        setTitular(
                          event.target.value
                            .replace(/[0-9]/g, "")
                            .slice(0, 35)
                            .toUpperCase()
                        );
                      }}
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
                        onChange={(event) => {
                          setVencimiento(
                            formatearVencimiento(
                              event.target.value
                            )
                          );
                        }}
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
                        onChange={(event) => {
                          setCvv(
                            event.target.value
                              .replace(/\D/g, "")
                              .slice(0, 4)
                          );
                        }}
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
                  disabled={loading}
                >
                  {loading ? (
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
                      Pagar ${planSeleccionado.precio.toFixed(2)}
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

export default Suscripcion;
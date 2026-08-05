import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../database/supabaseconfig";


// Traduce la duración del plan al sufijo que se muestra junto al precio
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

const Suscripcion = () => {
  const navigate = useNavigate();
  const { user, role, changeRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const planes = [
    {
      id: "plan_bronce",
      nombre: "Plan Bronce",
      precio: 9.99,
      paymentLink: "https://buy.stripe.com/test_00w5kD3Bd4du8Zz7My04804", // Crea un 'Payment Link' en Stripe
      duracion: "Mensual",
      caracteristicas: [
        "Hasta 50 productos",
        "Soporte por email",
        "Estadísticas básicas",
        "Panel de vendedor"
      ],
      color: "#cd7f32"
    },
    {
      id: "plan_plata",
      nombre: "Plan Plata",
      precio: 24.99,
      paymentLink: "https://buy.stripe.com/test_aFaeVdc7JeS8b7H8QC04803", // Crea un 'Payment Link' en Stripe
      duracion: "Trimestral",
      caracteristicas: [
        "Hasta 200 productos",
        "Soporte prioritario",
        "Estadísticas avanzadas",
        "Destacados en catálogo"
      ],
      color: "#c0c0c0",
      popular: true
    },
    {
      id: "plan_oro",
      nombre: "Plan Oro",
      precio: 79.99,
      paymentLink: "https://buy.stripe.com/test_bJe8wP4FheS82BbeaW04805", // Crea un 'Payment Link' en Stripe
      duracion: "Anual",
      caracteristicas: [
        "Productos ilimitados",
        "Soporte 24/7",
        "Asesoría de marketing",
        "Cero comisiones por venta"
      ],
      color: "#ffd700"
    }
  ];

  // Plan resaltado por defecto: el marcado como "popular", o el primero
  const [planSeleccionado, setPlanSeleccionado] = useState(
    () => planes.find((p) => p.popular) || planes[0]
  );

  // Controla cuál de los dos botones inferiores muestra el cristal
  // (mismo patrón que en VistaRol: solo uno activo a la vez)
  const [btnActivo, setBtnActivo] = useState("primario");

  const handleSuscripcion = async (plan) => {
    setLoading(true);
    setError(null);

    try {
      if (plan.paymentLink.includes("AQUÍ_TU_LINK")) {
        throw new Error("Por favor, configura los Payment Links de Stripe en el código.");
      }

      console.log("Redirigiendo a Stripe Payment Link para el plan:", plan.nombre);

      // La forma más moderna y sencilla en 2026: Redirección directa al link de pago
      window.location.href = plan.paymentLink;
    } catch (err) {
      console.error("Error al procesar suscripción:", err);
      setError(err.message || "Error al conectar con la pasarela de pago.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="susc-page">
      <div className="susc-blob blob-a" aria-hidden="true"></div>
      <div className="susc-blob blob-b" aria-hidden="true"></div>

      <div className="susc-wrapper">
        <div className="susc-header">
          <h1 className="susc-title">Activa tu tienda</h1>
          <p className="susc-subtitle">Elige tu plan para comenzar a vender</p>
        </div>

        {error && <div className="susc-alert">{error}</div>}

        <div className="susc-planes">
          {planes.map((plan) => {
            const seleccionado = planSeleccionado.id === plan.id;
            return (
              <div
                key={plan.id}
                role="button"
                tabIndex={0}
                aria-pressed={seleccionado}
                className={`susc-plan-card ${seleccionado ? "is-selected" : ""}`}
                onClick={() => setPlanSeleccionado(plan)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setPlanSeleccionado(plan);
                  }
                }}
              >
                {plan.popular && <span className="susc-badge-popular">Más popular</span>}

                <div className="susc-plan-top">
                  <span className="susc-plan-nombre">{plan.nombre.replace("Plan ", "Plan ")}</span>
                  <span className="susc-plan-precio">
                    $ {plan.precio.toFixed(2)}
                    <small>{sufijoDuracion(plan.duracion)}</small>
                  </span>
                </div>

                <p className="susc-plan-desc">
                  {plan.caracteristicas.slice(0, 2).join(", ")}
                </p>

                <span className="susc-plan-check" aria-hidden="true">
                  <i className="bi bi-check-lg"></i>
                </span>
              </div>
            );
          })}
        </div>

        <div className="susc-actions">
          <button
            type="button"
            className={`susc-btn susc-btn-primary ${
              btnActivo === "primario" ? "is-active" : "is-inactive"
            }`}
            onClick={() => handleSuscripcion(planSeleccionado)}
            onMouseEnter={() => setBtnActivo("primario")}
            onFocus={() => setBtnActivo("primario")}
            disabled={loading}
          >
            <span className="susc-btn-sheen" aria-hidden="true"></span>
            <span className="susc-btn-label">
              {loading ? <Spinner animation="border" size="sm" /> : "Suscribirse y continuar"}
            </span>
          </button>

          <button
            type="button"
            className={`susc-btn susc-btn-secondary ${
              btnActivo === "secundario" ? "is-active" : "is-inactive"
            }`}
            onClick={() => navigate("/seleccion-rol")}
            onMouseEnter={() => setBtnActivo("secundario")}
            onMouseLeave={() => setBtnActivo("primario")}
            onFocus={() => setBtnActivo("secundario")}
            onBlur={() => setBtnActivo("primario")}
            disabled={loading}
          >
            <span className="susc-btn-sheen" aria-hidden="true"></span>
            <span className="susc-btn-label">Cancela cuando quieras</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Suscripcion;
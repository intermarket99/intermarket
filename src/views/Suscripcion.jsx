import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner } from "react-bootstrap";

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

const Suscripcion = () => {
  const navigate = useNavigate();
  const { user, changeRole } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [btnActivo, setBtnActivo] = useState("primario");

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
      color: "#cd7f32"
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
      color: "#c0c0c0",
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
      color: "#ffd700"
    }
  ];

  const [planSeleccionado, setPlanSeleccionado] = useState(
    () => planes.find((plan) => plan.popular) || planes[0]
  );

  const handleSuscripcion = async (plan) => {
    setLoading(true);
    setError(null);

    try {
      if (!user?.id) {
        throw new Error(
          "Debes iniciar sesión para continuar."
        );
      }

      console.log(
        "Activando acceso de vendedor con el plan:",
        plan.nombre
      );

      const {
        data: usuarioActualizado,
        error: actualizarRolError
      } = await supabase
        .from("usuarios")
        .update({
          rol: "vendedor"
        })
        .eq("id_usuario", user.id)
        .select("id_usuario, username, email, rol")
        .single();

      if (actualizarRolError) {
        throw new Error(
          `No se pudo cambiar el rol: ${actualizarRolError.message}`
        );
      }

      console.log(
        "Usuario actualizado:",
        usuarioActualizado
      );

      const {
        data: perfilExistente,
        error: consultarPerfilError
      } = await supabase
        .from("perfiles")
        .select("perfil_id, id_usuario, id_tienda")
        .eq("id_usuario", user.id)
        .maybeSingle();

      if (consultarPerfilError) {
        throw new Error(
          `No se pudo consultar el perfil: ${consultarPerfilError.message}`
        );
      }

      if (!perfilExistente) {
        const {
          data: perfilCreado,
          error: crearPerfilError
        } = await supabase
          .from("perfiles")
          .insert({
            id_usuario: user.id,
            id_tienda: null,
            foto_perfil: null
          })
          .select()
          .single();

        if (crearPerfilError) {
          throw new Error(
            `No se pudo crear el perfil: ${crearPerfilError.message}`
          );
        }

        console.log(
          "Perfil creado:",
          perfilCreado
        );
      } else {
        console.log(
          "Perfil existente:",
          perfilExistente
        );
      }

      localStorage.setItem(
        "rol-activo",
        "vendedor"
      );

      if (typeof changeRole === "function") {
        changeRole("vendedor");
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 200);
      });

      navigate("/vendedor", {
        replace: true
      });
    } catch (err) {
      console.error(
        "Error entrando como vendedor:",
        err
      );

      setError(
        err.message ||
          "No se pudo activar el acceso de vendedor."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="susc-page">
      <div
        className="susc-blob blob-a"
        aria-hidden="true"
      ></div>

      <div
        className="susc-blob blob-b"
        aria-hidden="true"
      ></div>

      <div className="susc-wrapper">
        <div className="susc-header">
          <h1 className="susc-title">
            Activa tu tienda
          </h1>

          <p className="susc-subtitle">
            Elige tu plan para comenzar a vender
          </p>
        </div>

        {error && (
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
                onClick={() =>
                  setPlanSeleccionado(plan)
                }
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
                    $ {plan.precio.toFixed(2)}

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
              btnActivo === "primario"
                ? "is-active"
                : "is-inactive"
            }`}
            onClick={() =>
              handleSuscripcion(planSeleccionado)
            }
            onMouseEnter={() =>
              setBtnActivo("primario")
            }
            onFocus={() =>
              setBtnActivo("primario")
            }
            disabled={loading}
          >
            <span
              className="susc-btn-sheen"
              aria-hidden="true"
            ></span>

            <span className="susc-btn-label">
              {loading ? (
                <>
                  <Spinner
                    animation="border"
                    size="sm"
                    className="me-2"
                  />
                  Entrando...
                </>
              ) : (
                "Suscribirse y continuar"
              )}
            </span>
          </button>

          <button
            type="button"
            className={`susc-btn susc-btn-secondary ${
              btnActivo === "secundario"
                ? "is-active"
                : "is-inactive"
            }`}
            onClick={() =>
              navigate("/seleccion-rol")
            }
            onMouseEnter={() =>
              setBtnActivo("secundario")
            }
            onMouseLeave={() =>
              setBtnActivo("primario")
            }
            onFocus={() =>
              setBtnActivo("secundario")
            }
            onBlur={() =>
              setBtnActivo("primario")
            }
            disabled={loading}
          >
            <span
              className="susc-btn-sheen"
              aria-hidden="true"
            ></span>

            <span className="susc-btn-label">
              Cancelar
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Suscripcion;
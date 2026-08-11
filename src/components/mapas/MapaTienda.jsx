import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Alert,
  Button,
  Spinner,
} from "react-bootstrap";

import {
  cargarGoogleMaps,
  GOOGLE_MAP_ID,
} from "../../services/googleMaps";

const MapaTienda = ({
  tienda,
  activo = true,
}) => {

  const mapContainerRef =
    useRef(null);

  const [cargando, setCargando] =
    useState(false);

  const [error, setError] =
    useState("");

  const lat =
    Number(tienda?.latitud);

  const lng =
    Number(tienda?.longitud);

  const tieneUbicacion =
    tienda?.latitud !== null &&
    tienda?.latitud !== undefined &&
    tienda?.latitud !== "" &&
    tienda?.longitud !== null &&
    tienda?.longitud !== undefined &&
    tienda?.longitud !== "" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng);

  useEffect(() => {

    if (
      !activo ||
      !tieneUbicacion ||
      !mapContainerRef.current
    ) {
      return;
    }

    let cancelado = false;

    const iniciarMapa = async () => {

      setCargando(true);
      setError("");

      try {

        const maps =
          await cargarGoogleMaps();

        const {
          AdvancedMarkerElement,
        } =
          await maps.importLibrary(
            "marker"
          );

        if (
          cancelado ||
          !mapContainerRef.current
        ) {
          return;
        }

        const posicion = {
          lat,
          lng,
        };

        const map =
          new maps.Map(
            mapContainerRef.current,
            {
              center: posicion,
              zoom: 17,

              mapId:
                GOOGLE_MAP_ID,

              streetViewControl:
                false,

              mapTypeControl:
                false,

              fullscreenControl:
                true,

              clickableIcons:
                false,
            }
          );

        new AdvancedMarkerElement({
          map,
          position: posicion,
          title:
            tienda?.nombre_tienda ||
            "Tienda",
        });

      } catch (err) {

        console.error(err);

        setError(
          "No se pudo mostrar el mapa."
        );

      } finally {

        if (!cancelado) {
          setCargando(false);
        }

      }
    };

    iniciarMapa();

    return () => {
      cancelado = true;
    };

  }, [
    activo,
    tieneUbicacion,
    lat,
    lng,
    tienda?.nombre_tienda,
  ]);

  if (!tieneUbicacion) {
    return null;
  }

  const abrirComoLlegar = () => {

    const destino =
      `${lat},${lng}`;

    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        destino
      )}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <section
      className="px-4 pt-3 pb-3 bg-white border-bottom"
    >

      <div
        className="d-flex align-items-start justify-content-between gap-3 mb-2"
      >

        <div>

          <h6 className="fw-bold mb-1">

            <i
              className="bi bi-geo-alt-fill me-2"
              style={{
                color: "#0d5c63",
              }}
            />

            Ubicación de la tienda

          </h6>

          {tienda?.direccion && (

            <p
              className="text-muted small mb-0"
            >
              {tienda.direccion}
            </p>

          )}

        </div>

        <Button
          type="button"
          size="sm"
          onClick={
            abrirComoLlegar
          }
          className="rounded-pill flex-shrink-0 border-0"
          style={{
            backgroundColor:
              "#0d5c63",
          }}
        >

          <i className="bi bi-sign-turn-right-fill me-1" />

          Cómo llegar

        </Button>

      </div>

      <div
        style={{
          height: 230,
          borderRadius: 14,
          overflow: "hidden",
          position: "relative",
          background: "#e8f4f8",
        }}
      >

        <div
          ref={mapContainerRef}
          style={{
            width: "100%",
            height: "100%",
          }}
        />

        {cargando && (

          <div
            className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{
              background:
                "rgba(255,255,255,.82)",
            }}
          >

            <Spinner
              animation="border"
              style={{
                color: "#0d5c63",
              }}
            />

          </div>

        )}

      </div>

      {error && (

        <Alert
          variant="warning"
          className="py-2 mt-2 mb-0 small"
        >
          {error}
        </Alert>

      )}

    </section>
  );
};

export default MapaTienda;
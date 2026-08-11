import React, { useEffect, useRef, useState } from "react";
import { Button, Form, Spinner, Alert } from "react-bootstrap";
import {
  cargarGoogleMaps,
  GOOGLE_MAP_ID,
} from "../../services/googleMaps";

const CENTRO_NICARAGUA = {
  lat: 12.8654,
  lng: -85.2072,
};

const SelectorUbicacionTienda = ({
  value,
  onChange,
  activo = true,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);

  const [busqueda, setBusqueda] = useState(
    value?.direccion || ""
  );

  const [cargandoMapa, setCargandoMapa] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState("");

  const actualizarUbicacion = async (
    posicion,
    obtenerDireccion = true
  ) => {
    if (!mapInstanceRef.current || !markerRef.current) {
      return;
    }

    markerRef.current.position = posicion;

    mapInstanceRef.current.panTo(posicion);
    mapInstanceRef.current.setZoom(17);

    let direccion =
      value?.direccion || busqueda || "";

    if (obtenerDireccion && geocoderRef.current) {
      try {
        const respuesta =
          await geocoderRef.current.geocode({
            location: posicion,
          });

        direccion =
          respuesta.results?.[0]?.formatted_address ||
          direccion;

        setBusqueda(direccion);
      } catch (err) {
        console.warn(
          "No se pudo obtener la dirección:",
          err
        );
      }
    }

    onChange({
      direccion,
      latitud: Number(posicion.lat),
      longitud: Number(posicion.lng),
    });
  };

  useEffect(() => {
    if (
      !activo ||
      !mapContainerRef.current ||
      mapInstanceRef.current
    ) {
      return;
    }

    let cancelado = false;

    const iniciarMapa = async () => {
      setCargandoMapa(true);
      setError("");

      try {
        const maps = await cargarGoogleMaps();

        const { AdvancedMarkerElement } =
          await maps.importLibrary("marker");

        if (
          cancelado ||
          !mapContainerRef.current
        ) {
          return;
        }

        const tieneCoordenadas =
          value?.latitud !== null &&
          value?.latitud !== undefined &&
          value?.latitud !== "" &&
          value?.longitud !== null &&
          value?.longitud !== undefined &&
          value?.longitud !== "" &&
          Number.isFinite(Number(value.latitud)) &&
          Number.isFinite(Number(value.longitud));

        const centro = tieneCoordenadas
          ? {
              lat: Number(value.latitud),
              lng: Number(value.longitud),
            }
          : CENTRO_NICARAGUA;

        const map = new maps.Map(
          mapContainerRef.current,
          {
            center: centro,
            zoom: tieneCoordenadas ? 17 : 7,
            mapId: GOOGLE_MAP_ID,

            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            clickableIcons: false,
          }
        );

        const marker =
          new AdvancedMarkerElement({
            map,
            position: centro,
            title: "Ubicación de la tienda",
          });

        mapInstanceRef.current = map;
        markerRef.current = marker;
        geocoderRef.current =
          new maps.Geocoder();

        map.addListener("click", (event) => {
          if (!event.latLng) return;

          actualizarUbicacion(
            {
              lat: event.latLng.lat(),
              lng: event.latLng.lng(),
            },
            true
          );
        });
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "No se pudo cargar Google Maps."
        );
      } finally {
        if (!cancelado) {
          setCargandoMapa(false);
        }
      }
    };

    iniciarMapa();

    return () => {
      cancelado = true;
    };
  }, [activo]);

  useEffect(() => {
    setBusqueda(value?.direccion || "");

    if (
      !mapInstanceRef.current ||
      !markerRef.current
    ) {
      return;
    }

    if (
      value?.latitud === null ||
      value?.latitud === undefined ||
      value?.latitud === "" ||
      value?.longitud === null ||
      value?.longitud === undefined ||
      value?.longitud === ""
    ) {
      return;
    }

    const lat = Number(value.latitud);
    const lng = Number(value.longitud);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return;
    }

    const posicion = {
      lat,
      lng,
    };

    markerRef.current.position = posicion;

    mapInstanceRef.current.setCenter(posicion);
    mapInstanceRef.current.setZoom(17);
  }, [
    value?.direccion,
    value?.latitud,
    value?.longitud,
  ]);

  const buscarDireccion = async () => {
    if (
      !busqueda.trim() ||
      !geocoderRef.current
    ) {
      return;
    }

    setBuscando(true);
    setError("");

    try {
      const respuesta =
        await geocoderRef.current.geocode({
          address: `${busqueda.trim()}, Nicaragua`,
          region: "NI",
        });

      const resultado =
        respuesta.results?.[0];

      if (!resultado) {
        throw new Error(
          "No encontramos esa dirección."
        );
      }

      const posicion = {
        lat: resultado.geometry.location.lat(),
        lng: resultado.geometry.location.lng(),
      };

      const direccion =
        resultado.formatted_address ||
        busqueda.trim();

      setBusqueda(direccion);

      markerRef.current.position =
        posicion;

      mapInstanceRef.current.panTo(
        posicion
      );

      mapInstanceRef.current.setZoom(17);

      onChange({
        direccion,
        latitud: posicion.lat,
        longitud: posicion.lng,
      });
    } catch (err) {
      setError(
        "No encontramos esa dirección. Puedes tocar directamente el punto en el mapa."
      );
    } finally {
      setBuscando(false);
    }
  };

  const manejarDireccionManual = (e) => {
    const direccion = e.target.value;

    setBusqueda(direccion);

    onChange({
      direccion,
      latitud: value?.latitud ?? null,
      longitud: value?.longitud ?? null,
    });
  };

  return (
    <div>
      <Form.Label
        style={{
          color: "#0d5c63",
          fontWeight: 600,
        }}
      >
        <i className="bi bi-geo-alt-fill me-1" />
        Ubicación de la tienda
      </Form.Label>

      <div className="d-flex gap-2 mb-2">

        <Form.Control
          type="text"
          value={busqueda}
          onChange={manejarDireccionManual}
          placeholder="Ej. Parque Central, Juigalpa"
          style={{
            backgroundColor: "#e8f4f8",
            border: "none",
            borderRadius: "12px",
            padding: "12px 14px",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              buscarDireccion();
            }
          }}
        />

        <Button
          type="button"
          onClick={buscarDireccion}
          disabled={
            buscando || cargandoMapa
          }
          style={{
            backgroundColor: "#0d5c63",
            border: "none",
            borderRadius: "12px",
            minWidth: 50,
          }}
        >
          {buscando ? (
            <Spinner size="sm" />
          ) : (
            <i className="bi bi-search" />
          )}
        </Button>

      </div>

      <div
        style={{
          position: "relative",
          height: 260,
          borderRadius: 16,
          overflow: "hidden",
          background: "#e8f4f8",
          border: "1px solid #d4e8ed",
        }}
      >

        <div
          ref={mapContainerRef}
          style={{
            width: "100%",
            height: "100%",
          }}
        />

        {cargandoMapa && (
          <div
            className="d-flex align-items-center justify-content-center position-absolute top-0 start-0 w-100 h-100"
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

      <small
        className="d-block mt-2"
        style={{
          color: "#64748b",
        }}
      >
        Busca una dirección o toca el
        punto exacto de tu negocio en el
        mapa.
      </small>

      {value?.latitud != null &&
        value?.longitud != null && (
          <div
            className="mt-2 px-3 py-2 rounded-3"
            style={{
              background: "#eefaf5",
              color: "#166534",
            }}
          >
            <i className="bi bi-check-circle-fill me-2" />
            Ubicación seleccionada
          </div>
        )}

      {error && (
        <Alert
          variant="warning"
          className="py-2 mt-2 mb-0 small"
        >
          {error}
        </Alert>
      )}
    </div>
  );
};

export default SelectorUbicacionTienda;
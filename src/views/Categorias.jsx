import React, { useState, useEffect } from "react";
import { Spinner, Alert, Button } from "react-bootstrap";
import TablaCategorias from "../components/categorias/TablaCategorias";
import { supabase } from "../database/supabaseconfig";
import NotificacionOperacion from "../components/NotificacionOperacion";
import ModalRegistroCategoria from "../components/categorias/ModalRegistroCategoria";
import TarjetaCategoria from "../components/categorias/TarjetaCategoria";
import ModalEdicionCategoria from "../components/categorias/ModalEdicionCategoria";
import ModalEliminarCategoria from "../components/categorias/ModalEliminacionCategoria";
import CuadroBusquedas from "../components/busquedas/CuadroBusquedas";
import Paginacion from "../components/ordenamiento/Paginacion";

const Categorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
  const [mostrarModalEliminacion, setMostrarModalEliminacion] = useState(false);
  const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);
  const [toast, setToast] = useState({ mostrar: false, mensaje: "", tipo: "" });
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [categoriasFiltradas, setCategoriasFiltradas] = useState([]);
  const [registrosPorPagina, establecerRegistrosPorPagina] = useState(5);
  const [paginaActual, establecerPaginaActual] = useState(1);

  const [categoriaEditar, setCategoriaEditar] = useState({
    id_categoria: "",
    nombre_categoria: "",
    descripcion: "",
  });

  const [nuevaCategoria, setNuevaCategoria] = useState({
    nombre_categoria: "",
    descripcion: "",
  });

  const manejoCambioInput = (e) => {
    const { name, value } = e.target;
    setNuevaCategoria((prev) => ({ ...prev, [name]: value }));
  };

  const manejarBusqueda = (e) => {
    setTextoBusqueda(e.target.value);
  };

  const manejoCambioInputEdicion = (e) => {
    const { name, value } = e.target;
    setCategoriaEditar((prev) => ({ ...prev, [name]: value }));
  };

  const actualizarCategoria = async () => {
    try {
      if (
        !categoriaEditar.nombre_categoria.trim() ||
        !categoriaEditar.descripcion.trim()
      ) {
        setToast({
          mostrar: true,
          mensaje: "Debe llenar todos los campos.",
          tipo: "advertencia",
        });
        return;
      }

      setMostrarModalEdicion(false);

      const { error } = await supabase
        .from("categorias")
        .update({
          nombre_categoria: categoriaEditar.nombre_categoria.trim(),
          descripcion: categoriaEditar.descripcion.trim(),
        })
        .eq("id_categoria", categoriaEditar.id_categoria);

      if (error) {
        console.error("Error al actualizar categoría:", error.message);
        setToast({
          mostrar: true,
          mensaje: `Error al actualizar la categoría ${categoriaEditar.nombre_categoria}.`,
          tipo: "error",
        });
        return;
      }

      await cargarCategorias();
      setToast({
        mostrar: true,
        mensaje: `Categoría ${categoriaEditar.nombre_categoria} actualizada exitosamente.`,
        tipo: "exito",
      });
    } catch (err) {
      setToast({
        mostrar: true,
        mensaje: "Error inesperado al actualizar categoría.",
        tipo: "error",
      });
      console.error("Excepción al actualizar categoría:", err.message);
    }
  };

  const categoriasPaginadas = categoriasFiltradas.slice(
    (paginaActual - 1) * registrosPorPagina,
    paginaActual * registrosPorPagina
  );

  const eliminarCategoria = async () => {
    if (!categoriaAEliminar) return;
    try {
      setMostrarModalEliminacion(false);
      const { error } = await supabase
        .from("categorias")
        .delete()
        .eq("id_categoria", categoriaAEliminar.id_categoria);

      if (error) {
        console.error("Error al eliminar categoría:", error.message);
        setToast({
          mostrar: true,
          mensaje: "Error al eliminar la categoría.",
          tipo: "error",
        });
        return;
      }

      await cargarCategorias();
      setToast({
        mostrar: true,
        mensaje: `Categoría ${categoriaAEliminar.nombre_categoria} eliminada exitosamente.`,
        tipo: "exito",
      });
    } catch (err) {
      setToast({
        mostrar: true,
        mensaje: "Error al eliminar la categoría.",
        tipo: "error",
      });
    }
  };

  const agregarCategoria = async () => {
    try {
      if (
        !nuevaCategoria.nombre_categoria.trim() ||
        !nuevaCategoria.descripcion.trim()
      ) {
        setToast({
          mostrar: true,
          mensaje: "Debe llenar todos los campos.",
          tipo: "advertencia",
        });
        return;
      }

      const { error } = await supabase.from("categorias").insert([
        {
          nombre_categoria: nuevaCategoria.nombre_categoria.trim(),
          descripcion: nuevaCategoria.descripcion.trim(),
        },
      ]);

      if (error) throw error;

      setToast({
        mostrar: true,
        mensaje: "Categoría registrada exitosamente.",
        tipo: "exito",
      });
      setNuevaCategoria({ nombre_categoria: "", descripcion: "" });
      setMostrarModal(false);
      cargarCategorias();
    } catch (err) {
      setToast({
        mostrar: true,
        mensaje: "Error al registrar.",
        tipo: "error",
      });
    }
  };

  const cargarCategorias = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .order("id_categoria", { ascending: true });

      if (error) throw error;
      setCategorias(data || []);
    } catch (err) {
      console.error("Error:", err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  useEffect(() => {
    if (!textoBusqueda.trim()) {
      setCategoriasFiltradas(categorias);
    } else {
      const textoLower = textoBusqueda.toLowerCase().trim();
      const filtradas = categorias.filter(
        (cat) =>
          (cat.nombre_categoria?.toLowerCase() || "").includes(textoLower) ||
          (cat.descripcion?.toLowerCase() || "").includes(textoLower)
      );
      setCategoriasFiltradas(filtradas);
    }
  }, [textoBusqueda, categorias]);

  useEffect(() => {
    establecerPaginaActual(1);
  }, [textoBusqueda]);

  const abrirModalEdicion = (categoria) => {
    setCategoriaEditar(categoria);
    setMostrarModalEdicion(true);
  };

  const abrirModalEliminacion = (categoria) => {
    setCategoriaAEliminar(categoria);
    setMostrarModalEliminacion(true);
  };

  return (
    <div
      style={{
        backgroundColor: "#f0f7fa",
        minHeight: "100vh",
        paddingBottom: "100px",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* HEADER */}
      <div className="px-4 pt-4 pb-2">
        <div className="d-flex align-items-start justify-content-between gap-2">
          <div>
            <h1
              style={{
                fontSize: "1.6rem",
                fontWeight: 700,
                color: "#0d5c63",
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              Categorías
            </h1>
            <p
              style={{
                fontSize: "0.95rem",
                color: "#64748b",
                margin: "4px 0 12px",
              }}
            >
              Organiza tus productos por tipo
            </p>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                backgroundColor: "#e8f4f8",
                color: "#0d5c63",
                fontSize: "0.85rem",
                fontWeight: 600,
                padding: "6px 14px",
                borderRadius: 20,
              }}
            >
              {categorias.length}{" "}
              {categorias.length === 1
                ? "categoría registrada"
                : "categorías registradas"}
            </div>
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="px-4 mt-3">
        <CuadroBusquedas
          textoBusqueda={textoBusqueda}
          manejarCambioBusqueda={manejarBusqueda}
        />

        {textoBusqueda.trim() !== "" && categoriasFiltradas.length === 0 && (
          <Alert
            variant="warning"
            className="mt-3 rounded-4 border-0 shadow-sm"
          >
            No se encontraron categorías que coincidan con la búsqueda.
          </Alert>
        )}

        {cargando ? (
          <div className="text-center py-5">
            <Spinner animation="border" style={{ color: "#0d5c63" }} />
          </div>
        ) : categorias.length === 0 ? (
          <div
            className="text-center py-5"
            style={{
              backgroundColor: "white",
              borderRadius: 20,
              padding: "40px 20px",
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                backgroundColor: "#e8f4f8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <i
                className="bi bi-bookmark"
                style={{ fontSize: "2rem", color: "#0d5c63" }}
              />
            </div>
            <h5 style={{ color: "#0f172a", fontWeight: 600 }}>
              No hay categorías
            </h5>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
              Crea la primera categoría para clasificar productos
            </p>
            <Button
              className="rounded-pill px-4 border-0 mt-2"
              style={{ backgroundColor: "#0d5c63", color: "white" }}
              onClick={() => setMostrarModal(true)}
            >
              <i className="bi bi-plus-lg me-2" />
              Nueva categoría
            </Button>
          </div>
        ) : (
          <>
            {/* Móvil */}
            <div className="d-lg-none mt-3">
              <TarjetaCategoria
                categorias={categoriasPaginadas}
                abrirModalEdicion={abrirModalEdicion}
                abrirModalEliminacion={abrirModalEliminacion}
              />
            </div>

            {/* Escritorio */}
            <div className="d-none d-lg-block mt-3">
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: 18,
                  padding: 16,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <TablaCategorias
                  categorias={categoriasPaginadas}
                  abrirModalEdicion={abrirModalEdicion}
                  abrirModalEliminacion={abrirModalEliminacion}
                />
              </div>
            </div>
          </>
        )}

        <div className="mt-3">
          <Paginacion
            registrosPorPagina={registrosPorPagina}
            totalRegistros={categoriasFiltradas.length}
            paginaActual={paginaActual}
            establecerPaginaActual={establecerPaginaActual}
            establecerRegistrosPorPagina={establecerRegistrosPorPagina}
          />
        </div>
      </div>

      {/* BOTÓN FLOTANTE + */}
      <button
        onClick={() => setMostrarModal(true)}
        style={{
          position: "fixed",
          bottom: 90,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: "50%",
          backgroundColor: "#e8f4f8",
          border: "none",
          boxShadow: "0 4px 14px rgba(13, 92, 99, 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          cursor: "pointer",
        }}
      >
        <i
          className="bi bi-plus-lg"
          style={{ fontSize: "1.5rem", color: "#0d5c63" }}
        />
      </button>

      <ModalRegistroCategoria
        mostrarModal={mostrarModal}
        setMostrarModal={setMostrarModal}
        nuevaCategoria={nuevaCategoria}
        manejoCambioInput={manejoCambioInput}
        agregarCategoria={agregarCategoria}
      />

      <ModalEdicionCategoria
        mostrarModalEdicion={mostrarModalEdicion}
        setMostrarModalEdicion={setMostrarModalEdicion}
        categoriaEditar={categoriaEditar}
        manejarCambioInputEdicion={manejoCambioInputEdicion}
        actualizarCategoria={actualizarCategoria}
      />

      <ModalEliminarCategoria
        mostrarModalEdicion={mostrarModalEliminacion}
        setMostrarModalEliminacion={setMostrarModalEliminacion}
        eliminarCategoria={eliminarCategoria}
        categoria={categoriaAEliminar}
      />

      <NotificacionOperacion
        mostrar={toast.mostrar}
        mensaje={toast.mensaje}
        tipo={toast.tipo}
        onCerrar={() => setToast({ ...toast, mostrar: false })}
      />
    </div>
  );
};

export default Categorias;
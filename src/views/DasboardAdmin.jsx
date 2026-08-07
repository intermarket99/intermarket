import React, { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { supabase } from "../database/supabaseconfig";
import { useAuth } from "../context/AuthContext";

export const DasboardAdmin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cargando, setCargando] = useState(true);
  const [topProductos, setTopProductos] = useState([]);
  const [tieneTienda, setTieneTienda] = useState(false);

  useEffect(() => {
    const cargarTopStock = async () => {
      if (!user) return;

      try {
        setCargando(true);

        const { data: perfil } = await supabase
          .from("perfiles")
          .select("id_tienda")
          .eq("id_usuario", user.id)
          .maybeSingle();

        if (!perfil?.id_tienda) {
          setTieneTienda(false);
          setCargando(false);
          return;
        }

        setTieneTienda(true);

        const { data, error } = await supabase
          .from("productos")
          .select("id_producto, nombre_producto, stock, precio_venta, imagen_url")
          .eq("id_tienda", perfil.id_tienda)
          .order("stock", { ascending: false, nullsFirst: false })
          .limit(3);

        if (error) throw error;
        setTopProductos(data || []);
      } catch (err) {
        console.error("Error al cargar estadísticas:", err);
      } finally {
        setCargando(false);
      }
    };

    cargarTopStock();
  }, [user]);

  const getImagen = (producto) => {
    const img = producto.imagen_url;
    if (Array.isArray(img) && img.length > 0) return img[0];
    if (typeof img === "string" && img) return img;
    return null;
  };

  const rankingStyle = [
    { bg: "#fef3c7", color: "#d97706", label: "1°" },
    { bg: "#e2e8f0", color: "#64748b", label: "2°" },
    { bg: "#ffedd5", color: "#c2410c", label: "3°" },
  ];

  if (cargando) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "60vh", backgroundColor: "#f0f7fa" }}
      >
        <Spinner animation="border" style={{ color: "#0d5c63" }} />
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#f0f7fa",
        minHeight: "100vh",
        paddingBottom: "100px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Header */}
      <div className="d-flex align-items-center gap-3 px-4 pt-4 pb-2">
        <button
          className="btn p-0 border-0 bg-transparent"
          onClick={() => navigate(-1)}
        >
          <i className="bi bi-arrow-left" style={{ fontSize: "1.4rem", color: "#0f172a" }} />
        </button>
        <h1
          style={{
            fontSize: "1.35rem",
            fontWeight: 700,
            color: "#0d5c63",
            margin: 0,
          }}
        >
          Estadísticas
        </h1>
      </div>

      <div className="px-4 mt-3">
        {!tieneTienda ? (
          <div
            style={{
              backgroundColor: "white",
              borderRadius: 18,
              padding: "40px 20px",
              textAlign: "center",
            }}
          >
            <i className="bi bi-shop" style={{ fontSize: "2.5rem", color: "#cbd5e1" }} />
            <p style={{ color: "#94a3b8", marginTop: 12 }}>
              No tienes una tienda registrada.
            </p>
            <button
              onClick={() => navigate("/tiendas")}
              style={{
                backgroundColor: "#0d5c63",
                color: "white",
                border: "none",
                borderRadius: 50,
                padding: "10px 24px",
                fontWeight: 600,
              }}
            >
              Ir a Tiendas
            </button>
          </div>
        ) : (
          <>
            <h6
              style={{
                fontWeight: 600,
                color: "#64748b",
                fontSize: "0.9rem",
                marginBottom: 14,
              }}
            >
              Top 3 productos con más stock
            </h6>

            {topProductos.length === 0 ? (
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: 16,
                  padding: "32px 20px",
                  textAlign: "center",
                }}
              >
                <i
                  className="bi bi-box-seam"
                  style={{ fontSize: "2rem", color: "#cbd5e1" }}
                />
                <p style={{ color: "#94a3b8", marginTop: 8, marginBottom: 0 }}>
                  No tienes productos registrados.
                </p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {topProductos.map((producto, index) => {
                  const img = getImagen(producto);
                  const rank = rankingStyle[index] || rankingStyle[2];

                  return (
                    <div
                      key={producto.id_producto}
                      style={{
                        backgroundColor: "white",
                        borderRadius: 16,
                        padding: "14px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      }}
                    >
                      {/* Ranking */}
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          backgroundColor: rank.bg,
                          color: rank.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          flexShrink: 0,
                        }}
                      >
                        {rank.label}
                      </div>

                      {/* Imagen */}
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 12,
                          backgroundColor: "#f1f5f9",
                          overflow: "hidden",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {img ? (
                          <img
                            src={img}
                            alt=""
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <i
                            className="bi bi-image"
                            style={{ fontSize: "1.3rem", color: "#cbd5e1" }}
                          />
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "0.95rem",
                            color: "#0f172a",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {producto.nombre_producto}
                        </div>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "#94a3b8",
                            marginTop: 2,
                          }}
                        >
                          C${" "}
                          {Number(producto.precio_venta || 0).toLocaleString("es-NI", {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                      </div>

                      {/* Stock */}
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: "1.1rem",
                            color: "#0d5c63",
                          }}
                        >
                          {producto.stock ?? 0}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                          en stock
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DasboardAdmin;
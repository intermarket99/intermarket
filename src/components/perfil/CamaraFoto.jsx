import React, { useRef, useState, useEffect, useCallback } from "react";
import { Modal, Button, Spinner } from "react-bootstrap";

const CamaraFoto = ({
  show,
  onHide,
  onFotoLista,
  titulo = "Foto de perfil",
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const inputFileRef = useRef(null);
  const streamRef = useRef(null);

  const [modo, setModo] = useState("menu"); // menu | camara | preview
  const [previewUrl, setPreviewUrl] = useState(null);
  const [archivoTemp, setArchivoTemp] = useState(null);
  const [error, setError] = useState("");
  const [cargandoCamara, setCargandoCamara] = useState(false);
  const [facingMode, setFacingMode] = useState("user");
  const [videoListo, setVideoListo] = useState(false);
  // Dispara el useEffect para abrir la cámara
  const [solicitudCamara, setSolicitudCamara] = useState(0);

  const detenerCamara = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setVideoListo(false);
  }, []);

  const reiniciar = useCallback(() => {
    detenerCamara();
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setArchivoTemp(null);
    setError("");
    setModo("menu");
    setCargandoCamara(false);
    setVideoListo(false);
  }, [detenerCamara]);

  const handleCerrar = () => {
    reiniciar();
    onHide();
  };

  useEffect(() => {
    if (!show) reiniciar();
  }, [show, reiniciar]);

  // ---------- Abrir cámara DESPUÉS de montar el <video> ----------
  useEffect(() => {
    if (modo !== "camara" || !show || solicitudCamara === 0) return;

    let cancelado = false;

    const abrir = async () => {
      setError("");
      setCargandoCamara(true);
      setVideoListo(false);

      try {
        // Esperar a que el <video> exista en el DOM
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

        if (cancelado) return;

        const video = videoRef.current;
        if (!video) {
          setError("No se pudo mostrar el visor de cámara. Intenta de nuevo.");
          setModo("menu");
          setCargandoCamara(false);
          return;
        }

        // Detener stream anterior
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }

        let mediaStream;
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              facingMode: { ideal: facingMode },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
        } catch {
          // Fallback mínimo
          mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true,
          });
        }

        if (cancelado) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = mediaStream;
        video.srcObject = mediaStream;
        video.setAttribute("playsinline", "true");
        video.setAttribute("webkit-playsinline", "true");
        video.muted = true;

        const esperarListo = () =>
          new Promise((resolve, reject) => {
            const timeout = setTimeout(
              () => reject(new Error("La cámara tardó demasiado en responder.")),
              12000
            );

            const check = async () => {
              try {
                await video.play();
              } catch {
                // algunos móviles lanzan error si ya está playing
              }

              if (video.videoWidth > 0 && video.videoHeight > 0) {
                clearTimeout(timeout);
                resolve();
                return;
              }

              setTimeout(() => {
                if (video.videoWidth > 0) {
                  clearTimeout(timeout);
                  resolve();
                } else {
                  clearTimeout(timeout);
                  reject(new Error("La cámara no envió imagen."));
                }
              }, 600);
            };

            if (video.readyState >= 2) {
              check();
            } else {
              video.onloadedmetadata = () => check();
            }
          });

        await esperarListo();
        if (!cancelado) setVideoListo(true);
      } catch (err) {
        console.error("Error cámara:", err);
        if (cancelado) return;

        let msg = "No se pudo abrir la cámara.";
        if (err.name === "NotAllowedError") {
          msg = "Permiso de cámara denegado. Actívalo en el navegador.";
        } else if (err.name === "NotFoundError") {
          msg = "No se encontró ninguna cámara.";
        } else if (err.message) {
          msg = err.message;
        }
        setError(msg);
        detenerCamara();
        setModo("menu");
      } finally {
        if (!cancelado) setCargandoCamara(false);
      }
    };

    abrir();

    return () => {
      cancelado = true;
    };
  }, [modo, show, solicitudCamara, facingMode, detenerCamara]);

  // ---------- GALERÍA ----------
  const abrirGaleria = () => inputFileRef.current?.click();

  const onArchivoSeleccionado = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten imágenes.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("La imagen no debe superar 10 MB.");
      return;
    }

    setError("");
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setArchivoTemp(file);
    setModo("preview");
    e.target.value = "";
  };

  // Solo cambia estado; el useEffect abre la cámara
  const pedirCamara = (facing = "user") => {
    setFacingMode(facing);
    setModo("camara");
    setSolicitudCamara((n) => n + 1);
  };

  const cambiarCamara = () => {
    const nueva = facingMode === "user" ? "environment" : "user";
    setFacingMode(nueva);
    setSolicitudCamara((n) => n + 1);
  };

  const capturarFoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      setError("Error al capturar. Intenta de nuevo.");
      return;
    }

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) {
      setError("La cámara aún no está lista. Espera un momento.");
      return;
    }

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    if (facingMode === "user") {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("No se pudo capturar la imagen.");
          return;
        }
        const file = new File([blob], `foto-${Date.now()}.jpg`, {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setArchivoTemp(file);
        detenerCamara();
        setModo("preview");
      },
      "image/jpeg",
      0.92
    );
  };

  const confirmarFoto = () => {
    if (!archivoTemp) return;
    onFotoLista(archivoTemp);
    handleCerrar();
  };

  return (
    <Modal
      show={show}
      onHide={handleCerrar}
      centered
      backdrop="static"
      contentClassName="border-0 shadow-lg"
    >
      <Modal.Header className="border-0 pb-0 pt-4 px-4">
        <Modal.Title className="fw-bold" style={{ color: "#0d5c63", fontSize: "1.2rem" }}>
          {titulo}
        </Modal.Title>
        <button type="button" className="btn-close" onClick={handleCerrar} aria-label="Cerrar" />
      </Modal.Header>

      <Modal.Body className="px-4 pb-4">
        {error && (
          <div
            className="mb-3 p-3 rounded-3"
            style={{ backgroundColor: "#fee2e2", color: "#b91c1c", fontSize: "0.9rem" }}
          >
            <i className="bi bi-exclamation-triangle me-2" />
            {error}
          </div>
        )}

        {/* MENÚ */}
        {modo === "menu" && (
          <div className="d-flex flex-column gap-3">
            <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: 4 }}>
              Elige cómo quieres agregar tu foto:
            </p>

            <button
              type="button"
              onClick={abrirGaleria}
              className="d-flex align-items-center gap-3 border-0 text-start w-100"
              style={{
                backgroundColor: "#e8f4f8",
                borderRadius: 14,
                padding: "16px 18px",
                color: "#0d5c63",
              }}
            >
              <div
                className="d-flex align-items-center justify-content-center"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: "white",
                  flexShrink: 0,
                }}
              >
                <i className="bi bi-images" style={{ fontSize: "1.3rem" }} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>Elegir de galería</div>
                <div style={{ fontSize: "0.8rem", opacity: 0.75 }}>
                  Selecciona una imagen de tus archivos
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => pedirCamara("user")}
              className="d-flex align-items-center gap-3 border-0 text-start w-100"
              style={{
                backgroundColor: "#e8f4f8",
                borderRadius: 14,
                padding: "16px 18px",
                color: "#0d5c63",
              }}
            >
              <div
                className="d-flex align-items-center justify-content-center"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: "white",
                  flexShrink: 0,
                }}
              >
                <i className="bi bi-camera" style={{ fontSize: "1.3rem" }} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>Tomar foto</div>
                <div style={{ fontSize: "0.8rem", opacity: 0.75 }}>
                  Usa la cámara de tu dispositivo
                </div>
              </div>
            </button>

            <input
              ref={inputFileRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={onArchivoSeleccionado}
            />
          </div>
        )}

        {/* CÁMARA — el <video> siempre está montado cuando modo === camara */}
        {modo === "camara" && (
          <div>
            <div
              style={{
                position: "relative",
                borderRadius: 16,
                overflow: "hidden",
                backgroundColor: "#111",
                width: "100%",
                aspectRatio: "3 / 4",
                maxHeight: 380,
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  transform: facingMode === "user" ? "scaleX(-1)" : "none",
                  backgroundColor: "#111",
                }}
              />

              {(cargandoCamara || !videoListo) && (
                <div
                  className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
                  style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
                >
                  <Spinner animation="border" variant="light" size="sm" />
                  <span className="text-white small mt-2">Abriendo cámara...</span>
                </div>
              )}
            </div>

            <div className="d-flex justify-content-center align-items-center gap-3 mt-3">
              <button
                type="button"
                className="btn border-0"
                onClick={() => {
                  detenerCamara();
                  setModo("menu");
                }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  backgroundColor: "#e2e8f0",
                  color: "#475569",
                }}
              >
                <i className="bi bi-arrow-left" />
              </button>

              <button
                type="button"
                onClick={capturarFoto}
                disabled={!videoListo}
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: "50%",
                  border: "4px solid #0d5c63",
                  backgroundColor: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  opacity: videoListo ? 1 : 0.4,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    backgroundColor: "#0d5c63",
                  }}
                />
              </button>

              <button
                type="button"
                className="btn border-0"
                onClick={cambiarCamara}
                disabled={cargandoCamara}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  backgroundColor: "#e2e8f0",
                  color: "#475569",
                }}
              >
                <i className="bi bi-arrow-repeat" />
              </button>
            </div>

            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>
        )}

        {/* PREVIEW */}
        {modo === "preview" && previewUrl && (
          <div>
            <div
              style={{
                borderRadius: 16,
                overflow: "hidden",
                backgroundColor: "#f1f5f9",
                aspectRatio: "1",
                maxHeight: 320,
                margin: "0 auto",
              }}
            >
              <img
                src={previewUrl}
                alt="Vista previa"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>

            <div className="d-flex gap-2 mt-3">
              <Button
                className="flex-fill border-0 fw-semibold"
                style={{
                  backgroundColor: "#e8f4f8",
                  color: "#0d5c63",
                  borderRadius: 50,
                  padding: "12px",
                }}
                onClick={() => {
                  if (previewUrl) URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(null);
                  setArchivoTemp(null);
                  setModo("menu");
                }}
              >
                Volver a elegir
              </Button>
              <Button
                className="flex-fill border-0 fw-semibold"
                style={{
                  backgroundColor: "#0d5c63",
                  color: "white",
                  borderRadius: 50,
                  padding: "12px",
                }}
                onClick={confirmarFoto}
              >
                Usar esta foto
              </Button>
            </div>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default CamaraFoto;
import React from "react";
import { Container, Badge, Button, Spinner } from "react-bootstrap";

const HeaderPerfil = ({ perfil, user, fotoUrl, manejarArchivo, navegar, guardarPerfil, archivoNuevo, guardando }) => {
  return (
    <div className="perfil-header-banner position-relative">
      <div className="banner-gradient"></div>
      <Container>
        <div className="perfil-header-content d-flex flex-column flex-md-row align-items-center align-items-md-end gap-4">
          <div className="position-relative">
            <img
              src={fotoUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(perfil?.usuarios?.username || user?.user_metadata?.full_name || "Usuario")}
              alt="Foto de perfil"
              className="rounded-circle profile-avatar shadow-lg border border-4 border-white"
              style={{ width: 160, height: 160, objectFit: "cover" }}
            />
            <label htmlFor="upload-photo" className="btn btn-primary rounded-circle position-absolute bottom-0 end-0 shadow-sm p-2 d-flex align-items-center justify-content-center" style={{ width: 40, height: 40, cursor: 'pointer' }}>
              <i className="bi bi-camera-fill"></i>
              <input type="file" id="upload-photo" className="d-none" accept="image/*" onChange={manejarArchivo} />
            </label>
          </div>
          
          <div className="perfil-info-text text-center text-md-start pb-2">
            <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-md-start gap-2 mb-1">
              <h1 className="fw-900 mb-0 text-white">{perfil?.usuarios?.username || user?.user_metadata?.full_name || "Usuario"}</h1>
              <Badge bg="light" text="dark" className="rounded-pill px-3 py-2 text-uppercase ls-1 small fw-bold shadow-sm">
                {perfil?.rol || "Comprador"}
              </Badge>
            </div>
            <p className="text-white-50 mb-3 fs-5">{perfil?.usuarios?.email || user?.email}</p>
            
            <div className="d-flex gap-2 justify-content-center justify-content-md-start">
              <Button 
                variant="white" 
                size="sm"
                onClick={() => navegar("/seleccion-rol")}
                className="rounded-pill px-4 fw-bold shadow-sm bg-white border-0 transition-all hover-scale"
              >
                <i className="bi bi-arrow-left-right me-2"></i>Cambiar Rol
              </Button>
              {archivoNuevo && (
                <Button variant="success" size="sm" onClick={guardarPerfil} disabled={guardando} className="rounded-pill px-4 shadow-sm fw-bold border-0 pulse-soft">
                  {guardando ? <Spinner animation="border" size="sm" /> : <><i className="bi bi-check2-circle me-2"></i>Guardar Foto</>}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default HeaderPerfil;

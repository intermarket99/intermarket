import React, { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { Spinner } from "react-bootstrap";

import Encabezado from "./components/navegacion/Encabezado";
import RutaProtegida from "./components/rutas/RutaProtegida";
import ChatBotAsistente from "./components/ChatBotAsistente";
import "./App.css";

// =========================================================
// LAZY LOADING DE LAS VISTAS
// =========================================================

const Inicio = lazy(() => import("./views/Inicio"));

/*
  ⭐ INICIO DEL COMPRADOR
*/
const InicioComprador = lazy(
  () => import("./views/InicioComprador")
);

const Catalogo = lazy(() => import("./views/Catalogo"));
const Categorias = lazy(() => import("./views/Categorias"));
const Login = lazy(() => import("./views/Login"));
const Registro = lazy(() => import("./views/Registro"));
const Productos = lazy(() => import("./views/Productos"));
const Tiendas = lazy(() => import("./views/Tiendas"));
const Vendedor = lazy(() => import("./views/Vendedor"));
const Pagina404 = lazy(() => import("./views/Pagina404"));
const VistaRol = lazy(() => import("./views/vista_rol"));
const AdminInicio = lazy(() => import("./views/AdminInicio"));
const Perfil = lazy(() => import("./views/Perfil"));
const Mensajes = lazy(() => import("./views/Mensajes"));
const Suscripcion = lazy(() => import("./views/Suscripcion"));
const CheckoutSuccess = lazy(
  () => import("./views/CheckoutSuccess")
);
const CheckoutCancel = lazy(
  () => import("./views/CheckoutCancel")
);
const GestionEnvios = lazy(
  () => import("./views/GestionEnvios")
);
const DasboardAdmin = lazy(
  () => import("./views/DasboardAdmin")
);


// =========================================================
// LOADING
// =========================================================

const LoadingFallback = () => (
  <div className="d-flex justify-content-center align-items-center vh-100">
    <Spinner animation="border" variant="primary" />
  </div>
);


// =========================================================
// APP LAYOUT
// =========================================================

const AppLayout = () => {

  const location = useLocation();

  const pathname = location?.pathname || "";

  const currentPath = pathname
    .toLowerCase()
    .replace(/\/$/, "");


  // =======================================================
  // PÁGINAS DONDE NO SE MUESTRA EL ENCABEZADO
  // =======================================================

  const isAuthPage =
    currentPath === "/login" ||
    currentPath === "/registro" ||
    currentPath === "/seleccion-rol" ||
    currentPath === "/suscripcion";


  const shouldShowNavbar = !isAuthPage;


  // =======================================================
  // RETURN
  // =======================================================

  return (
    <>

      {/* =====================================================
          ENCABEZADO
      ===================================================== */}

      {shouldShowNavbar && <Encabezado />}


      {/* =====================================================
          CONTENIDO PRINCIPAL
      ===================================================== */}

      <main
        className={
          shouldShowNavbar
            ? "margen-superior-main"
            : ""
        }
      >

        <Suspense fallback={<LoadingFallback />}>

          <Routes>

            {/* =================================================
                AUTENTICACIÓN
            ================================================= */}

            <Route
              path="/login"
              element={<Login />}
            />

            <Route
              path="/registro"
              element={<Registro />}
            />


            {/* =================================================
                INICIO GENERAL
            ================================================= */}

            <Route
              path="/"
              element={
                <RutaProtegida>
                  <Inicio />
                </RutaProtegida>
              }
            />


            {/* =================================================
                ⭐ INICIO DEL COMPRADOR
            ================================================= */}

            <Route
              path="/iniciocomprador"
              element={
                <RutaProtegida
                  rolesPermitidos={["comprador"]}
                >
                  <InicioComprador />
                </RutaProtegida>
              }
            />


            {/* =================================================
                SELECCIÓN DE ROL
            ================================================= */}

            <Route
              path="/seleccion-rol"
              element={
                <RutaProtegida>
                  <VistaRol />
                </RutaProtegida>
              }
            />


            {/* =================================================
                SUSCRIPCIÓN
            ================================================= */}

            <Route
              path="/suscripcion"
              element={
                <RutaProtegida>
                  <Suscripcion />
                </RutaProtegida>
              }
            />


            {/* =================================================
                CATÁLOGO
            ================================================= */}

            <Route
              path="/catalogo"
              element={<Catalogo />}
            />


            {/* =================================================
                PERFIL
            ================================================= */}

            <Route
              path="/perfil"
              element={
                <RutaProtegida>
                  <Perfil />
                </RutaProtegida>
              }
            />


            {/* =================================================
                MENSAJES
            ================================================= */}

            <Route
              path="/mensajes"
              element={
                <RutaProtegida>
                  <Mensajes />
                </RutaProtegida>
              }
            />


            {/* =================================================
                PAGO - STRIPE
            ================================================= */}

            <Route
              path="/success"
              element={
                <RutaProtegida>
                  <CheckoutSuccess />
                </RutaProtegida>
              }
            />

            <Route
              path="/cancel"
              element={
                <RutaProtegida>
                  <CheckoutCancel />
                </RutaProtegida>
              }
            />


            {/* =================================================
                PRODUCTOS
                ADMIN + VENDEDOR
            ================================================= */}

            <Route
              path="/productos"
              element={
                <RutaProtegida
                  rolesPermitidos={[
                    "vendedor",
                    "admin",
                  ]}
                >
                  <Productos />
                </RutaProtegida>
              }
            />


            {/* =================================================
                SOLO VENDEDOR
            ================================================= */}

            <Route
              path="/tiendas"
              element={
                <RutaProtegida
                  rolesPermitidos={["vendedor"]}
                >
                  <Tiendas />
                </RutaProtegida>
              }
            />

            <Route
              path="/vendedor"
              element={
                <RutaProtegida
                  rolesPermitidos={["vendedor"]}
                >
                  <Vendedor />
                </RutaProtegida>
              }
            />

            <Route
              path="/envios"
              element={
                <RutaProtegida
                  rolesPermitidos={["vendedor"]}
                >
                  <GestionEnvios />
                </RutaProtegida>
              }
            />


            {/* =================================================
                ADMINISTRADOR
            ================================================= */}

            <Route
              path="/admin-inicio"
              element={
                <RutaProtegida>
                  <AdminInicio />
                </RutaProtegida>
              }
            />

            <Route
              path="/dasboard-admin"
              element={
                <RutaProtegida>
                  <DasboardAdmin />
                </RutaProtegida>
              }
            />

            <Route
              path="/categorias"
              element={
                <RutaProtegida>
                  <Categorias />
                </RutaProtegida>
              }
            />


            {/* =================================================
                404
            ================================================= */}

            <Route
              path="*"
              element={<Pagina404 />}
            />

          </Routes>

        </Suspense>

      </main>


      {/* =====================================================
          CHATBOT
      ===================================================== */}

      <ChatBotAsistente />

    </>
  );
};


// =========================================================
// APP PRINCIPAL
// =========================================================

const App = () => {

  return (
    <Router>
      <AppLayout />
    </Router>
  );

};


export default App;
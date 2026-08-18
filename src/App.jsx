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

// Lazy Loading de las Vistas
const Inicio = lazy(() => import("./views/Inicio"));
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
const CheckoutSuccess = lazy(() => import("./views/CheckoutSuccess"));
const CheckoutCancel = lazy(() => import("./views/CheckoutCancel"));
const GestionEnvios = lazy(() => import("./views/GestionEnvios"));
const DasboardAdmin = lazy(() => import("./views/DasboardAdmin"));

const LoadingFallback = () => (
  <div className="d-flex justify-content-center align-items-center vh-100">
    <Spinner animation="border" variant="primary" />
  </div>
);

const AppLayout = () => {
  const location = useLocation();

  const pathname = location?.pathname || "";
  const currentPath = (pathname || "").toLowerCase().replace(/\/$/, "");

  const isAuthPage =
    currentPath === "/login" ||
    currentPath === "/registro" ||
    currentPath === "/seleccion-rol" ||
    currentPath === "/suscripcion";

  const shouldShowNavbar = !isAuthPage;

  return (
    <>
      {shouldShowNavbar && <Encabezado />}

      <main className={shouldShowNavbar ? "margen-superior-main" : ""}>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />

            {/* Inicio según el rol */}
            <Route
              path="/"
              element={
                <RutaProtegida>
                  <Inicio />
                </RutaProtegida>
              }
            />

            {/* Selección de rol / suscripción */}
            <Route
              path="/seleccion-rol"
              element={
                <RutaProtegida>
                  <VistaRol />
                </RutaProtegida>
              }
            />
            <Route
              path="/suscripcion"
              element={
                <RutaProtegida>
                  <Suscripcion />
                </RutaProtegida>
              }
            />

            {/* Rutas compartidas o públicas */}
            <Route path="/catalogo" element={<Catalogo />} />
            <Route
              path="/perfil"
              element={
                <RutaProtegida>
                  <Perfil />
                </RutaProtegida>
              }
            />
            <Route
              path="/mensajes"
              element={
                <RutaProtegida>
                  <Mensajes />
                </RutaProtegida>
              }
            />

            {/* Pago (Stripe) */}
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

            {/* Productos - Admin y Vendedor */}
            <Route
              path="/productos"
              element={
                <RutaProtegida rolesPermitidos={["vendedor", "admin"]}>
                  <Productos />
                </RutaProtegida>
              }
            />

            {/* Solo Vendedor */}
            <Route
              path="/tiendas"
              element={
                <RutaProtegida rolesPermitidos={["vendedor"]}>
                  <Tiendas />
                </RutaProtegida>
              }
            />
            <Route
              path="/vendedor"
              element={
                <RutaProtegida rolesPermitidos={["vendedor"]}>
                  <Vendedor />
                </RutaProtegida>
              }
            />
            <Route
              path="/envios"
              element={
                <RutaProtegida rolesPermitidos={["vendedor"]}>
                  <GestionEnvios />
                </RutaProtegida>
              }
            />

            {/* Administrador */}
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

            <Route path="*" element={<Pagina404 />} />
          </Routes>
        </Suspense>
      </main>

      {/* Chatbot flotante (compradores / catálogo) */}
      <ChatBotAsistente />
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
};

export default App;
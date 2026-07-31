import React from "react";
import { Card, Nav, Badge } from "react-bootstrap";

const SidebarPerfil = ({ activeTab, setActiveTab, pedidosCount }) => {
  return (
    <div className="perfil-nav-sidebar sticky-top" style={{ top: '100px', zIndex: 10 }}>
      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        <Nav variant="pills" className="flex-column p-2 custom-perfil-pills" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
          <Nav.Item>
            <Nav.Link eventKey="perfil" className="rounded-3 d-flex align-items-center gap-3 py-3 px-4">
              <i className="bi bi-person-badge fs-5"></i> Mi Cuenta
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="pedidos" className="rounded-3 d-flex align-items-center gap-3 py-3 px-4">
              <i className="bi bi-box-seam fs-5"></i> Mis Pedidos
              {pedidosCount > 0 && <Badge bg="primary" pill className="ms-auto">{pedidosCount}</Badge>}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="direcciones" className="rounded-3 d-flex align-items-center gap-3 py-3 px-4">
              <i className="bi bi-geo-alt fs-5"></i> Direcciones
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="metodos" className="rounded-3 d-flex align-items-center gap-3 py-3 px-4">
              <i className="bi bi-credit-card fs-5"></i> Pagos
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </Card>
    </div>
  );
};

export default SidebarPerfil;

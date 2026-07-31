import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../database/supabaseconfig';
import { useAuth } from '../context/AuthContext';
import StatsVendedor from '../components/vendedor/StatsVendedor';

const InicioVendedor = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ ventas: 0, productos: 0, pedidosPendientes: 0 });
    const [pedidosRecientes, setPedidosRecientes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [tienda, setTienda] = useState(null);

    useEffect(() => {
        const cargarResumen = async () => {
            if (!user) return;
            try {
                // 1. Obtener tienda
                const { data: perfilData } = await supabase
                    .from('perfiles')
                    .select('id_tienda, perfil_id')
                    .eq('id_usuario', user.id)
                    .maybeSingle();
                
                if (!perfilData?.id_tienda) {
                    setCargando(false);
                    return;
                }
                setTienda(perfilData);

                // 2. Obtener estadísticas básicas
                const [pedidosRes, productosRes] = await Promise.all([
                    supabase.from('pedidos').select('*, productos!inner(id_tienda)').eq('productos.id_tienda', perfilData.id_tienda),
                    supabase.from('productos').select('id_producto', { count: 'exact' }).eq('id_tienda', perfilData.id_tienda)
                ]);

                const pedidos = pedidosRes.data || [];
                const numProductos = productosRes.count || 0;
                const pendientes = pedidos.filter(p => p.id_estado === 1).length;
                
                setStats({
                    ventas: pedidos.filter(p => p.id_estado === 2 || p.id_estado === 4).length,
                    productos: numProductos,
                    pedidosPendientes: pendientes
                });

                setPedidosRecientes(pedidos.slice(0, 5));
            } catch (error) {
                console.error("Error al cargar resumen vendedor:", error);
            } finally {
                setCargando(false);
            }
        };
        cargarResumen();
    }, [user]);

    if (cargando) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    if (!tienda) {
        return (
            <Container className="py-5 text-center">
                <div className="p-5 bg-light rounded-4 shadow-sm">
                    <i className="bi bi-shop fs-1 text-muted mb-3"></i>
                    <h3>Aún no tienes una tienda</h3>
                    <p className="text-muted">Para empezar a vender, primero debes configurar tu tienda.</p>
                    <Button variant="primary" onClick={() => navigate('/tiendas')}>
                        Configurar mi Tienda
                    </Button>
                </div>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-1">¡Hola de nuevo!</h2>
                    <p className="text-muted">Aquí tienes un resumen de lo que está pasando en tu tienda hoy.</p>
                </div>
                <Button variant="primary" className="rounded-pill px-4" onClick={() => navigate('/vendedor')}>
                    Ver Panel Completo
                </Button>
            </div>

            {/* Acciones Rápidas */}
            <Row className="mb-4 g-3">
                <Col md={4}>
                    <Card 
                        className="border-0 shadow-sm h-100 quick-action-card bg-primary text-white"
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate('/productos')}
                    >
                        <Card.Body className="d-flex align-items-center">
                            <div className="fs-1 me-3"><i className="bi bi-plus-circle"></i></div>
                            <div>
                                <h5 className="mb-0 fw-bold">Nuevo Producto</h5>
                                <small>Publica algo nuevo hoy</small>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card 
                        className="border-0 shadow-sm h-100 quick-action-card bg-info text-white"
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate('/mensajes')}
                    >
                        <Card.Body className="d-flex align-items-center">
                            <div className="fs-1 me-3"><i className="bi bi-chat-dots"></i></div>
                            <div>
                                <h5 className="mb-0 fw-bold">Mensajes</h5>
                                <small>Responde a tus clientes</small>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card 
                        className="border-0 shadow-sm h-100 quick-action-card bg-success text-white"
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate('/vendedor')}
                    >
                        <Card.Body className="d-flex align-items-center">
                            <div className="fs-1 me-3"><i className="bi bi-receipt"></i></div>
                            <div>
                                <h5 className="mb-0 fw-bold">Pedidos</h5>
                                <small>{stats.pedidosPendientes} pendientes de revisión</small>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Estadísticas */}
            <h4 className="fw-bold mb-3">Tu Rendimiento</h4>
            <StatsVendedor pedidos={pedidosRecientes} />

            <Row className="mt-4">
                <Col lg={8}>
                    <Card className="border-0 shadow-sm mb-4">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="mb-0 fw-bold">Pedidos Recientes</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {pedidosRecientes.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="ps-3 border-0">Producto</th>
                                                <th className="border-0">Fecha</th>
                                                <th className="border-0">Total</th>
                                                <th className="border-0">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pedidosRecientes.map(p => (
                                                <tr key={p.id_pedido} style={{ cursor: 'pointer' }} onClick={() => navigate('/vendedor')}>
                                                    <td className="ps-3 border-0 fw-bold">{p.productos?.nombre_producto}</td>
                                                    <td className="border-0">{new Date(p.creado_en).toLocaleDateString()}</td>
                                                    <td className="border-0">C${(p.precio_unitario * p.cantidad).toFixed(2)}</td>
                                                    <td className="border-0">
                                                        <span className={`badge rounded-pill bg-${p.id_estado === 1 ? 'warning' : 'success'}`}>
                                                            {p.id_estado === 1 ? 'Pendiente' : 'Procesado'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-5">
                                    <p className="text-muted">Aún no tienes pedidos.</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={4}>
                    <Card className="border-0 shadow-sm bg-light">
                        <Card.Body className="p-4 text-center">
                            <h5 className="fw-bold mb-3">¿Necesitas ayuda?</h5>
                            <p className="small text-muted mb-4">Consulta nuestra guía para vendedores o contacta con soporte técnico.</p>
                            <Button variant="outline-primary" className="w-100 rounded-pill">
                                Centro de Ayuda
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default InicioVendedor;

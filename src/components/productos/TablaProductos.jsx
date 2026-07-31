import React from "react";
import { Table, Button, Badge } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

const TablaProductos = ({
    productos = [],
    abrirModalEdicion,
    abrirModalEliminacion,
    abrirModalDescuento
}) => {
    const obtenerInfoOferta = (producto) => {
        const precioVenta = parseFloat(producto.precio_venta || 0);
        const precioOriginal = parseFloat(
            producto.precio_original ??
            producto.precio_lista ??
            producto.precio_regular ??
            0
        );

        // Fallback: si no existe precio original, usa compra como referencia visual
        const base = precioOriginal > 0 ? precioOriginal : parseFloat(producto.precio_compra || 0);
        const esOferta = base > 0 && precioVenta > 0 && precioVenta < base;
        const ahorro = esOferta ? base - precioVenta : 0;
        const porcentaje = esOferta ? Math.round((ahorro / base) * 100) : 0;

        return { esOferta, base, ahorro, porcentaje };
    };

    return (
        <Table striped bordered hover responsive size="sm">
            <thead className="table-blank">
                <tr>
                    <th>Imagen</th>
                    <th>Nombre del Producto</th>
                    <th className="d-none d-lg-table-cell">Descripción</th>
                    <th>Categoría</th>
                    <th className="text-end">Precio Compra</th>
                    <th className="text-end">Precio Venta</th>
                    <th className="text-center">Stock</th>
                    <th className="text-center">Oferta</th>
                    <th className="text-center">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {productos.map((producto) => {
                    const infoOferta = obtenerInfoOferta(producto);
                    return (
                    <tr key={producto.id_producto}>
                        <td>
                            {producto.imagen_url && producto.imagen_url.length > 0 && (
                                <img 
                                    src={producto.imagen_url[0]} 
                                    alt={producto.nombre_producto} 
                                    style={{ width: '50px', height: '50px' }}
                                />
                            )}
                        </td>
                        
                        <td className="fw-bold">
                            {producto.nombre_producto}
                        </td>
                        
                        <td className="d-none d-lg-table-cell text-truncate" style={{ maxWidth: '250px' }}>
                            {producto.descripcion || 'Sin descripción'}
                        </td>
                        
                        <td>
                            {producto.categorias?.nombre_categoria || 'Sin categoría'}
                        </td>
                        
                        <td className="text-end">
                            C${parseFloat(producto.precio_compra || 0).toFixed(2)}
                        </td>
                        
                        <td className="text-end fw-bold text-success">
                            C${parseFloat(producto.precio_venta || 0).toFixed(2)}
                        </td>

                        <td className="text-center">
                            {producto.stock === null || producto.stock === undefined ? (
                                <span className="text-muted small">—</span>
                            ) : producto.stock === 0 ? (
                                <Badge bg="danger" className="rounded-pill px-2">
                                    <i className="bi bi-x-circle me-1"></i>Agotado
                                </Badge>
                            ) : producto.stock <= 5 ? (
                                <Badge bg="warning" text="dark" className="rounded-pill px-2">
                                    <i className="bi bi-exclamation-triangle me-1"></i>{producto.stock}
                                </Badge>
                            ) : (
                                <Badge bg="success" className="rounded-pill px-2">
                                    <i className="bi bi-check-circle me-1"></i>{producto.stock}
                                </Badge>
                            )}
                        </td>

                        <td className="text-center">
                            {infoOferta.esOferta ? (
                                <div className="d-flex flex-column align-items-center">
                                    <Badge bg="danger" className="mb-1">-{infoOferta.porcentaje}%</Badge>
                                    <small className="text-success fw-semibold">Ahorra ${infoOferta.ahorro.toFixed(2)}</small>
                                </div>
                            ) : (
                                <small className="text-muted">Sin oferta</small>
                            )}
                        </td>
                    
                        <td className="text-center">
                            <Button
                                variant="outline-warning"
                                size="sm"
                                className="m-1"
                                onClick={() => abrirModalEdicion(producto)}
                                title="Editar producto"
                            >
                                <i className="bi bi-pencil"></i>
                            </Button>
                            <Button
                                variant="success"
                                size="sm"
                                className="m-1"
                                onClick={() => abrirModalDescuento(producto)}
                                title="Aplicar descuento"
                            >
                                <i className="bi bi-tag-fill me-1"></i> Descuento
                            </Button>
                            <Button
                                variant="outline-danger"
                                size="sm"
                                className="m-1"
                                onClick={() => abrirModalEliminacion(producto)}
                                title="Eliminar producto"
                            >
                                <i className="bi bi-trash"></i>
                            </Button>
                        </td>
                    </tr>
                )})}
            </tbody>
        </Table>
    );
};

export default TablaProductos;
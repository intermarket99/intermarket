import React from "react";
import { Table, Button } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

const TablaTiendas = ({ tiendas = [], abrirModalEdicion, abrirModalEliminacion }) => {
    return (
        <Table striped bordered hover responsive size="sm">
            <thead className="table-blank">
                <tr>
                    <th>Nombre de la Tienda</th>
                    <th className="text-center">Imagen</th>
                    <th className="text-center">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {tiendas.map((tienda) => (
                    <tr key={tienda.id_tienda}>
                        <td className="fw-bold">{tienda.nombre_tienda}</td>
                        <td className="text-center">
                            {tienda.imagen_url ? (
                                <img
                                    src={tienda.imagen_url}
                                    alt={tienda.nombre_tienda}
                                    style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px" }}
                                />
                            ) : (
                                <span className="text-muted">Sin imagen</span>
                            )}
                        </td>
                        <td className="text-center">
                            <Button
                                variant="outline-warning"
                                size="sm"
                                className="m-1"
                                onClick={() => abrirModalEdicion(tienda)}
                            >
                                <i className="bi bi-pencil" />
                            </Button>
                            <Button
                                variant="outline-danger"
                                size="sm"
                                className="m-1"
                                onClick={() => abrirModalEliminacion(tienda)}
                            >
                                <i className="bi bi-trash" />
                            </Button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );
};

export default TablaTiendas;

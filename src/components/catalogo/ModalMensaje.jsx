import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { supabase } from '../../database/supabaseconfig';
import { useAuth } from '../../context/AuthContext';
import { enviarNotificacionPorCorreo } from '../../services/emailService';

const ModalMensaje = ({ mostrar, setMostrar, producto }) => {
    const { user } = useAuth();
    const [mensaje, setMensaje] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState(null);
    const [exito, setExito] = useState(false);

    const enviarMensaje = async () => {
        if (!mensaje.trim()) return;
        
        try {
            setEnviando(true);
            setError(null);
            setExito(false);

            // 1. Obtener perfil_id del comprador actual
            const { data: compradorData, error: errorComprador } = await supabase
                .from('perfiles')
                .select('perfil_id')
                .eq('id_usuario', user.id)
                .maybeSingle();

            if (errorComprador) throw errorComprador;
            if (!compradorData) throw new Error("Perfil de comprador no encontrado.");

            // 2. Obtener perfil_id del vendedor
            const { data: vendedorData, error: errorVendedor } = await supabase
                .from('perfiles')
                .select('perfil_id, usuarios(email)')
                .eq('id_tienda', producto.id_tienda)
                .maybeSingle();

            if (errorVendedor) throw errorVendedor;
            if (!vendedorData) throw new Error("No se encontró al vendedor de este producto.");

            if (compradorData.perfil_id === vendedorData.perfil_id) {
                throw new Error("No puedes enviarte mensajes a ti mismo sobre tu propio producto.");
            }

            // 3. Buscar si ya existe un chat
            let chatGuardado;
            const { data: chatExistente } = await supabase
                .from('chats')
                .select('id_chat')
                .eq('comprador_id', compradorData.perfil_id)
                .eq('vendedor_id', vendedorData.perfil_id)
                .eq('id_producto', producto.id_producto)
                .maybeSingle();

            if (chatExistente) {
                chatGuardado = chatExistente;
            } else {
                const { data: nuevoChat, error: errorChatCreacion } = await supabase
                    .from('chats')
                    .insert([{
                        comprador_id: compradorData.perfil_id,
                        vendedor_id: vendedorData.perfil_id,
                        id_producto: producto.id_producto
                    }])
                    .select()
                    .single();
                
                if (errorChatCreacion) throw errorChatCreacion;
                chatGuardado = nuevoChat;
            }

            // 4. Insertar el mensaje
            const { error: errorMensaje } = await supabase
                .from('mensajes')
                .insert([{
                    id_chat: chatGuardado.id_chat,
                    emisor_id: compradorData.perfil_id,
                    texto: mensaje.trim()
                }]);

            if (errorMensaje) throw errorMensaje;

            // 5. Crear notificación para el vendedor
            const titulo = 'Nuevo mensaje recibido';
            const msjAviso = `Alguien está interesado en tu producto: ${producto.nombre_producto}`;
            await supabase.from('notificaciones').insert([{
                usuario_id: vendedorData.perfil_id,
                titulo: titulo,
                mensaje: msjAviso
            }]);

            if (vendedorData.usuarios?.email) {
                enviarNotificacionPorCorreo(vendedorData.usuarios.email, titulo, msjAviso);
            }

            setExito(true);
            setTimeout(() => {
                setMostrar(false);
                setMensaje("");
                setExito(false);
            }, 2000);

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setEnviando(false);
        }
    };

    return (
        <Modal show={mostrar} onHide={() => setMostrar(false)} centered>
            <Modal.Header closeButton>
                <Modal.Title>Contactar al Vendedor</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {producto && (
                    <div className="mb-3 d-flex align-items-center bg-light p-2 rounded border">
                        <img 
                            src={producto.imagen_url?.[0] || 'https://via.placeholder.com/50'} 
                            alt={producto.nombre_producto}
                            style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '5px'}}
                            className="me-3"
                        />
                        <div>
                            <strong>{producto.nombre_producto}</strong>
                            <div className="text-success fw-bold">${producto.precio_venta}</div>
                        </div>
                    </div>
                )}
                
                {error && <Alert variant="danger">{error}</Alert>}
                {exito && <Alert variant="success">Mensaje enviado. El vendedor te responderá pronto en la sección Mensajes.</Alert>}
                
                <Form.Group>
                    <Form.Label>Tu mensaje</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Ej: Hola, ¿aún tienes disponibilidad de este producto?"
                        value={mensaje}
                        onChange={(e) => setMensaje(e.target.value)}
                        disabled={exito}
                    />
                </Form.Group>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => setMostrar(false)}>Cancelar</Button>
                <Button variant="primary" onClick={enviarMensaje} disabled={enviando || exito || !mensaje.trim()}>
                    {enviando ? 'Enviando...' : 'Enviar Mensaje'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalMensaje;

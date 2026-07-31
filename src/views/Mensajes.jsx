import React, { useEffect, useMemo, useState } from "react";
import { Button, Col, Container, Form, Row, Spinner, Badge } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";
import NotificacionOperacion from "../components/NotificacionOperacion";
import { useAuth } from "../context/AuthContext";
import { enviarNotificacionPorCorreo } from "../services/emailService";

const Mensajes = () => {
    const [chats, setChats] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [textoBusqueda, setTextoBusqueda] = useState("");
    const [chatActivo, setChatActivo] = useState(null);
    const [toast, setToast] = useState({ mostrar: false, mensaje: "", tipo: "" });

    const { user } = useAuth();
    const [textoMensaje, setTextoMensaje] = useState("");
    const [mensajes, setMensajes] = useState([]);
    const [miPerfilId, setMiPerfilId] = useState(null);
    const scrollRef = React.useRef(null);

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [mensajes]);

    // 1. Obtener mi Perfil ID
    useEffect(() => {
        const obtenerPerfilId = async () => {
            if (!user) return;
            const { data } = await supabase.from('perfiles').select('perfil_id').eq('id_usuario', user.id).maybeSingle();
            if (data) setMiPerfilId(data.perfil_id);
        };
        obtenerPerfilId();
    }, [user]);

    const cargarChats = async () => {
        try {
            setCargando(true);
            if (!miPerfilId) return;

            const { data, error } = await supabase
                .from("chats")
                .select(`
                    *,
                    comprador:perfiles!comprador_id(usuarios(username)),
                    vendedor:perfiles!vendedor_id(usuarios(username)),
                    productos(nombre_producto, imagen_url),
                    mensajes(leido, emisor_id)
                `)
                .or(`comprador_id.eq.${miPerfilId},vendedor_id.eq.${miPerfilId}`)
                .order("creado_en", { ascending: false });

            if (error) throw error;
            setChats(data || []);
        } catch (err) {
            console.error("Error al cargar chats:", err.message);
            setToast({ mostrar: true, mensaje: `Error al cargar chats: ${err.message}`, tipo: "error" });
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        if (miPerfilId) cargarChats();
    }, [miPerfilId]);

    useEffect(() => {
        if (!chatActivo && chats.length > 0) {
            setChatActivo(chats[0]);
        }
    }, [chats, chatActivo]);

    const chatsFiltrados = useMemo(() => {
        if (!textoBusqueda.trim()) return chats;
        const valor = textoBusqueda.toLowerCase().trim();
        return chats.filter((chat) => {
            const nombreOtro = obtenerNombreOtro(chat).toLowerCase();
            const nombreProducto = (chat.productos?.nombre_producto || "").toLowerCase();
            const idChat = chat.id_chat.toLowerCase();
            
            return nombreOtro.includes(valor) || 
                   nombreProducto.includes(valor) || 
                   idChat.includes(valor);
        });
    }, [textoBusqueda, chats, miPerfilId]);

    const eliminarChat = async (idChat) => {
        try {
            const { error } = await supabase
                .from("chats")
                .delete()
                .eq("id_chat", idChat);
            if (error) throw error;

            if (chatActivo?.id_chat === idChat) setChatActivo(null);
            setToast({ mostrar: true, mensaje: "Chat eliminado exitosamente.", tipo: "exito" });
            await cargarChats();
        } catch (err) {
            console.error("Error al eliminar chat:", err.message);
            setToast({ mostrar: true, mensaje: `Error al eliminar chat: ${err.message}`, tipo: "error" });
        }
    };

    // 2. Cargar mensajes del chat activo y suscribirse a Realtime
    useEffect(() => {
        if (!chatActivo) {
            setMensajes([]);
            return;
        }

        const cargarMensajes = async () => {
            const { data, error } = await supabase
                .from("mensajes")
                .select("*")
                .eq("id_chat", chatActivo.id_chat)
                .order("creado_en", { ascending: true });
            
            if (data) {
                setMensajes(data);
                // Marcar como leídos los mensajes que no son míos
                const mensajesNoLeidos = data.filter(m => m.emisor_id !== miPerfilId && !m.leido);
                if (mensajesNoLeidos.length > 0) {
                    await supabase
                        .from("mensajes")
                        .update({ leido: true })
                        .eq("id_chat", chatActivo.id_chat)
                        .neq("emisor_id", miPerfilId);
                }
            }
        };

        cargarMensajes();

        const channel = supabase.channel(`mensajes_chat_${chatActivo.id_chat}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'mensajes', filter: `id_chat=eq.${chatActivo.id_chat}` },
                async (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setMensajes((prev) => [...prev, payload.new]);
                        
                        // Si el mensaje es del otro, marcarlo como leído automáticamente si el chat está abierto
                        if (payload.new.emisor_id !== miPerfilId) {
                            await supabase
                                .from("mensajes")
                                .update({ leido: true })
                                .eq("id_mensaje", payload.new.id_mensaje);
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        setMensajes((prev) => prev.map(m => m.id_mensaje === payload.new.id_mensaje ? payload.new : m));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [chatActivo]);

    const obtenerNombreOtro = (chat) => {
        if (!chat) return "Conversación";
        if (chat.vendedor_id === miPerfilId) {
            return chat.comprador?.usuarios?.username || "Comprador";
        }
        return chat.vendedor?.usuarios?.username || "Vendedor";
    };

    const enviarMensaje = async () => {
        if (!chatActivo || !textoMensaje.trim() || !miPerfilId) return;
        
        const texto = textoMensaje.trim();
        setTextoMensaje(""); // Limpiar optimista

        const { error } = await supabase
            .from("mensajes")
            .insert([{
                id_chat: chatActivo.id_chat,
                emisor_id: miPerfilId,
                texto: texto
            }]);

        if (error) {
            setToast({ mostrar: true, mensaje: "Error al enviar mensaje.", tipo: "error" });
        } else {
            // 3. Crear notificación para el receptor
            const receptorId = chatActivo.vendedor_id === miPerfilId ? chatActivo.comprador_id : chatActivo.vendedor_id;
            if (receptorId) {
                const titulo = 'Nuevo mensaje';
                const msjAviso = `Tienes un nuevo mensaje en el chat.`;
                await supabase.from('notificaciones').insert([{
                    usuario_id: receptorId,
                    titulo: titulo,
                    mensaje: msjAviso
                }]);

                const { data: receptorData } = await supabase.from('perfiles').select('usuarios(email)').eq('perfil_id', receptorId).maybeSingle();
                if (receptorData?.usuarios?.email) {
                    enviarNotificacionPorCorreo(receptorData.usuarios.email, titulo, msjAviso);
                }
            }
        }
    };

    return (
        <Container className="mensajes-page">
          
            <Row className="g-3">
                <Col lg={4}>
                    <section className="mensajes-lista">
                        <div className="mensajes-lista-header">
                            <h5 className="mb-0">Mensajes</h5>
                            <small className="text-muted">Ver todo</small>
                        </div>

                        <div className="mensajes-buscador">
                            <i className="bi bi-search" />
                            <Form.Control
                                placeholder="Buscar"
                                value={textoBusqueda}
                                onChange={(e) => setTextoBusqueda(e.target.value)}
                            />
                        </div>

                        {cargando ? (
                            <div className="text-center my-5">
                                <Spinner animation="border" variant="success" />
                            </div>
                        ) : (
                            <div className="mensajes-items">
                                {chatsFiltrados.map((chat) => (
                                    <button
                                        type="button"
                                        key={chat.id_chat}
                                        className={`mensajes-item ${chatActivo?.id_chat === chat.id_chat ? "activo" : ""}`}
                                        onClick={() => setChatActivo(chat)}
                                    >
                                        <div className="mensajes-avatar" style={{ backgroundColor: chatActivo?.id_chat === chat.id_chat ? 'var(--color-primario)' : '#94a3b8' }}>
                                            {obtenerNombreOtro(chat).charAt(0).toUpperCase()}
                                        </div>
                                        <div className="mensajes-item-body">
                                            <div className="mensajes-item-top">
                                                <strong className="text-truncate" style={{ maxWidth: '140px' }}>
                                                    {obtenerNombreOtro(chat)}
                                                </strong>
                                                <div className="d-flex flex-column align-items-end">
                                                    <small className="text-muted" style={{ fontSize: '0.65rem' }}>
                                                        {new Date(chat.creado_en).toLocaleDateString()}
                                                    </small>
                                                    {chat.mensajes?.filter(m => !m.leido && m.emisor_id !== miPerfilId).length > 0 && (
                                                        <Badge bg="primary" pill className="mt-1" style={{ fontSize: '0.6rem' }}>
                                                            {chat.mensajes.filter(m => !m.leido && m.emisor_id !== miPerfilId).length}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <small className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>
                                                    ID: {chat.id_chat.slice(0, 8)}
                                                </small>
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="text-danger p-0 ms-2"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        eliminarChat(chat.id_chat);
                                                    }}
                                                >
                                                    <i className="bi bi-trash-fill" style={{ fontSize: '0.8rem' }} />
                                                </Button>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                                {!cargando && chatsFiltrados.length === 0 && (
                                    <div className="text-center text-muted py-4">No hay chats disponibles.</div>
                                )}
                            </div>
                        )}
                    </section>
                </Col>

                <Col lg={8}>
                    <section className="mensajes-chat">
                        {chatActivo ? (
                            <>
                                <header className="mensajes-chat-header shadow-sm">
                                    <div className="mensajes-avatar grande">
                                        {obtenerNombreOtro(chatActivo).charAt(0).toUpperCase()}
                                    </div>
                                    <div className="ms-3">
                                        <h6 className="mb-0 fw-bold">{obtenerNombreOtro(chatActivo)}</h6>
                                        <div className="d-flex align-items-center gap-2">
                                            <small className="text-muted">Producto: {chatActivo.productos?.nombre_producto || "No especificado"}</small>
                                            <span className="text-muted" style={{ fontSize: '0.7rem' }}>•</span>
                                            <small className="text-muted">ID: {chatActivo.id_chat.slice(0, 8)}</small>
                                        </div>
                                    </div>
                                </header>

                                <div className="mensajes-chat-cuerpo" ref={scrollRef}>
                                    {mensajes.map((mensaje) => {
                                        const esMio = mensaje.emisor_id === miPerfilId;
                                        return (
                                            <div
                                                key={mensaje.id_mensaje}
                                                className={`burbuja-wrapper ${esMio ? "yo" : "otro"}`}
                                            >
                                                <div className="burbuja-mensaje">
                                                    <p>{mensaje.texto}</p>
                                                    <div className="d-flex align-items-center justify-content-end gap-1">
                                                        <small>{new Date(mensaje.creado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                                                        {esMio && (
                                                            <i className={`bi bi-check2${mensaje.leido ? '-all text-primary' : ''}`} style={{ fontSize: '0.8rem' }} />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <footer className="mensajes-chat-footer">
                                    <button type="button" className="btn btn-link text-dark p-0">
                                        <i className="bi bi-plus-lg" />
                                    </button>
                                    <Form.Control
                                        placeholder="Enviar mensaje"
                                        value={textoMensaje}
                                        onChange={(e) => setTextoMensaje(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                enviarMensaje();
                                            }
                                        }}
                                    />
                                    <button type="button" className="btn btn-link text-primary p-0" onClick={enviarMensaje}>
                                        <i className="bi bi-send-fill" />
                                    </button>
                                </footer>
                            </>
                        ) : (
                            <div className="h-100 d-flex flex-column justify-content-center align-items-center text-muted bg-light rounded-4 border-dashed border-2">
                                <div className="bg-white p-4 rounded-circle shadow-sm mb-3">
                                    <i className="bi bi-chat-dots text-primary" style={{ fontSize: '3rem' }} />
                                </div>
                                <h5 className="fw-bold">Tus Mensajes</h5>
                                <p className="small px-4 text-center">Selecciona una conversación de la izquierda para ver los detalles y mensajes del producto.</p>
                            </div>
                        )}
                    </section>
                </Col>
            </Row>

            <NotificacionOperacion
                mostrar={toast.mostrar}
                mensaje={toast.mensaje}
                tipo={toast.tipo}
                onCerrar={() => setToast((prev) => ({ ...prev, mostrar: false }))}
            />
        </Container>
    );
};

export default Mensajes;

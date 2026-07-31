import emailjs from '@emailjs/browser';

export const enviarNotificacionPorCorreo = async (emailDestino, titulo, mensaje) => {
    try {
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

        if (!serviceId || !templateId || !publicKey) {
            console.warn("Faltan las credenciales de EmailJS en el archivo .env");
            return false;
        }

        await emailjs.send(
            serviceId, 
            templateId, 
            {
                to_email: emailDestino,
                subject: titulo,
                message: mensaje,
            }, 
            publicKey
        );
        
        console.log(`[EmailJS] Correo enviado exitosamente a: ${emailDestino}`);
        return true;
    } catch (error) {
        console.error("Error al enviar correo con EmailJS:", error);
        return false;
    }
};

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_API_KEY;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: 'ok',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  if (!supabaseUrl || !supabaseAnonKey || !stripeSecretKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Faltan variables de entorno de Stripe o Supabase.' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { id_metodo_pago } = body;

    if (!id_metodo_pago) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'id_metodo_pago es requerido.' }),
      };
    }

    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'No autorizado.' }),
      };
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'No autorizado.' }),
      };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData?.user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'No autorizado.' }),
      };
    }

    const { data: metodo, error: metodoError } = await supabase
      .from('metodos_pago')
      .select('*')
      .eq('id_metodo_pago', id_metodo_pago)
      .maybeSingle();

    if (metodoError || !metodo || metodo.id_usuario !== userData.user.id) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Método de pago no encontrado.' }),
      };
    }

    const stripeClient = new Stripe(stripeSecretKey);

    // Solo intentar desconectar de Stripe si NO es un método manual o simulado
    const isStripeId = metodo.id_stripe_payment_method && 
                       !metodo.id_stripe_payment_method.startsWith('pm_manual_') && 
                       !metodo.id_stripe_payment_method.startsWith('pm_simulado_');

    if (isStripeId) {
      try {
        await stripeClient.paymentMethods.detach(metodo.id_stripe_payment_method);
      } catch (stripeError) {
        // Si el recurso ya no existe en Stripe, ignoramos el error para proceder a borrar el registro local
        if (stripeError?.code === 'resource_missing') {
          console.warn('Método de pago Stripe no encontrado localmente.', stripeError.message);
        } else {
          console.error('Error desconectando de Stripe:', stripeError);
          // Opcionalmente, puedes decidir borrarlo de todos modos si quieres que la DB local mande
        }
      }
    }

    const { error: deleteError } = await supabase
      .from('metodos_pago')
      .delete()
      .eq('id_metodo_pago', id_metodo_pago);

    if (deleteError) {
      throw deleteError;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Error en delete-payment-method:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Error interno.' }),
    };
  }
};

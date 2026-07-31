import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_API_KEY;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Faltan variables de entorno de Supabase.' }),
    };
  }

  try {
    const { session_id } = JSON.parse(event.body || '{}');
    if (!session_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'session_id es requerido.' }),
      };
    }

    // Manejo de pago simulado
    if (session_id.startsWith('simulado_')) {
      const { error: mockError } = await supabase.from('metodos_pago').insert({
        id_usuario: userId,
        id_stripe_customer: 'cus_simulado',
        id_stripe_payment_method: 'pm_simulado_' + Date.now(),
        ultimo4: '0000',
        tipo_metodo: 'visa_simulada',
      });

      if (mockError) throw mockError;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Pago simulado guardado.' }),
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
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
    const { data: authUserData, error: authUserError } = await supabase.auth.getUser(token);

    if (authUserError || !authUserData?.user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'No autorizado.' }),
      };
    }

    const userId = authUserData.user.id;

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['payment_intent.payment_method'],
    });

    if (!session || !session.payment_intent) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No se encontró la sesión de pago.' }),
      };
    }

    const paymentIntent = session.payment_intent;
    const paymentMethod = paymentIntent.payment_method;
    const stripeCustomerId = session.customer || null;

    if (!paymentMethod || !paymentMethod.id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No se encontró el método de pago en la sesión.' }),
      };
    }

    const { data: existingMethod } = await supabase
      .from('metodos_pago')
      .select('*')
      .eq('id_usuario', userId)
      .eq('id_stripe_payment_method', paymentMethod.id)
      .maybeSingle();

    if (existingMethod) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Método ya registrado.' }),
      };
    }

    const paymentMethodDetails = await stripe.paymentMethods.retrieve(paymentMethod.id);
    const cardDetails = paymentMethodDetails.card || {};

    const { error: insertError } = await supabase.from('metodos_pago').insert({
      id_usuario: userId,
      id_stripe_customer: stripeCustomerId,
      id_stripe_payment_method: paymentMethod.id,
      ultimo4: cardDetails.last4 || null,
      tipo_metodo: paymentMethodDetails.type || 'card',
    });

    if (insertError) {
      throw insertError;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Error en save-payment-method:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Error interno.' }),
    };
  }
};

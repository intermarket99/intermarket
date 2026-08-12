import { supabase } from "../database/supabaseconfig";

const asegurandoPerfil = new Map();
const asegurandoUsuario = new Map();

const generarUsername = (email, userId) => {
  const nombreBase = email?.split("@")[0] || "usuario";

  const nombreLimpio = nombreBase
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  return `${nombreLimpio}_${userId.slice(0, 6)}`;
};

export const obtenerMiUsuario = async (idUsuario) => {
  if (!idUsuario) return null;

  const { data, error } = await supabase
    .from("usuarios")
    .select("id_usuario, username, email, rol, restringido, infracciones")
    .eq("id_usuario", idUsuario)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo consultar el usuario: ${error.message}`);
  }

  return data || null;
};

/**
 * Garantiza que exista una fila en public.usuarios para este usuario
 * autenticado y la devuelve. Segura contra llamadas concurrentes
 * dentro de la misma pestaña (mismo patrón que asegurarPerfil).
 *
 * Se puede llamar desde Registro.jsx (registro por correo u OAuth)
 * o desde AuthContext cuando se detecta una sesión activa cuyo
 * usuario no tiene fila en public.usuarios (cuenta "huérfana",
 * por ejemplo tras un reset de base de datos).
 */
export const asegurarUsuario = async (usuarioAuth, emailOverride) => {
  if (!usuarioAuth?.id) {
    throw new Error("Falta el usuario autenticado para asegurar el registro.");
  }

  const idUsuario = usuarioAuth.id;

  if (asegurandoUsuario.has(idUsuario)) {
    return asegurandoUsuario.get(idUsuario);
  }

  const promesa = (async () => {
    try {
      const existente = await obtenerMiUsuario(idUsuario);
      if (existente) {
        return existente;
      }

      const correoLimpio =
        emailOverride?.trim().toLowerCase() ||
        usuarioAuth.email?.trim().toLowerCase() ||
        null;

      // Comprobar que el correo no pertenezca ya a otro UUID
      // (por ejemplo, una cuenta antigua reconciliada a mano).
      if (correoLimpio) {
        const { data: usuarioPorCorreo, error: correoError } = await supabase
          .from("usuarios")
          .select("id_usuario, email")
          .eq("email", correoLimpio)
          .maybeSingle();

        if (correoError) {
          throw new Error(`No se pudo comprobar el correo: ${correoError.message}`);
        }

        if (usuarioPorCorreo && usuarioPorCorreo.id_usuario !== idUsuario) {
          throw new Error("Este correo ya está relacionado con otro usuario.");
        }
      }

      const username = generarUsername(correoLimpio || "usuario", idUsuario);

      const { data: usuarioGuardado, error: guardarError } = await supabase
        .from("usuarios")
        .upsert(
          {
            id_usuario: idUsuario,
            username,
            email: correoLimpio,
            rol: "comprador",
            restringido: false,
            infracciones: 0
          },
          { onConflict: "id_usuario", ignoreDuplicates: true }
        )
        .select("id_usuario, username, email, rol, restringido, infracciones")
        .maybeSingle();

      if (guardarError && guardarError.code !== "23505") {
        throw new Error(`No se pudo crear el usuario: ${guardarError.message}`);
      }

      if (usuarioGuardado) {
        return usuarioGuardado;
      }

      // Si ignoreDuplicates evitó el insert (carrera con otra pestaña),
      // recuperamos la fila que ya quedó creada.
      const usuarioRecuperado = await obtenerMiUsuario(idUsuario);

      if (!usuarioRecuperado) {
        throw new Error("No se pudo crear ni recuperar el usuario público.");
      }

      return usuarioRecuperado;
    } finally {
      asegurandoUsuario.delete(idUsuario);
    }
  })();

  asegurandoUsuario.set(idUsuario, promesa);
  return promesa;
};

export const obtenerMiPerfil = async (idUsuario) => {
  if (!idUsuario) return null;

  const { data, error } = await supabase
    .from("perfiles")
    .select("perfil_id, id_usuario, id_tienda, foto_perfil")
    .eq("id_usuario", idUsuario)
    .order("perfil_id", { ascending: true })
    .limit(1);

  if (error) {
    throw new Error(`No se pudo consultar el perfil: ${error.message}`);
  }

  return data?.[0] || null;
};

/**
 * Garantiza que exista un perfil para este usuario y lo devuelve.
 * Segura contra llamadas concurrentes dentro de la misma pestaña.
 */
export const asegurarPerfil = async (idUsuario) => {
  if (!idUsuario) {
    throw new Error("Falta el id de usuario para asegurar el perfil.");
  }

  if (asegurandoPerfil.has(idUsuario)) {
    return asegurandoPerfil.get(idUsuario);
  }

  const promesa = (async () => {
    try {
      const existente = await obtenerMiPerfil(idUsuario);
      if (existente) {
        return existente;
      }

      const { data: creado, error: crearError } = await supabase
        .from("perfiles")
        .insert({
          id_usuario: idUsuario,
          id_tienda: null,
          foto_perfil: null
        })
        .select("perfil_id, id_usuario, id_tienda, foto_perfil")
        .single();

      if (crearError) {
        const existenteTrasError = await obtenerMiPerfil(idUsuario);
        if (existenteTrasError) {
          return existenteTrasError;
        }

        throw new Error(`No se pudo crear el perfil: ${crearError.message}`);
      }

      return creado;
    } finally {
      asegurandoPerfil.delete(idUsuario);
    }
  })();

  asegurandoPerfil.set(idUsuario, promesa);
  return promesa;
};
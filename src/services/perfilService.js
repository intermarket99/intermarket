import { supabase } from "../database/supabaseconfig";

const asegurandoPerfil = new Map();
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

  // Si ya hay una operación en curso para este usuario, únete a ella
  // en vez de disparar un insert paralelo.
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
        /*
         * Si otra pestaña/dispositivo alcanzó a crear el perfil justo
         * antes (el candado en memoria solo protege dentro de esta
         * pestaña), recuperamos el que ya existe en vez de fallar.
         */
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
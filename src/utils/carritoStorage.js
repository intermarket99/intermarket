/*
 * El carrito se guardaba antes bajo una sola clave global en
 * localStorage: "carrito". Eso significaba que si un usuario
 * agregaba productos y luego se cambiaba de cuenta (o entraba con
 * una cuenta nueva) en el mismo navegador, seguía viendo el carrito
 * de la sesión anterior — porque localStorage no distinguía entre
 * usuarios.
 *
 * La solución es simple: la clave incluye el id del usuario, así
 * cada cuenta tiene su propio carrito completamente aislado.
 */

export const obtenerClaveCarrito = (idUsuario) => {
  return idUsuario ? `carrito_${idUsuario}` : "carrito_invitado";
};

export const leerCarritoGuardado = (idUsuario) => {
  try {
    const guardado = localStorage.getItem(
      obtenerClaveCarrito(idUsuario)
    );

    return guardado ? JSON.parse(guardado) : [];
  } catch (error) {
    console.error("Error leyendo el carrito guardado:", error);
    return [];
  }
};

export const guardarCarrito = (idUsuario, carrito) => {
  try {
    localStorage.setItem(
      obtenerClaveCarrito(idUsuario),
      JSON.stringify(carrito || [])
    );
  } catch (error) {
    console.error("Error guardando el carrito:", error);
  }
};

export const limpiarCarrito = (idUsuario) => {
  localStorage.removeItem(obtenerClaveCarrito(idUsuario));
};
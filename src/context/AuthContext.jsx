import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

import { supabase } from "../database/supabaseconfig";
import { asegurarUsuario } from "../services/perfilService";

const AuthContext = createContext(null);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);

  const [role, setRole] = useState(() => {
    return localStorage.getItem("rol-activo");
  });

  const [loading, setLoading] = useState(true);

  const signOut = async () => {
    try {
      console.log("🚪 Cerrando sesión...");

      localStorage.removeItem("rol-activo");
      localStorage.removeItem("usuario-supabase");
      localStorage.removeItem("usuario");

      setRole(null);
      setUser(null);
      setSession(null);
      setLoading(false);

      const { error } =
        await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      console.log("✓ Sesión cerrada");
    } catch (error) {
      console.error(
        "❌ Error al cerrar sesión:",
        error
      );
    }
  };

  const fetchUserRole = async (
    userId,
    forceLoading = false
  ) => {
    if (!userId) {
      setRole(null);
      setLoading(false);
      return null;
    }

    console.log(
      "👤 fetchUserRole:",
      userId,
      "forceLoading:",
      forceLoading
    );

    const rolEnCache =
      localStorage.getItem("rol-activo");

    if (rolEnCache) {
      setRole(rolEnCache);
      setLoading(false);
    } else if (forceLoading) {
      setLoading(true);
    }

    try {
      const {
        data: userData,
        error: userError
      } = await supabase
        .from("usuarios")
        .select("rol, restringido")
        .eq("id_usuario", userId)
        .maybeSingle();

      if (userError) {
        throw userError;
      }

      /*
       * Puede ocurrir que el usuario exista en auth.users,
       * pero todavía no tenga registro en public.usuarios
       * (por ejemplo, cuentas antiguas afectadas por un reset
       * de la base de datos, o registros que se interrumpieron
       * a medias). En ese caso, en vez de solo simular un rol
       * temporal en localStorage, creamos la fila real ahora
       * mismo para que el resto de la app (suscripción, pagos,
       * etc.) funcione sin errores de foreign key.
       */
      if (!userData) {
        console.warn(
          "El usuario aún no existe en public.usuarios. Creándolo ahora..."
        );

        try {
          const {
            data: { user: usuarioAuth }
          } = await supabase.auth.getUser();

          if (usuarioAuth) {
            await asegurarUsuario(
              usuarioAuth,
              usuarioAuth.email
            );

            console.log(
              "✓ Fila creada en usuarios, reintentando obtener rol..."
            );

            // Reintenta ahora que la fila ya existe.
            return await fetchUserRole(
              userId,
              forceLoading
            );
          }
        } catch (creacionError) {
          console.error(
            "❌ No se pudo crear el usuario en public.usuarios:",
            creacionError
          );
        }

        // Fallback si no se pudo crear la fila (ej. sin conexión).
        const rolTemporal =
          rolEnCache || "comprador";

        localStorage.setItem(
          "rol-activo",
          rolTemporal
        );

        setRole(rolTemporal);

        return rolTemporal;
      }

      if (userData.restringido) {
        await signOut();

        alert(
          "Tu cuenta ha sido restringida ya que no cumple con las políticas."
        );

        return null;
      }

      const dbRole =
        userData.rol || "comprador";

      /*
       * Reglas:
       *
       * 1. Si la base dice comprador (nunca se suscribió,
       *    o perdió la suscripción), no puede mantenerse
       *    como vendedor sin importar el caché.
       *
       * 2. Si la base dice vendedor, respetamos el rol
       *    que la persona eligió manualmente (el caché),
       *    ya sea "vendedor" o "comprador" (viendo el
       *    catálogo como comprador). El caché ya se
       *    actualiza al instante al suscribirse
       *    (ver convertirEnVendedor en Suscripcion.jsx),
       *    así que no hace falta forzar nada aquí.
       *
       * 3. El administrador siempre conserva admin.
       */

      let rolFinal =
        rolEnCache || dbRole;

      if (dbRole === "comprador") {
        rolFinal = "comprador";
      }

      if (dbRole === "admin") {
        rolFinal = "admin";
      }

      localStorage.setItem(
        "rol-activo",
        rolFinal
      );

      setRole(rolFinal);

      console.log(
        "✓ Rol activo:",
        rolFinal
      );

      return rolFinal;
    } catch (error) {
      console.error(
        "❌ Error al validar rol en DB:",
        error
      );

      /*
       * Si falla momentáneamente Supabase,
       * conservar el rol en caché.
       */
      if (rolEnCache) {
        setRole(rolEnCache);
        return rolEnCache;
      }

      setRole("comprador");

      localStorage.setItem(
        "rol-activo",
        "comprador"
      );

      return "comprador";
    } finally {
      setLoading(false);
    }
  };

  const changeRole = (newRole) => {
    if (!newRole) {
      return;
    }

    console.log(
      "🔄 Cambiando rol activo a:",
      newRole
    );

    localStorage.setItem(
      "rol-activo",
      newRole
    );

    setRole(newRole);
  };

  const refreshRole = async () => {
    if (!user?.id) {
      return null;
    }

    try {
      const {
        data,
        error
      } = await supabase
        .from("usuarios")
        .select("rol, restringido")
        .eq("id_usuario", user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        console.warn(
          "No se encontró el usuario en public.usuarios."
        );

        return null;
      }

      if (data.restringido) {
        await signOut();

        alert(
          "Tu cuenta ha sido restringida."
        );

        return null;
      }

      const nuevoRol =
        data.rol || "comprador";

      localStorage.setItem(
        "rol-activo",
        nuevoRol
      );

      setRole(nuevoRol);

      console.log(
        "✓ Rol refrescado:",
        nuevoRol
      );

      return nuevoRol;
    } catch (error) {
      console.error(
        "❌ Error refrescando el rol:",
        error
      );

      return null;
    }
  };

  useEffect(() => {
    let lastUserId = null;
    let isInitialMount = true;

    const failsafeTimer =
      setTimeout(() => {
        setLoading(false);
      }, 1200);

    const initAuth = async () => {
      try {
        console.log(
          "🔐 Inicializando autenticación..."
        );

        const {
          data: {
            session: initialSession
          },
          error
        } =
          await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        const initialUser =
          initialSession?.user ?? null;

        setSession(initialSession);
        setUser(initialUser);

        if (initialUser) {
          lastUserId =
            initialUser.id;

          await fetchUserRole(
            initialUser.id,
            false
          );
        } else {
          setRole(null);
          localStorage.removeItem(
            "rol-activo"
          );
          setLoading(false);
        }
      } catch (error) {
        console.error(
          "❌ Error inicializando autenticación:",
          error
        );

        setLoading(false);
      } finally {
        isInitialMount = false;
        clearTimeout(
          failsafeTimer
        );
      }
    };

    initAuth();

    const {
      data: authListener
    } =
      supabase.auth.onAuthStateChange(
        async (
          event,
          currentSession
        ) => {
          console.log(
            "🔄 onAuthStateChange:",
            event,
            currentSession?.user?.email
          );

          if (
            isInitialMount &&
            (
              event ===
                "INITIAL_SESSION" ||
              event ===
                "SIGNED_IN"
            )
          ) {
            return;
          }

          const currentUser =
            currentSession?.user ??
            null;

          setSession(currentSession);
          setUser(currentUser);

          if (currentUser) {
            const debeConsultarRol =
              currentUser.id !==
                lastUserId ||
              event === "SIGNED_IN" ||
              event ===
                "TOKEN_REFRESHED" ||
              event ===
                "USER_UPDATED";

            if (debeConsultarRol) {
              lastUserId =
                currentUser.id;

              await fetchUserRole(
                currentUser.id,
                event === "SIGNED_IN"
              );
            }
          } else {
            lastUserId = null;

            setRole(null);
            setLoading(false);

            localStorage.removeItem(
              "rol-activo"
            );
          }
        }
      );

    return () => {
      clearTimeout(
        failsafeTimer
      );

      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    role,
    loading,
    signOut,
    changeRole,
    refreshRole
  };

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
};
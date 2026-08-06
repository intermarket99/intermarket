import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

import { supabase } from "../database/supabaseconfig";

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
       * pero todavía no tenga registro en public.usuarios.
       */
      if (!userData) {
        console.warn(
          "El usuario aún no existe en public.usuarios."
        );

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

      let rolFinal =
        rolEnCache || dbRole;

      /*
       * Reglas:
       *
       * 1. Si la base dice comprador,
       *    no puede mantenerse como vendedor.
       *
       * 2. Si la base ya dice vendedor,
       *    pero el caché todavía dice comprador,
       *    significa que acaba de suscribirse.
       *
       * 3. El administrador siempre conserva admin.
       */

      if (dbRole === "comprador") {
        rolFinal = "comprador";
      }

      if (dbRole === "vendedor") {
        if (
          !rolEnCache ||
          rolEnCache === "comprador"
        ) {
          rolFinal = "vendedor";
        }
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
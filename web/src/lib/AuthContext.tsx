/**
 * AuthContext — autenticación con Appwrite Account (email/contraseña).
 *
 * - Al montar el provider, intenta recuperar la sesión existente con
 *   `account.get()`. Si existe cookie de sesión válida, el usuario queda
 *   autenticado sin necesidad de volver a hacer login.
 * - `login()` crea una sesión con email+contraseña.
 * - `register()` crea el usuario con `account.create()` y, a continuación,
 *   inicia sesión automáticamente.
 * - `logout()` cierra TODAS las sesiones (`deleteSessions()`).
 *
 * Exporta el componente `<AuthProvider>` y el hook `useAuth()`.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ID, type Models } from "appwrite";
import { account } from "@/lib/appwrite";

interface AuthContextValue {
  user: Models.User<Models.Preferences> | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Recuperar sesión existente al montar.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const current = await account.get();
        if (!cancelled) setUser(current);
      } catch {
        // No hay sesión activa — es el caso normal cuando el usuario
        // aún no ha hecho login. Lo tratamos como "no autenticado".
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // `createEmailPasswordSession` reemplaza cualquier sesión existente
    // por la nueva, así que es seguro llamarlo aunque ya haya una cookie.
    await account.createEmailPasswordSession(email, password);
    const current = await account.get();
    setUser(current);
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      // Creamos el usuario y, si la app no requiere verificación de
      // email, podemos iniciar sesión inmediatamente.
      await account.create(ID.unique(), email, password, name);
      await account.createEmailPasswordSession(email, password);
      const current = await account.get();
      setUser(current);
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await account.deleteSessions();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de un <AuthProvider>");
  }
  return ctx;
}

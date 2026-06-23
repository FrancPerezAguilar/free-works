/**
 * ProtectedRoute — guarda de rutas autenticadas.
 *
 * Uso en el router:
 *   <Route element={<ProtectedRoute />}>
 *     <Route element={<AppLayout />}>
 *       <Route path="/" element={<Dashboard />} />
 *       ...
 *     </Route>
 *   </Route>
 *
 * - Mientras se recupera la sesión (`isLoading`), muestra un spinner.
 * - Si no hay usuario, redirige a `/login` (preservando la ruta
 *   original en el state para volver tras el login).
 * - Si hay usuario, renderiza `<Outlet />` con las rutas hijas.
 */

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          <p className="text-sm text-gray-500">Cargando sesión…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

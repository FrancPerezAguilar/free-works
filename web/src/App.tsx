import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useTelegram } from "@/lib/TelegramContext";
import { useAuth } from "@/lib/AuthContext";
import LoginPage from "@/pages/LoginPage";
import Dashboard from "@/pages/Dashboard";
import ClienteList from "@/pages/clientes/ClienteList";
import ClienteDetail from "@/pages/clientes/ClienteDetail";
import TrabajoList from "@/pages/trabajos/TrabajoList";
import TrabajoDetail from "@/pages/trabajos/TrabajoDetail";
import PresupuestoList from "@/pages/presupuestos/PresupuestoList";
import PresupuestoDetail from "@/pages/presupuestos/PresupuestoDetail";
import OportunidadList from "@/pages/oportunidades/OportunidadList";
import OportunidadDetail from "@/pages/oportunidades/OportunidadDetail";
import MaterialList from "@/pages/materiales/MaterialList";
import CalendarioPage from "@/pages/calendario/CalendarioPage";
import FacturaList from "@/pages/facturas/FacturaList";
import FacturaDetail from "@/pages/facturas/FacturaDetail";
import TelegramTrabajoView from "@/pages/TelegramTrabajoView";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

// ── Componentes específicos para Mini App ─────────────────────

/**
 * ProtectedRoute "inteligente" para Mini App:
 * - En Telegram: permite acceso aunque no haya sesión de Appwrite (la app
 *   confía en el API key hardcodeada para lecturas básicas).
 * - Fuera de Telegram: comportamiento idéntico al `ProtectedRoute` normal.
 */
function TelegramAwareProtectedRoute() {
  const { isTelegram } = useTelegram();
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

  // En Telegram dejamos pasar sin sesión: las API calls usan el API key.
  if (isTelegram) {
    return <Outlet />;
  }

  // Web normal: exigimos login como siempre.
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

/** Mini-shell sin sidebar/topbar/bottomnav para Telegram Mini App. */
function EmbedLayout() {
  return (
    <div className="min-h-screen w-full">
      <Outlet />
    </div>
  );
}

/**
 * Redirige `?trabajo_id=N` desde la URL al detalle correspondiente.
 * - Si viene de Telegram, usa la vista mini (`/trabajo-mini/:id`).
 * - Si es web normal, usa la vista completa (`/trabajos/:id`).
 * - Si NO hay query param:
 *     - Web normal → renderiza `Dashboard` (igual que antes).
 *     - Telegram → renderiza `TelegramTrabajoView` con id=1 (modo embed,
 *       evita el redirect a /login que rompería la mini-app).
 */
function RootRoute() {
  const [searchParams] = useSearchParams();
  const { isTelegram } = useTelegram();
  const trabajoId = searchParams.get("trabajo_id");

  if (trabajoId && /^\d+$/.test(trabajoId)) {
    const target = isTelegram
      ? `/trabajo-mini/${trabajoId}`
      : `/trabajos/${trabajoId}`;
    return <Navigate to={target} replace />;
  }

  // Sin query param: comportamiento por defecto.
  if (isTelegram) {
    return <TelegramTrabajoView />;
  }
  return <Dashboard />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Login siempre accesible (necesario en web normal). En Telegram
              el login nunca se muestra porque TelegramAwareProtectedRoute
              deja pasar sin sesión. */}
          <Route path="/login" element={<LoginPage />} />

          {/* ── Rama Telegram Mini App ───────────────────────────────
              Se evalúa ANTES que la rama normal para que las rutas
              `/trabajo-mini/:id` se matcheen con prioridad. Cuando la
              app está dentro de Telegram:
              - No exigimos login (la API key ya autentica).
              - Usamos `<EmbedLayout>` (sin sidebar/topbar/bottomnav). */}
          <Route element={<TelegramAwareProtectedRoute />}>
            <Route element={<EmbedLayout />}>
              <Route path="/" element={<RootRoute />} />
              <Route
                path="/trabajo-mini/:id"
                element={<TelegramTrabajoView />}
              />
            </Route>
          </Route>

          {/* ── Rama web normal (idéntica a la original) ─────────── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<RootRoute />} />
              <Route path="/clientes" element={<ClienteList />} />
              <Route path="/clientes/:id" element={<ClienteDetail />} />
              <Route path="/trabajos" element={<TrabajoList />} />
              <Route path="/trabajos/:id" element={<TrabajoDetail />} />
              <Route path="/presupuestos" element={<PresupuestoList />} />
              <Route
                path="/presupuestos/:id"
                element={<PresupuestoDetail />}
              />
              <Route path="/facturas" element={<FacturaList />} />
              <Route path="/facturas/:id" element={<FacturaDetail />} />
              <Route path="/oportunidades" element={<OportunidadList />} />
              <Route
                path="/oportunidades/:id"
                element={<OportunidadDetail />}
              />
              <Route path="/materiales" element={<MaterialList />} />
              <Route path="/calendario" element={<CalendarioPage />} />
            </Route>
          </Route>

          {/* Catch-all → raíz (que es TrabajoIdRedirect). Si la app está
              en Telegram y la ruta no coincide con `/trabajo-mini/*`,
              TrabajoIdRedirect la lleva al primer trabajo disponible. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
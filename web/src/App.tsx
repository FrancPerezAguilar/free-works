import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clientes" element={<ClienteList />} />
            <Route path="/clientes/:id" element={<ClienteDetail />} />
            <Route path="/trabajos" element={<TrabajoList />} />
            <Route path="/trabajos/:id" element={<TrabajoDetail />} />
            <Route path="/presupuestos" element={<PresupuestoList />} />
            <Route path="/presupuestos/:id" element={<PresupuestoDetail />} />
            <Route path="/facturas" element={<FacturaList />} />
            <Route path="/facturas/:id" element={<FacturaDetail />} />
            <Route path="/oportunidades" element={<OportunidadList />} />
            <Route path="/oportunidades/:id" element={<OportunidadDetail />} />
            <Route path="/materiales" element={<MaterialList />} />
            <Route path="/calendario" element={<CalendarioPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <p className="text-lg">{title} — próximamente</p>
    </div>
  );
}

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
            <Route path="/facturas" element={<PlaceholderPage title="Facturas" />} />
            <Route path="/facturas/:id" element={<PlaceholderPage title="Factura" />} />
            <Route path="/oportunidades" element={<PlaceholderPage title="Oportunidades" />} />
            <Route path="/oportunidades/:id" element={<PlaceholderPage title="Oportunidad" />} />
            <Route path="/materiales" element={<PlaceholderPage title="Materiales" />} />
            <Route path="/calendario" element={<PlaceholderPage title="Calendario" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFacturas } from "@/api/facturas";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ESTADOS_PAGO } from "@/lib/constants";
import { formatDate, formatCurrency } from "@/lib/utils";
import { FacturaFormModal } from "./FacturaFormModal";
import { Link } from "react-router-dom";
import { Plus, Search, Filter, Building2, Receipt } from "lucide-react";

const FILTROS_ESTADO = [
  { value: "", label: "Todos" },
  ...Object.entries(ESTADOS_PAGO).map(([value, info]) => ({
    value,
    label: info.label,
  })),
];

export default function FacturaList() {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["facturas"],
    queryFn: () => getFacturas(),
  });

  const filtered = data?.filter((f) => {
    const matchSearch =
      f.cliente_nombre?.toLowerCase().includes(search.toLowerCase()) ||
      `#${f.id}`.includes(search.toLowerCase());
    const matchEstado = !filtroEstado || f.estado_pago === filtroEstado;
    return matchSearch && matchEstado;
  });

  return (
    <div>
      <PageHeader
        title="Facturas"
        description={`${data?.length ?? 0} facturas`}
        action={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nueva factura
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente o nº factura..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="pl-10 pr-8 py-3 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            {FILTROS_ESTADO.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState
          message="Error al cargar facturas"
          onRetry={() => refetch()}
        />
      ) : !filtered || filtered.length === 0 ? (
        <EmptyState
          title={search || filtroEstado ? "Sin resultados" : "No hay facturas"}
          description={
            search || filtroEstado
              ? "Prueba con otros filtros"
              : "Crea tu primera factura"
          }
          action={
            !search && !filtroEstado ? (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 cursor-pointer"
              >
                Nueva factura
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4 font-medium">Nº</th>
                  <th className="text-left p-4 font-medium">Cliente</th>
                  <th className="text-left p-4 font-medium">Estado</th>
                  <th className="text-right p-4 font-medium">Base</th>
                  <th className="text-right p-4 font-medium">Total</th>
                  <th className="text-left p-4 font-medium">Emisión</th>
                  <th className="text-left p-4 font-medium">Vencimiento</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr key={f.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="p-4">
                      <Link
                        to={`/facturas/${f.id}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        #{f.id}
                      </Link>
                    </td>
                    <td className="p-4">{f.cliente_nombre || "—"}</td>
                    <td className="p-4">
                      <StatusBadge
                        estado={f.estado_pago}
                        mapping={ESTADOS_PAGO}
                      />
                    </td>
                    <td className="p-4 text-right">
                      {formatCurrency(f.base_imponible)}
                    </td>
                    <td className="p-4 text-right font-medium">
                      {formatCurrency(f.total)}
                    </td>
                    <td className="p-4 text-gray-500">
                      {f.fecha_emision ? formatDate(f.fecha_emision) : "—"}
                    </td>
                    <td className="p-4 text-gray-500">
                      {f.fecha_vencimiento ? formatDate(f.fecha_vencimiento) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((f) => (
              <Link key={f.id} to={`/facturas/${f.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-blue-600">Factura #{f.id}</h3>
                      <StatusBadge
                        estado={f.estado_pago}
                        mapping={ESTADOS_PAGO}
                      />
                    </div>
                    {f.cliente_nombre && (
                      <p className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                        <Building2 className="h-3 w-3" />
                        {f.cliente_nombre}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Receipt className="h-3 w-3" />
                        {formatCurrency(f.total)}
                      </span>
                      <span>
                        {f.fecha_emision ? formatDate(f.fecha_emision) : "—"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}

      {showModal && (
        <FacturaFormModal
          onClose={() => {
            setShowModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

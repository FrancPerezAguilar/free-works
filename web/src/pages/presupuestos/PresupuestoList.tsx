import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPresupuestos } from "@/api/presupuestos";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ESTADOS_PRESUPUESTO } from "@/lib/constants";
import { formatDate, formatCurrency } from "@/lib/utils";
import { PresupuestoFormModal } from "./PresupuestoFormModal";
import { Link } from "react-router-dom";
import { Plus, Search, Filter, Building2, FileText } from "lucide-react";

const FILTROS_ESTADO = [
  { value: "", label: "Todos" },
  ...Object.entries(ESTADOS_PRESUPUESTO).map(([value, info]) => ({
    value,
    label: info.label,
  })),
];

export default function PresupuestoList() {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["presupuestos"],
    queryFn: () => getPresupuestos(),
  });

  const filtered = data?.filter((p) => {
    const matchSearch =
      p.titulo.toLowerCase().includes(search.toLowerCase()) ||
      p.cliente_nombre?.toLowerCase().includes(search.toLowerCase());
    const matchEstado = !filtroEstado || p.estado === filtroEstado;
    return matchSearch && matchEstado;
  });

  return (
    <div>
      <PageHeader
        title="Presupuestos"
        description={`${data?.length ?? 0} presupuestos`}
        action={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nuevo presupuesto
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por título o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="pl-10 pr-8 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
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
          message="Error al cargar presupuestos"
          onRetry={() => refetch()}
        />
      ) : !filtered || filtered.length === 0 ? (
        <EmptyState
          title={search || filtroEstado ? "Sin resultados" : "No hay presupuestos"}
          description={
            search || filtroEstado
              ? "Prueba con otros filtros"
              : "Crea tu primer presupuesto"
          }
          action={
            !search && !filtroEstado ? (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 cursor-pointer"
              >
                Nuevo presupuesto
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-medium">Título</th>
                  <th className="text-left p-3 font-medium">Cliente</th>
                  <th className="text-left p-3 font-medium">Estado</th>
                  <th className="text-right p-3 font-medium">Base</th>
                  <th className="text-right p-3 font-medium">Total</th>
                  <th className="text-left p-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="p-3">
                      <Link
                        to={`/presupuestos/${p.id}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {p.titulo}
                      </Link>
                    </td>
                    <td className="p-3">{p.cliente_nombre || "—"}</td>
                    <td className="p-3">
                      <StatusBadge
                        estado={p.estado}
                        mapping={ESTADOS_PRESUPUESTO}
                      />
                    </td>
                    <td className="p-3 text-right">
                      {formatCurrency(p.base_imponible)}
                    </td>
                    <td className="p-3 text-right font-medium">
                      {formatCurrency(p.total)}
                    </td>
                    <td className="p-3 text-gray-500">
                      {formatDate(p.fecha_creacion)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((p) => (
              <Link key={p.id} to={`/presupuestos/${p.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-blue-600">{p.titulo}</h3>
                      <StatusBadge
                        estado={p.estado}
                        mapping={ESTADOS_PRESUPUESTO}
                      />
                    </div>
                    {p.cliente_nombre && (
                      <p className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                        <Building2 className="h-3 w-3" />
                        {p.cliente_nombre}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {formatCurrency(p.total)}
                      </span>
                      <span>{formatDate(p.fecha_creacion)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}

      {showModal && (
        <PresupuestoFormModal
          onClose={() => {
            setShowModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

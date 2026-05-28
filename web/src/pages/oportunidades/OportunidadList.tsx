import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getOportunidades } from "@/api/oportunidades";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ESTADOS_OPORTUNIDAD } from "@/lib/constants";
import { formatDate, formatCurrency } from "@/lib/utils";
import { OportunidadFormModal } from "./OportunidadFormModal";
import { Link } from "react-router-dom";
import { Plus, Search, Filter, Building2, TrendingUp } from "lucide-react";

const FILTROS_ESTADO = [
  { value: "", label: "Todos" },
  ...Object.entries(ESTADOS_OPORTUNIDAD).map(([value, info]) => ({
    value,
    label: info.label,
  })),
];

export default function OportunidadList() {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["oportunidades"],
    queryFn: () => getOportunidades(),
  });

  const filtered = data?.filter((o) => {
    const matchSearch =
      o.titulo.toLowerCase().includes(search.toLowerCase()) ||
      o.cliente_nombre?.toLowerCase().includes(search.toLowerCase());
    const matchEstado = !filtroEstado || o.estado === filtroEstado;
    return matchSearch && matchEstado;
  });

  return (
    <div>
      <PageHeader
        title="Oportunidades"
        description={`${data?.length ?? 0} oportunidades`}
        action={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nueva oportunidad
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por título o cliente..."
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
          message="Error al cargar oportunidades"
          onRetry={() => refetch()}
        />
      ) : !filtered || filtered.length === 0 ? (
        <EmptyState
          title={
            search || filtroEstado
              ? "Sin resultados"
              : "No hay oportunidades"
          }
          description={
            search || filtroEstado
              ? "Prueba con otros filtros"
              : "Crea tu primera oportunidad"
          }
          action={
            !search && !filtroEstado ? (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 cursor-pointer"
              >
                Nueva oportunidad
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
                    <th className="text-left p-4 font-medium">Título</th>
                    <th className="text-left p-4 font-medium">Cliente</th>
                    <th className="text-left p-4 font-medium">Estado</th>
                    <th className="text-center p-4 font-medium">
                      Probabilidad
                    </th>
                    <th className="text-right p-4 font-medium">
                      Presupuesto est.
                    </th>
                    <th className="text-left p-4 font-medium">
                      Fecha contacto
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => (
                    <tr
                      key={o.id}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >
                      <td className="p-4">
                        <Link
                          to={`/oportunidades/${o.id}`}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {o.titulo}
                        </Link>
                      </td>
                      <td className="p-4">{o.cliente_nombre || "—"}</td>
                      <td className="p-4">
                        <StatusBadge
                          estado={o.estado}
                          mapping={ESTADOS_OPORTUNIDAD}
                        />
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-12 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{
                                width: `${o.probabilidad_cierre}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {o.probabilidad_cierre}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        {formatCurrency(o.presupuesto_estimado)}
                      </td>
                      <td className="p-4 text-gray-500">
                        {o.fecha_contacto
                          ? formatDate(o.fecha_contacto)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((o) => (
              <Link key={o.id} to={`/oportunidades/${o.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-blue-600">{o.titulo}</h3>
                      <StatusBadge
                        estado={o.estado}
                        mapping={ESTADOS_OPORTUNIDAD}
                      />
                    </div>
                    {o.cliente_nombre && (
                      <p className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                        <Building2 className="h-3 w-3" />
                        {o.cliente_nombre}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {o.probabilidad_cierre}% ·{" "}
                        {formatCurrency(o.presupuesto_estimado)}
                      </span>
                      <span>
                        {o.fecha_contacto
                          ? formatDate(o.fecha_contacto)
                          : "—"}
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
        <OportunidadFormModal
          onClose={() => {
            setShowModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

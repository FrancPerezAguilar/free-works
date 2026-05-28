import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTrabajos } from "@/api/trabajos";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ESTADOS_TRABAJO } from "@/lib/constants";
import { formatDate, formatCurrency } from "@/lib/utils";
import { TrabajoFormModal } from "./TrabajoFormModal";
import { Link } from "react-router-dom";
import { Plus, Search, Filter, Building2, MapPin } from "lucide-react";

const FILTROS_ESTADO = [
  { value: "", label: "Todos" },
  ...Object.entries(ESTADOS_TRABAJO).map(([value, info]) => ({
    value,
    label: info.label,
  })),
];

export default function TrabajoList() {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["trabajos"],
    queryFn: () => getTrabajos(),
  });

  const filtered = data?.filter((t) => {
    const matchSearch =
      t.titulo.toLowerCase().includes(search.toLowerCase()) ||
      t.cliente_nombre?.toLowerCase().includes(search.toLowerCase()) ||
      t.codigo_trabajo?.toLowerCase().includes(search.toLowerCase());
    const matchEstado = !filtroEstado || t.estado === filtroEstado;
    return matchSearch && matchEstado;
  });

  return (
    <div>
      <PageHeader
        title="Trabajos"
        description={`${data?.length ?? 0} trabajos registrados`}
        action={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nuevo trabajo
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por título, cliente o código..."
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
        <ErrorState message="Error al cargar trabajos" onRetry={() => refetch()} />
      ) : !filtered || filtered.length === 0 ? (
        <EmptyState
          title={search || filtroEstado ? "Sin resultados" : "No hay trabajos"}
          description={
            search || filtroEstado
              ? "Prueba con otros filtros"
              : "Crea tu primer trabajo"
          }
          action={
            !search && !filtroEstado ? (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 cursor-pointer"
              >
                Nuevo trabajo
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
                  <th className="text-left p-4 font-medium">Código</th>
                  <th className="text-left p-4 font-medium">Título</th>
                  <th className="text-left p-4 font-medium">Cliente</th>
                  <th className="text-left p-4 font-medium">Municipio</th>
                  <th className="text-left p-4 font-medium">Estado</th>
                  <th className="text-left p-4 font-medium">Prioridad</th>
                  <th className="text-left p-4 font-medium">Inicio</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="p-4 text-gray-500 text-xs font-mono">
                      {t.codigo_trabajo || "—"}
                    </td>
                    <td className="p-4">
                      <Link
                        to={`/trabajos/${t.id}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {t.titulo}
                      </Link>
                    </td>
                    <td className="p-4">{t.cliente_nombre || "—"}</td>
                    <td className="p-4 text-gray-500">{t.obra_municipio || "—"}</td>
                    <td className="p-4">
                      <StatusBadge estado={t.estado} mapping={ESTADOS_TRABAJO} />
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          t.prioridad === "alta"
                            ? "bg-red-100 text-red-800"
                            : t.prioridad === "media"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {t.prioridad || "media"}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">
                      {t.fecha_inicio ? formatDate(t.fecha_inicio) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((t) => (
              <Link key={t.id} to={`/trabajos/${t.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-blue-600">{t.titulo}</h3>
                        {t.codigo_trabajo && (
                          <p className="text-xs text-gray-400 font-mono mt-0.5">
                            {t.codigo_trabajo}
                          </p>
                        )}
                      </div>
                      <StatusBadge estado={t.estado} mapping={ESTADOS_TRABAJO} />
                    </div>
                    {t.cliente_nombre && (
                      <p className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                        <Building2 className="h-3 w-3" />
                        {t.cliente_nombre}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                      {t.obra_municipio && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {t.obra_municipio}
                        </span>
                      )}
                      {t.fecha_inicio && <span>Inicio: {formatDate(t.fecha_inicio)}</span>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}

      {showModal && (
        <TrabajoFormModal onClose={() => { setShowModal(false); refetch(); }} />
      )}
    </div>
  );
}

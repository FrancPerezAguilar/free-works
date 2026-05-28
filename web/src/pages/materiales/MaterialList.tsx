import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMateriales } from "@/api/materiales";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency } from "@/lib/utils";
import { MaterialFormModal } from "./MaterialFormModal";
import { Plus, Search, Filter, Package } from "lucide-react";

export default function MaterialList() {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["materiales"],
    queryFn: () => getMateriales(),
  });

  // Extract unique categories from data
  const categorias = useMemo(() => {
    const cats = new Set<string>();
    data?.forEach((m) => {
      if (m.categoria) cats.add(m.categoria);
    });
    return Array.from(cats).sort();
  }, [data]);

  const filtered = data?.filter((m) => {
    const matchSearch = m.nombre
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchCategoria =
      !filtroCategoria || m.categoria === filtroCategoria;
    return matchSearch && matchCategoria;
  });

  return (
    <div>
      <PageHeader
        title="Materiales"
        description={`${data?.length ?? 0} materiales`}
        action={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nuevo material
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="pl-10 pr-8 py-3 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState
          message="Error al cargar materiales"
          onRetry={() => refetch()}
        />
      ) : !filtered || filtered.length === 0 ? (
        <EmptyState
          title={
            search || filtroCategoria
              ? "Sin resultados"
              : "No hay materiales"
          }
          description={
            search || filtroCategoria
              ? "Prueba con otros filtros"
              : "Añade tu primer material al catálogo"
          }
          action={
            !search && !filtroCategoria ? (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 cursor-pointer"
              >
                Nuevo material
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
                    <th className="text-left p-4 font-medium">Nombre</th>
                    <th className="text-left p-4 font-medium">Categoría</th>
                    <th className="text-right p-4 font-medium">Precio</th>
                    <th className="text-center p-4 font-medium">Ud.</th>
                    <th className="text-left p-4 font-medium">
                      Fabricante
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b last:border-0 hover:bg-gray-50"
                    >
                      <td className="p-4 font-medium">{m.nombre}</td>
                      <td className="p-4">
                        {m.categoria ? (
                          <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {m.categoria}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {formatCurrency(m.precio_unitario)}
                      </td>
                      <td className="p-4 text-center text-gray-500">
                        {m.unidad_medida}
                      </td>
                      <td className="p-4 text-gray-500">
                        {m.fabricante || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((m) => (
              <Card key={m.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{m.nombre}</h3>
                      {m.categoria && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {m.categoria}
                        </span>
                      )}
                    </div>
                    <span className="font-medium text-blue-600">
                      {formatCurrency(m.precio_unitario)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3" />/{m.unidad_medida}
                    </span>
                    <span>{m.fabricante || "—"}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {showModal && (
        <MaterialFormModal
          onClose={() => {
            setShowModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

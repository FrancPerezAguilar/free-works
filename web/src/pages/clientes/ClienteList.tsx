import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getClientes } from "@/api/clientes";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ESTADOS_TRABAJO } from "@/lib/constants";
import { ClienteFormModal } from "./ClienteFormModal";
import { Link } from "react-router-dom";
import { Plus, Search, MapPin, Phone } from "lucide-react";

export default function ClienteList() {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => getClientes(),
  });

  const filtered = data?.filter(
    (c) =>
      c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      c.direccion_municipio?.toLowerCase().includes(search.toLowerCase()) ||
      c.telefono_principal?.includes(search)
  );

  return (
    <div>
      <PageHeader
        title="Clientes"
        description={`${data?.length ?? 0} clientes registrados`}
        action={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nuevo cliente
          </button>
        }
      />

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, municipio o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message="Error al cargar clientes" onRetry={() => refetch()} />
      ) : !filtered || filtered.length === 0 ? (
        <EmptyState
          title={search ? "Sin resultados" : "No hay clientes"}
          description={search ? "Prueba con otro término" : "Añade tu primer cliente"}
          action={
            !search ? (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 cursor-pointer"
              >
                Añadir cliente
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
                  <th className="text-left p-3 font-medium">Nombre</th>
                  <th className="text-left p-3 font-medium">NIF</th>
                  <th className="text-left p-3 font-medium">Teléfono</th>
                  <th className="text-left p-3 font-medium">Municipio</th>
                  <th className="text-left p-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="p-3">
                      <Link to={`/clientes/${c.id}`} className="text-blue-600 hover:underline font-medium">
                        {c.nombre}
                      </Link>
                    </td>
                    <td className="p-3 text-gray-500">{c.nif_cif || "-"}</td>
                    <td className="p-3">{c.telefono_principal || "-"}</td>
                    <td className="p-3">{c.direccion_municipio || "-"}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        c.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {c.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((c) => (
              <Link key={c.id} to={`/clientes/${c.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-blue-600">{c.nombre}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        c.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {c.active ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    {c.nif_cif && <p className="text-xs text-gray-500 mt-1">{c.nif_cif}</p>}
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      {c.telefono_principal && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {c.telefono_principal}
                        </span>
                      )}
                      {c.direccion_municipio && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {c.direccion_municipio}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}

      {showModal && <ClienteFormModal onClose={() => { setShowModal(false); refetch(); }} />}
    </div>
  );
}

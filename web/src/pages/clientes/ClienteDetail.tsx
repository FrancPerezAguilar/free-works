import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCliente } from "@/api/clientes";
import { getTrabajos } from "@/api/trabajos";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ESTADOS_TRABAJO } from "@/lib/constants";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ArrowLeft, MapPin, Phone, Mail, FileText } from "lucide-react";

export default function ClienteDetail() {
  const { id } = useParams<{ id: string }>();
  const clienteId = Number(id);

  const { data: cliente, isLoading, error, refetch } = useQuery({
    queryKey: ["cliente", clienteId],
    queryFn: () => getCliente(clienteId),
    enabled: !!clienteId,
  });

  const { data: trabajos } = useQuery({
    queryKey: ["trabajos", "cliente", clienteId],
    queryFn: () => getTrabajos(),
    select: (t) => t.filter((t) => t.cliente_id === clienteId),
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState onRetry={() => refetch()} />;
  if (!cliente) return <p className="text-gray-500">Cliente no encontrado</p>;

  return (
    <div>
      <Link to="/clientes" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="h-4 w-4" /> Volver a clientes
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ficha cliente */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold">{cliente.nombre}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full inline-block w-fit ${
                cliente.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
              }`}>
                {cliente.active ? "Activo" : "Inactivo"}
              </span>
            </CardHeader>
            <CardContent className="space-y-3">
              {cliente.nif_cif && (
                <div className="text-sm">
                  <span className="text-gray-500">NIF/CIF:</span> {cliente.nif_cif}
                </div>
              )}
              {cliente.telefono_principal && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  {cliente.telefono_principal}
                </div>
              )}
              {cliente.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  {cliente.email}
                </div>
              )}
              {(cliente.direccion_municipio || cliente.direccion_calle) && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <span>
                    {cliente.direccion_calle} {cliente.direccion_numero}
                    {cliente.direccion_piso_puerta ? `, ${cliente.direccion_piso_puerta}` : ""}
                    <br />
                    {cliente.direccion_municipio}, {cliente.direccion_provincia}
                  </span>
                </div>
              )}
              {cliente.forma_pago_preferida && (
                <div className="text-sm">
                  <span className="text-gray-500">Forma de pago:</span> {cliente.forma_pago_preferida}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Trabajos del cliente */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Trabajos</h2>
            </CardHeader>
            <CardContent>
              {!trabajos || trabajos.length === 0 ? (
                <p className="text-gray-500 text-sm">Este cliente no tiene trabajos registrados</p>
              ) : (
                <div className="space-y-3">
                  {trabajos.map((t) => (
                    <Link
                      key={t.id}
                      to={`/trabajos/${t.id}`}
                      className="block p-3 border rounded-md hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{t.titulo}</span>
                        </div>
                        <StatusBadge estado={t.estado} mapping={ESTADOS_TRABAJO} />
                      </div>
                      {t.descripcion && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{t.descripcion}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-gray-400">
                        <span>Estado: {t.estado}</span>
                        {t.fecha_inicio && <span>Inicio: {formatDate(t.fecha_inicio)}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

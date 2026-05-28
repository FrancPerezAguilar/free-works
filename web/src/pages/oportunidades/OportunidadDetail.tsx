import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOportunidad, updateOportunidad } from "@/api/oportunidades";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ESTADOS_OPORTUNIDAD } from "@/lib/constants";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  Building2,
  Calendar,
  TrendingUp,
  Mail,
  Phone,
  MapPin,
  Globe,
  Star,
  FileText,
  Percent,
} from "lucide-react";

const ORIGEN_ICONS: Record<string, React.ReactNode> = {
  llamada: <Phone className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  visita: <MapPin className="h-4 w-4" />,
  recomendacion: <Star className="h-4 w-4" />,
  web: <Globe className="h-4 w-4" />,
};

const ORIGEN_LABELS: Record<string, string> = {
  llamada: "Llamada",
  email: "Email",
  visita: "Visita",
  recomendacion: "Recomendación",
  web: "Web",
};

export default function OportunidadDetail() {
  const { id } = useParams<{ id: string }>();
  const oportunidadId = Number(id);
  const queryClient = useQueryClient();
  const [notas, setNotas] = useState("");

  const {
    data: o,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["oportunidad", oportunidadId],
    queryFn: () => getOportunidad(oportunidadId),
    enabled: !!oportunidadId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { estado?: string }) =>
      updateOportunidad(oportunidadId, data),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["oportunidad", oportunidadId],
      }),
  });

  const saveNotasMutation = useMutation({
    mutationFn: () =>
      updateOportunidad(oportunidadId, { notas_seguimiento: notas }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["oportunidad", oportunidadId],
      });
    },
  });

  if (isLoading) return <LoadingState />;
  if (error)
    return (
      <ErrorState
        message="Error al cargar la oportunidad"
        onRetry={() => refetch()}
      />
    );
  if (!o)
    return <p className="text-gray-500">Oportunidad no encontrada</p>;

  // Sync notas state when data loads
  if (notas === "" && o.notas_seguimiento) {
    setNotas(o.notas_seguimiento);
  }

  return (
    <div>
      {/* Back link */}
      <Link
        to="/oportunidades"
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a oportunidades
      </Link>

      {/* Header */}
      <Card className="mb-6">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold">{o.titulo}</h1>
                <StatusBadge
                  estado={o.estado}
                  mapping={ESTADOS_OPORTUNIDAD}
                />
              </div>
              {o.cliente_nombre && (
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  {o.cliente_nombre}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main: info general + notas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información general */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-400" />
                Información general
              </h2>
            </CardHeader>
            <CardContent>
              {o.descripcion && (
                <div className="mb-4">
                  <h3 className="text-xs font-medium text-gray-500 mb-1">
                    Descripción
                  </h3>
                  <p className="text-sm">{o.descripcion}</p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-xs font-medium text-gray-500 mb-1">
                    Creado
                  </h3>
                  <p className="text-sm flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    {formatDate(o.fecha_creacion)}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-gray-500 mb-1">
                    Origen
                  </h3>
                  <p className="text-sm flex items-center gap-1">
                    {o.origen && ORIGEN_ICONS[o.origen] ? (
                      <>
                        {ORIGEN_ICONS[o.origen]}
                        {ORIGEN_LABELS[o.origen] || o.origen}
                      </>
                    ) : (
                      "—"
                    )}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-gray-500 mb-1">
                    Fecha contacto
                  </h3>
                  <p className="text-sm">
                    {o.fecha_contacto
                      ? formatDate(o.fecha_contacto)
                      : "—"}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-gray-500 mb-1">
                    Probabilidad
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-500 h-2.5 rounded-full"
                        style={{ width: `${o.probabilidad_cierre}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {o.probabilidad_cierre}%
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-gray-500 mb-1">
                    Presupuesto estimado
                  </h3>
                  <p className="text-sm font-medium">
                    {formatCurrency(o.presupuesto_estimado)}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-gray-500 mb-1">
                    Cierre estimado
                  </h3>
                  <p className="text-sm">
                    {o.fecha_cierre_estimada
                      ? formatDate(o.fecha_cierre_estimada)
                      : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notas de seguimiento */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-400" />
                Notas de seguimiento
              </h2>
            </CardHeader>
            <CardContent>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="w-full py-3 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Escribe notas de seguimiento..."
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={() => saveNotasMutation.mutate()}
                  disabled={saveNotasMutation.isPending}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  {saveNotasMutation.isPending
                    ? "Guardando..."
                    : "Guardar notas"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Cliente */}
          {o.cliente_id && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold">Cliente</h3>
              </CardHeader>
              <CardContent>
                <Link
                  to={`/clientes/${o.cliente_id}`}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <Building2 className="h-4 w-4" />
                  {o.cliente_nombre}
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Cambiar estado */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold">Estado</h3>
            </CardHeader>
            <CardContent>
              <select
                value={o.estado}
                onChange={(e) =>
                  updateMutation.mutate({ estado: e.target.value })
                }
                className="w-full py-3 px-3 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(ESTADOS_OPORTUNIDAD).map(
                  ([value, info]) => (
                    <option key={value} value={value}>
                      {info.label}
                    </option>
                  ),
                )}
              </select>
            </CardContent>
          </Card>

          {/* Probabilidad slider */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gray-400" />
                Probabilidad de cierre
              </h3>
            </CardHeader>
            <CardContent>
              <input
                type="range"
                min="0"
                max="100"
                value={o.probabilidad_cierre}
                onChange={(e) =>
                  updateMutation.mutate({
                    probabilidad_cierre: Number(e.target.value),
                  } as unknown as { estado?: string })
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span className="text-lg font-bold text-blue-600">
                  {o.probabilidad_cierre}%
                </span>
                <span>100%</span>
              </div>
            </CardContent>
          </Card>

          {/* Resumen */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold">Resumen</h3>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Presupuesto est.</span>
                <span className="font-medium">
                  {formatCurrency(o.presupuesto_estimado)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Probabilidad</span>
                <span className="font-medium">
                  {o.probabilidad_cierre}%
                </span>
              </div>
              {o.fecha_cierre_estimada && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Cierre est.</span>
                  <span>{formatDate(o.fecha_cierre_estimada)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-xs text-gray-400">
            {o.fecha_modificacion
              ? `Modificado: ${formatDate(o.fecha_modificacion)}`
              : `Creado: ${formatDate(o.fecha_creacion)}`}
          </p>
        </div>
      </div>
    </div>
  );
}

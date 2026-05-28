import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPresupuesto, updatePresupuesto } from "@/api/presupuestos";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ESTADOS_PRESUPUESTO } from "@/lib/constants";
import { formatDate, formatCurrency } from "@/lib/utils";
import { LineasSection } from "./LineasSection";
import { ArrowLeft, Building2, Calendar, FileText, Percent } from "lucide-react";

export default function PresupuestoDetail() {
  const { id } = useParams<{ id: string }>();
  const presupuestoId = Number(id);
  const queryClient = useQueryClient();
  const [editando, setEditando] = useState(false);

  const { data: p, isLoading, error, refetch } = useQuery({
    queryKey: ["presupuesto", presupuestoId],
    queryFn: () => getPresupuesto(presupuestoId),
    enabled: !!presupuestoId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { estado?: string }) =>
      updatePresupuesto(presupuestoId, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["presupuesto", presupuestoId] }),
  });

  if (isLoading) return <LoadingState />;
  if (error)
    return (
      <ErrorState
        message="Error al cargar el presupuesto"
        onRetry={() => refetch()}
      />
    );
  if (!p) return <p className="text-gray-500">Presupuesto no encontrado</p>;

  const difBaseTotal = p.total - p.base_imponible;
  const totalLineas =
    p.lineas?.reduce((sum, l) => sum + (l.importe || 0), 0) ?? 0;

  return (
    <div>
      {/* Back link */}
      <Link
        to="/presupuestos"
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a presupuestos
      </Link>

      {/* Header */}
      <Card className="mb-6">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold">{p.titulo}</h1>
                <StatusBadge estado={p.estado} mapping={ESTADOS_PRESUPUESTO} />
              </div>
              {p.cliente_nombre && (
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  {p.cliente_nombre}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEditando(!editando)}
                className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 cursor-pointer"
              >
                {editando ? "Cerrar" : "Editar"}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main: info + líneas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Information */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-400" />
                Información general
              </h2>
            </CardHeader>
            <CardContent>
              {p.descripcion && (
                <div className="mb-4">
                  <h3 className="text-xs font-medium text-gray-500 mb-1">
                    Descripción
                  </h3>
                  <p className="text-sm">{p.descripcion}</p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <h3 className="text-xs font-medium text-gray-500 mb-1">
                    Creado
                  </h3>
                  <p className="text-sm flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    {formatDate(p.fecha_creacion)}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-gray-500 mb-1">
                    Validez
                  </h3>
                  <p className="text-sm">{p.validez_dias} días</p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-gray-500 mb-1">
                    Condiciones pago
                  </h3>
                  <p className="text-sm">{p.condiciones_pago || "—"}</p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-gray-500 mb-1">
                    IVA
                  </h3>
                  <p className="text-sm flex items-center gap-1">
                    <Percent className="h-3.5 w-3.5 text-gray-400" />
                    {p.tipo_iva}%
                  </p>
                </div>
              </div>

              {p.notas && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="text-xs font-medium text-gray-500 mb-1">
                    Notas
                  </h3>
                  <p className="text-sm">{p.notas}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Líneas */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Partidas</h2>
            </CardHeader>
            <CardContent>
              <LineasSection
                presupuestoId={presupuestoId}
                lineas={p.lineas ?? []}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Cliente */}
          {p.cliente_id && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold">Cliente</h3>
              </CardHeader>
              <CardContent>
                <Link
                  to={`/clientes/${p.cliente_id}`}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <Building2 className="h-4 w-4" />
                  {p.cliente_nombre}
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
                value={p.estado}
                onChange={(e) =>
                  updateMutation.mutate({ estado: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(ESTADOS_PRESUPUESTO).map(([value, info]) => (
                  <option key={value} value={value}>
                    {info.label}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          {/* Totales */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold">Totales</h3>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Base imponible</span>
                <span>{formatCurrency(p.base_imponible)}</span>
              </div>
              {totalLineas > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total líneas</span>
                  <span>{formatCurrency(totalLineas)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  IVA ({p.tipo_iva}%)
                </span>
                <span>
                  {p.iva > 0
                    ? formatCurrency(p.iva)
                    : formatCurrency(difBaseTotal)}
                </span>
              </div>
              {p.retencion_irpf > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Ret. IRPF</span>
                  <span className="text-red-600">
                    -{formatCurrency(p.retencion_irpf)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-medium border-t pt-2">
                <span>Total</span>
                <span className="text-lg">
                  {formatCurrency(p.total)}
                </span>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-gray-400">
            {p.fecha_modificacion
              ? `Modificado: ${formatDate(p.fecha_modificacion)}`
              : `Creado: ${formatDate(p.fecha_creacion)}`}
          </p>
        </div>
      </div>
    </div>
  );
}

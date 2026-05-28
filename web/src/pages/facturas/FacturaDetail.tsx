import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFactura, updateFactura } from "@/api/facturas";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ESTADOS_PAGO } from "@/lib/constants";
import { formatDate, formatCurrency } from "@/lib/utils";
import { LineasFacturaSection } from "./LineasFacturaSection";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Receipt,
  Percent,
  CreditCard,
  MapPin,
  Briefcase,
  FileText,
} from "lucide-react";

export default function FacturaDetail() {
  const { id } = useParams<{ id: string }>();
  const facturaId = Number(id);
  const queryClient = useQueryClient();
  const [editando, setEditando] = useState(false);

  const {
    data: f,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["factura", facturaId],
    queryFn: () => getFactura(facturaId),
    enabled: !!facturaId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { estado_pago?: string }) =>
      updateFactura(facturaId, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["factura", facturaId] }),
  });

  if (isLoading) return <LoadingState />;
  if (error)
    return (
      <ErrorState
        message="Error al cargar la factura"
        onRetry={() => refetch()}
      />
    );
  if (!f) return <p className="text-gray-500">Factura no encontrada</p>;

  const difBaseTotal = f.total - f.base_imponible;
  const totalLineas =
    f.lineas?.reduce((sum, l) => sum + (l.importe || 0), 0) ?? 0;

  const direccionCompleta = [
    f.factura_direccion_calle,
    f.factura_direccion_numero,
    f.factura_direccion_codigo_postal,
    f.factura_direccion_municipio,
    f.factura_direccion_provincia,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div>
      {/* Back link */}
      <Link
        to="/facturas"
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a facturas
      </Link>

      {/* Header */}
      <Card className="mb-6">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold">
                  Factura #{f.id}
                </h1>
                <StatusBadge estado={f.estado_pago} mapping={ESTADOS_PAGO} />
              </div>
              {f.cliente_nombre && (
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  {f.cliente_nombre}
                  {f.nif_cif_cliente && (
                    <span className="ml-1 text-gray-400">
                      — {f.nif_cif_cliente}
                    </span>
                  )}
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
          {/* Información general */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Receipt className="h-5 w-5 text-gray-400" />
                Información general
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <h3 className="text-xs font-medium text-gray-500 mb-1">
                    Tipo
                  </h3>
                  <p className="text-sm capitalize">{f.tipo || "—"}</p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-gray-500 mb-1">
                    Emisión
                  </h3>
                  <p className="text-sm flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    {f.fecha_emision ? formatDate(f.fecha_emision) : "—"}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-gray-500 mb-1">
                    Vencimiento
                  </h3>
                  <p className="text-sm flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    {f.fecha_vencimiento
                      ? formatDate(f.fecha_vencimiento)
                      : "—"}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-gray-500 mb-1">
                    IVA
                  </h3>
                  <p className="text-sm flex items-center gap-1">
                    <Percent className="h-3.5 w-3.5 text-gray-400" />
                    {f.tipo_iva}%
                  </p>
                </div>
              </div>

              {/* Vinculados */}
              {(f.trabajo_id || f.presupuesto_id) && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="text-xs font-medium text-gray-500 mb-2">
                    Vinculado a
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {f.trabajo_id && (
                      <Link
                        to={`/trabajos/${f.trabajo_id}`}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                      >
                        <Briefcase className="h-3.5 w-3.5" />
                        Trabajo #{f.trabajo_id}
                      </Link>
                    )}
                    {f.presupuesto_id && (
                      <Link
                        to={`/presupuestos/${f.presupuesto_id}`}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Presupuesto #{f.presupuesto_id}
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Datos del cliente */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-gray-400" />
                Datos del cliente
              </h2>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Cliente</span>
                  <span>
                    {f.cliente_id ? (
                      <Link
                        to={`/clientes/${f.cliente_id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {f.cliente_nombre || `Cliente #${f.cliente_id}`}
                      </Link>
                    ) : (
                      f.cliente_nombre || "—"
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">NIF/CIF</span>
                  <span>{f.nif_cif_cliente || "—"}</span>
                </div>
                {direccionCompleta && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Dirección</span>
                    <span className="flex items-center gap-1 text-right max-w-[60%]">
                      <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      {direccionCompleta}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Líneas */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Partidas</h2>
            </CardHeader>
            <CardContent>
              <LineasFacturaSection
                facturaId={facturaId}
                lineas={f.lineas ?? []}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Cliente */}
          {f.cliente_id && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold">Cliente</h3>
              </CardHeader>
              <CardContent>
                <Link
                  to={`/clientes/${f.cliente_id}`}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <Building2 className="h-4 w-4" />
                  {f.cliente_nombre}
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Cambiar estado de pago */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold">Estado de pago</h3>
            </CardHeader>
            <CardContent>
              <select
                value={f.estado_pago}
                onChange={(e) =>
                  updateMutation.mutate({ estado_pago: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(ESTADOS_PAGO).map(([value, info]) => (
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
                <span>{formatCurrency(f.base_imponible)}</span>
              </div>
              {totalLineas > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total líneas</span>
                  <span>{formatCurrency(totalLineas)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  IVA ({f.tipo_iva}%)
                </span>
                <span>
                  {f.iva > 0
                    ? formatCurrency(f.iva)
                    : formatCurrency(difBaseTotal)}
                </span>
              </div>
              {f.retencion_irpf > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Ret. IRPF</span>
                  <span className="text-red-600">
                    -{formatCurrency(f.retencion_irpf)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-medium border-t pt-2">
                <span>Total</span>
                <span className="text-lg">
                  {formatCurrency(f.total)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Datos bancarios */}
          {(f.datos_bancarios_iban || f.datos_bancarios_titular) && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  Datos bancarios
                </h3>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {f.datos_bancarios_titular && (
                  <div>
                    <span className="text-gray-500">Titular: </span>
                    {f.datos_bancarios_titular}
                  </div>
                )}
                {f.datos_bancarios_iban && (
                  <div>
                    <span className="text-gray-500">IBAN: </span>
                    <span className="font-mono">{f.datos_bancarios_iban}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Forma de pago / Régimen IVA */}
          {(f.forma_pago || f.regimen_iva) && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold">Datos de pago</h3>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {f.forma_pago && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Forma de pago</span>
                    <span className="capitalize">{f.forma_pago}</span>
                  </div>
                )}
                {f.regimen_iva && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Régimen IVA</span>
                    <span>{f.regimen_iva}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <p className="text-xs text-gray-400">
            Creada: {formatDate(f.fecha_creacion)}
          </p>
        </div>
      </div>
    </div>
  );
}

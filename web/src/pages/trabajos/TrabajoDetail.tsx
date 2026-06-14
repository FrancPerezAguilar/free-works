import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTrabajo, updateTrabajo } from "@/api/trabajos";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ESTADOS_TRABAJO } from "@/lib/constants";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ChecklistSection } from "./ChecklistSection";
import { TiemposSection } from "./TiemposSection";
import { MaterialesSection } from "./MaterialesSection";
import { ComentariosSection } from "./ComentariosSection";
import { TecnicosSection } from "./TecnicosSection";
import { AdjuntosSection } from "./AdjuntosSection";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  CheckSquare,
  MessageSquare,
  Users,
  Paperclip,
} from "lucide-react";

type Tab = "info" | "checklist" | "tiempos" | "materiales" | "comentarios" | "tecnicos" | "adjuntos";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "info", label: "Información", icon: FileText },
  { id: "checklist", label: "Checklist", icon: CheckSquare },
  { id: "tecnicos", label: "Técnicos", icon: Users },
  { id: "tiempos", label: "Tiempos", icon: Clock },
  { id: "materiales", label: "Materiales", icon: DollarSign },
  { id: "adjuntos", label: "Adjuntos", icon: Paperclip },
  { id: "comentarios", label: "Comentarios", icon: MessageSquare },
];

export default function TrabajoDetail() {
  const { id } = useParams<{ id: string }>();
  const trabajoId = Number(id);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("info");

  const { data: trabajo, isLoading, error, refetch } = useQuery({
    queryKey: ["trabajo", trabajoId],
    queryFn: () => getTrabajo(trabajoId),
    enabled: !!trabajoId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { estado?: string; prioridad?: string }) =>
      updateTrabajo(trabajoId, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["trabajo", trabajoId] }),
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message="Error al cargar el trabajo" onRetry={() => refetch()} />;
  if (!trabajo) return <p className="text-gray-500">Trabajo no encontrado</p>;

  const costeMateriales = trabajo.materiales?.reduce(
    (sum, m) => sum + (m.subtotal ?? (m.cantidad * (m.precio_unitario ?? 0))),
    0,
  ) ?? 0;

  return (
    <div>
      {/* Back link */}
      <Link
        to="/trabajos"
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a trabajos
      </Link>

      {/* Header */}
      <Card className="mb-6">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold">{trabajo.titulo}</h1>
                <StatusBadge estado={trabajo.estado} mapping={ESTADOS_TRABAJO} />
              </div>
              {trabajo.codigo_trabajo && (
                <p className="text-sm text-gray-400 font-mono mt-1">
                  {trabajo.codigo_trabajo}
                </p>
              )}
            </div>

            {/* Quick actions */}
            {trabajo.estado !== "cancelado" && trabajo.estado !== "completado" && (
              <div className="flex gap-2">
                {trabajo.estado === "pendiente" && (
                  <button
                    onClick={() => updateMutation.mutate({ estado: "en_curso" })}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
                  >
                    Iniciar trabajo
                  </button>
                )}
                {trabajo.estado === "en_curso" && (
                  <button
                    onClick={() => updateMutation.mutate({ estado: "completado" })}
                    className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer"
                  >
                    Completar
                  </button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content area */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="border-b mb-4 overflow-x-auto">
            <div className="flex gap-0 min-w-max">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                      activeTab === tab.id
                        ? "border-blue-600 text-blue-700 font-medium"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab content */}
          <Card>
            <CardContent className="p-4 md:p-6">
              {activeTab === "info" && (
                <div className="space-y-6">
                  {trabajo.descripcion && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">
                        Descripción
                      </h3>
                      <p className="text-sm">{trabajo.descripcion}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {trabajo.fecha_inicio && (
                      <div>
                        <h3 className="text-xs font-medium text-gray-500 mb-1">
                          Fecha inicio
                        </h3>
                        <p className="text-sm flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          {formatDate(trabajo.fecha_inicio)}
                        </p>
                      </div>
                    )}
                    {trabajo.fecha_fin_estimada && (
                      <div>
                        <h3 className="text-xs font-medium text-gray-500 mb-1">
                          Fin estimado
                        </h3>
                        <p className="text-sm flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          {formatDate(trabajo.fecha_fin_estimada)}
                        </p>
                      </div>
                    )}
                    {trabajo.fecha_fin_real && (
                      <div>
                        <h3 className="text-xs font-medium text-gray-500 mb-1">
                          Fin real
                        </h3>
                        <p className="text-sm flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          {formatDate(trabajo.fecha_fin_real)}
                        </p>
                      </div>
                    )}
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 mb-1">
                        Prioridad
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          trabajo.prioridad === "alta"
                            ? "bg-red-100 text-red-800"
                            : trabajo.prioridad === "media"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {trabajo.prioridad || "media"}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 mb-1">
                        Total horas
                      </h3>
                      <p className="text-sm flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        {trabajo.total_horas ?? 0}h
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 mb-1">
                        Coste materiales
                      </h3>
                      <p className="text-sm flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                        {formatCurrency(costeMateriales)}
                      </p>
                    </div>
                  </div>

                  {trabajo.obra_municipio && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">
                        Dirección de obra
                      </h3>
                      <p className="text-sm flex items-start gap-1">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span>
                          {[trabajo.obra_calle, trabajo.obra_numero]
                            .filter(Boolean)
                            .join(" ")}
                          {trabajo.obra_piso_puerta && `, ${trabajo.obra_piso_puerta}`}
                          <br />
                          {trabajo.obra_municipio}
                          {trabajo.obra_provincia && `, ${trabajo.obra_provincia}`}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "checklist" && (
                <ChecklistSection
                  trabajoId={trabajoId}
                  items={trabajo.checklist}
                />
              )}

              {activeTab === "tiempos" && (
                <TiemposSection
                  trabajoId={trabajoId}
                  items={trabajo.tiempos}
                />
              )}

              {activeTab === "materiales" && (
                <MaterialesSection items={trabajo.materiales} />
              )}

              {activeTab === "comentarios" && (
                <ComentariosSection
                  trabajoId={trabajoId}
                  items={trabajo.comentarios}
                />
              )}

              {activeTab === "tecnicos" && (
                <TecnicosSection
                  trabajoId={trabajoId}
                  tecnicos={trabajo.tecnicos_asignados}
                />
              )}

              {activeTab === "adjuntos" && (
                <AdjuntosSection adjuntos={trabajo.adjuntos} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold">Cliente</h3>
            </CardHeader>
            <CardContent>
              {trabajo.cliente_nombre ? (
                <div>
                  <Link
                    to={`/clientes/${trabajo.cliente_id}`}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                  >
                    <Building2 className="h-4 w-4" />
                    {trabajo.cliente_nombre}
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Sin cliente asignado</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold">Cambiar estado</h3>
            </CardHeader>
            <CardContent>
              <select
                value={trabajo.estado}
                onChange={(e) => updateMutation.mutate({ estado: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(ESTADOS_TRABAJO).map(([value, info]) => (
                  <option key={value} value={value}>
                    {info.label}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold">Costes</h3>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Mano de obra</span>
                <span>
                  {trabajo.coste_mano_obra
                    ? formatCurrency(trabajo.coste_mano_obra)
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Materiales</span>
                <span>{formatCurrency(costeMateriales)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium border-t pt-2">
                <span>Total</span>
                <span>
                  {formatCurrency(
                    (trabajo.coste_total ?? 0) || costeMateriales,
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-gray-400">
            Creado: {trabajo.fecha_creacion ? formatDate(trabajo.fecha_creacion) : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

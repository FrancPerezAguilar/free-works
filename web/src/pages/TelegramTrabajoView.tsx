/**
 * TelegramTrabajoView — vista simplificada de un trabajo para usar dentro
 * de Telegram Mini App.
 *
 * - Sin sidebar, sin tabs: todo el contenido va apilado y vertical.
 * - Muestra SOLO la información esencial pedida en el spec:
 *   título, cliente, estado, fechas y prioridad.
 * - Mantiene el checklist debajo (la única sub-sección útil en un mobile).
 * - Usa los mismos API calls que la vista detalle normal (`getTrabajo`,
 *   `completarTarea`, `addTareaChecklist`) — no añadimos endpoints nuevos.
 * - Se integra con el BackButton nativo de Telegram vía
 *   `useTelegramBackButton(true)`.
 *
 * Diseño: cabecera sticky con el título + código, y el resto como una
 * lista vertical de "cards" pequeñas con buen contraste tanto en
 * light como en dark mode (gracias a las CSS vars `--tg-theme-*` que
 * aplica `TelegramProvider`).
 */

import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTrabajo,
  completarTarea,
  addTareaChecklist,
} from "@/api/trabajos";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ESTADOS_TRABAJO } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { useTelegramBackButton } from "@/lib/TelegramContext";
import {
  Building2,
  Calendar,
  Check,
  CheckSquare,
  MapPin,
  Plus,
  Wrench,
} from "lucide-react";

export default function TelegramTrabajoView() {
  const { id } = useParams<{ id: string }>();
  const trabajoId = Number(id);

  // En una mini-app siempre hay "back" virtual: aunque no haya historial
  // SPA, queremos que el botón cierre la mini-app si el usuario entra
  // directamente. El provider ya hace esa lógica; aquí solo pedimos mostrarlo.
  useTelegramBackButton(true);

  const queryClient = useQueryClient();
  const [nuevaTarea, setNuevaTarea] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const { data: trabajo, isLoading, error, refetch } = useQuery({
    queryKey: ["trabajo", trabajoId],
    queryFn: () => getTrabajo(trabajoId),
    enabled: !!trabajoId && !Number.isNaN(trabajoId),
  });

  const completeMutation = useMutation({
    mutationFn: (itemId: number) => completarTarea(itemId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["trabajo", trabajoId] }),
  });

  const addMutation = useMutation({
    mutationFn: () =>
      addTareaChecklist(trabajoId, { descripcion: nuevaTarea }),
    onSuccess: () => {
      setNuevaTarea("");
      setShowAdd(false);
      queryClient.invalidateQueries({ queryKey: ["trabajo", trabajoId] });
    },
  });

  if (Number.isNaN(trabajoId)) {
    return (
      <div
        className="min-h-full p-4"
        style={{ background: "var(--tg-theme-bg_color, #f3f4f6)" }}
      >
        <div
          className="rounded-lg border p-4 text-center"
          style={{
            background: "var(--tg-theme-secondary_bg_color, #ffffff)",
            borderColor: "var(--tg-theme-section_bg_color, #e5e7eb)",
          }}
        >
          <Wrench className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p
            className="text-sm font-medium"
            style={{ color: "var(--tg-theme-text_color, #111827)" }}
          >
            Free Works
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Abre esta mini-app desde un trabajo concreto (deep link con
            <code className="mx-1 px-1 rounded bg-gray-100">?trabajo_id=N</code>
            ).
          </p>
        </div>
      </div>
    );
  }
  if (isLoading) return <LoadingState rows={4} />;
  if (error)
    return (
      <ErrorState
        message="Error al cargar el trabajo"
        onRetry={() => refetch()}
      />
    );
  if (!trabajo)
    return <p className="p-4 text-sm text-gray-500">Trabajo no encontrado</p>;

  const checklist = trabajo.checklist ?? [];
  const completadas = checklist.filter((c) => c.completada).length;
  const total = checklist.length;
  const progreso = total > 0 ? Math.round((completadas / total) * 100) : 0;

  return (
    <div
      className="min-h-full"
      style={{ background: "var(--tg-theme-bg_color, #f3f4f6)" }}
    >
      {/* Cabecera sticky */}
      <header
        className="sticky top-0 z-10 px-4 py-3 border-b"
        style={{
          background: "var(--tg-theme-header_bg_color, var(--tg-theme-bg_color, #ffffff))",
          borderColor: "var(--tg-theme-section_bg_color, #e5e7eb)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Wrench className="h-4 w-4 shrink-0 text-blue-600" />
              {trabajo.codigo_trabajo && (
                <span className="text-xs font-mono text-gray-400">
                  {trabajo.codigo_trabajo}
                </span>
              )}
            </div>
            <h1
              className="text-lg font-bold leading-tight"
              style={{ color: "var(--tg-theme-text_color, #111827)" }}
            >
              {trabajo.titulo}
            </h1>
          </div>
          <StatusBadge estado={trabajo.estado} mapping={ESTADOS_TRABAJO} />
        </div>
      </header>

      {/* Contenido */}
      <div className="p-4 space-y-3 pb-24">
        {/* Cliente */}
        <Field icon={<Building2 className="h-4 w-4" />} label="Cliente">
          {trabajo.cliente_nombre ? (
            <Link
              to={`/clientes/${trabajo.cliente_id}`}
              className="text-blue-600 hover:underline"
            >
              {trabajo.cliente_nombre}
            </Link>
          ) : (
            <span className="text-gray-400">Sin cliente</span>
          )}
        </Field>

        {/* Prioridad */}
        <Field icon={<CheckSquare className="h-4 w-4" />} label="Prioridad">
          <PrioridadBadge prioridad={trabajo.prioridad} />
        </Field>

        {/* Fechas */}
        {(trabajo.fecha_inicio ||
          trabajo.fecha_fin_estimada ||
          trabajo.fecha_fin_real) && (
          <Field icon={<Calendar className="h-4 w-4" />} label="Fechas">
            <div className="space-y-0.5 text-xs">
              {trabajo.fecha_inicio && (
                <p>
                  <span className="text-gray-500">Inicio: </span>
                  {formatDate(trabajo.fecha_inicio)}
                </p>
              )}
              {trabajo.fecha_fin_estimada && (
                <p>
                  <span className="text-gray-500">Fin estimado: </span>
                  {formatDate(trabajo.fecha_fin_estimada)}
                </p>
              )}
              {trabajo.fecha_fin_real && (
                <p>
                  <span className="text-gray-500">Fin real: </span>
                  {formatDate(trabajo.fecha_fin_real)}
                </p>
              )}
            </div>
          </Field>
        )}

        {/* Dirección de obra */}
        {trabajo.obra_municipio && (
          <Field icon={<MapPin className="h-4 w-4" />} label="Dirección">
            <span className="text-sm">
              {[trabajo.obra_calle, trabajo.obra_numero]
                .filter(Boolean)
                .join(" ")}
              {trabajo.obra_piso_puerta && `, ${trabajo.obra_piso_puerta}`}
              <br />
              {trabajo.obra_municipio}
              {trabajo.obra_provincia && `, ${trabajo.obra_provincia}`}
            </span>
          </Field>
        )}

        {/* Descripción */}
        {trabajo.descripcion && (
          <Field icon={<Wrench className="h-4 w-4" />} label="Descripción">
            <p className="text-sm whitespace-pre-wrap">{trabajo.descripcion}</p>
          </Field>
        )}

        {/* Checklist */}
        <div
          className="rounded-lg border p-3 mt-4"
          style={{
            background: "var(--tg-theme-secondary_bg_color, #ffffff)",
            borderColor: "var(--tg-theme-section_bg_color, #e5e7eb)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Checklist
            </h2>
            {total > 0 && (
              <span className="text-xs text-gray-500">
                {completadas}/{total} · {progreso}%
              </span>
            )}
          </div>

          {total > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all"
                style={{ width: `${progreso}%` }}
              />
            </div>
          )}

          {checklist.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">
              No hay tareas todavía.
            </p>
          ) : (
            <ul className="space-y-2">
              {checklist.map((item) => (
                <li
                  key={item.id}
                  className={`flex items-start gap-2 p-2 rounded border ${
                    item.completada ? "bg-gray-50 border-gray-200" : "bg-white"
                  }`}
                >
                  <button
                    onClick={() => completeMutation.mutate(item.id)}
                    disabled={item.completada || completeMutation.isPending}
                    className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 ${
                      item.completada
                        ? "bg-green-500 border-green-500"
                        : "border-gray-300 hover:border-blue-500"
                    }`}
                    aria-label={
                      item.completada ? "Tarea completada" : "Completar tarea"
                    }
                  >
                    {item.completada && <Check className="h-3 w-3 text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${
                        item.completada ? "line-through text-gray-400" : ""
                      }`}
                    >
                      {item.descripcion}
                    </p>
                    {item.fecha_programada && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        📅 {formatDate(item.fecha_programada)}
                        {item.hora_programada && ` · ${item.hora_programada}`}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {showAdd ? (
            <div className="mt-3 border-t pt-3 space-y-2">
              <input
                value={nuevaTarea}
                onChange={(e) => setNuevaTarea(e.target.value)}
                placeholder="Nueva tarea…"
                autoFocus
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdd(false);
                    setNuevaTarea("");
                  }}
                  className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() =>
                    nuevaTarea.trim() && addMutation.mutate()
                  }
                  disabled={!nuevaTarea.trim() || addMutation.isPending}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {addMutation.isPending ? "Añadiendo…" : "Añadir"}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-4 w-4" />
              Añadir tarea
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Componentes auxiliares locales ──────────────────────────

interface FieldProps {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}

function Field({ icon, label, children }: FieldProps) {
  return (
    <div
      className="rounded-lg border p-3"
      style={{
        background: "var(--tg-theme-secondary_bg_color, #ffffff)",
        borderColor: "var(--tg-theme-section_bg_color, #e5e7eb)",
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-gray-400">{icon}</span>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div style={{ color: "var(--tg-theme-text_color, #111827)" }}>
        {children}
      </div>
    </div>
  );
}

function PrioridadBadge({ prioridad }: { prioridad: string }) {
  const map: Record<string, string> = {
    urgente: "bg-red-100 text-red-800",
    alta: "bg-red-100 text-red-800",
    media: "bg-yellow-100 text-yellow-800",
    baja: "bg-gray-100 text-gray-800",
  };
  const cls = map[prioridad] ?? "bg-gray-100 text-gray-800";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>
      {prioridad || "media"}
    </span>
  );
}
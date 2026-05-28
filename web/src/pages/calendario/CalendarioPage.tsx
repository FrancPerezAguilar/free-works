import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEventosRango, crearEvento, actualizarEvento, eliminarEvento } from "@/api/calendario";
import type { EventoCalendario, EventoCreate } from "@/types/calendario";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { cn, formatDate } from "@/lib/utils";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Tag,
  X,
  Trash2,
} from "lucide-react";

/* ─────────────── helpers ─────────────── */

const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const TIPO_COLORS: Record<string, string> = {
  trabajo: "#3B82F6",
  reunion: "#8B5CF6",
  tarea:    "#10B981",
};

const TIPO_LABELS: Record<string, string> = {
  trabajo: "Trabajo",
  reunion: "Reunión",
  tarea:    "Tarea",
};

const FILTROS_TIPO = [
  { value: "", label: "Todos" },
  { value: "trabajo", label: "Trabajo" },
  { value: "reunion", label: "Reunión" },
  { value: "tarea", label: "Tarea" },
];

function getColor(evento: EventoCalendario): string {
  if (evento.entidad_tipo && TIPO_COLORS[evento.entidad_tipo]) {
    return TIPO_COLORS[evento.entidad_tipo];
  }
  return evento.color || "#3B82F6";
}

interface DayCell {
  date: Date | null;
  day: number;
  isCurrentMonth: boolean;
  iso: string | null; // YYYY-MM-DD
}

function buildMonthGrid(year: number, month: number): DayCell[][] {
  const firstDay = new Date(year, month, 1);
  // getDay() → 0=Sun … 6=Sat. We want Mon=0 … Sun=6.
  const startDayOfWeek = (firstDay.getDay() + 6) % 7;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const totalCells = Math.ceil((startDayOfWeek + daysInMonth) / 7) * 7;
  const cells: DayCell[] = [];

  for (let i = 0; i < totalCells; i++) {
    if (i < startDayOfWeek) {
      // trailing day from previous month
      const d = daysInPrevMonth - startDayOfWeek + i + 1;
      const date = new Date(year, month - 1, d);
      cells.push({
        date,
        day: d,
        isCurrentMonth: false,
        iso: toISO(date),
      });
    } else if (i - startDayOfWeek < daysInMonth) {
      const d = i - startDayOfWeek + 1;
      const date = new Date(year, month, d);
      cells.push({
        date,
        day: d,
        isCurrentMonth: true,
        iso: toISO(date),
      });
    } else {
      // leading day from next month
      const d = i - startDayOfWeek - daysInMonth + 1;
      const date = new Date(year, month + 1, d);
      cells.push({
        date,
        day: d,
        isCurrentMonth: false,
        iso: toISO(date),
      });
    }
  }

  // chunk into rows of 7
  const rows: DayCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/* ─────────────── modal ─────────────── */

interface ModalProps {
  initialDate: string; // YYYY-MM-DD
  editing: EventoCalendario | null;
  onClose: () => void;
  onSaved: () => void;
}

function EventoFormModal({ initialDate, editing, onClose, onSaved }: ModalProps) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState<EventoCreate>(() => {
    if (editing) {
      return {
        titulo: editing.titulo,
        descripcion: editing.descripcion ?? "",
        fecha_evento: editing.fecha_evento,
        hora_evento: editing.hora_evento ?? "",
        hora_fin: editing.hora_fin ?? "",
        duracion_min: editing.duracion_min,
        entidad_tipo: editing.entidad_tipo ?? "",
        entidad_nombre: editing.entidad_nombre ?? "",
        cliente_nombre: editing.cliente_nombre ?? "",
        ubicacion: editing.ubicacion ?? "",
        estado: editing.estado,
        color: editing.color,
        notas: editing.notas ?? "",
      };
    }
    return {
      titulo: "",
      fecha_evento: initialDate,
      duracion_min: 60,
      color: "#3B82F6",
      estado: "pendiente",
    };
  });

  const [error, setError] = useState("");

  const createMut = useMutation({
    mutationFn: crearEvento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      onSaved();
    },
    onError: (e: Error) => setError(e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EventoCreate> }) =>
      actualizarEvento(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      onSaved();
    },
    onError: (e: Error) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.titulo.trim()) {
      setError("El título es obligatorio");
      return;
    }

    // Clean empty strings to undefined
    const payload: EventoCreate = {
      ...form,
      descripcion: form.descripcion?.trim() || undefined,
      hora_evento: form.hora_evento?.trim() || undefined,
      hora_fin: form.hora_fin?.trim() || undefined,
      entidad_tipo: form.entidad_tipo?.trim() || undefined,
      entidad_nombre: form.entidad_nombre?.trim() || undefined,
      cliente_nombre: form.cliente_nombre?.trim() || undefined,
      ubicacion: form.ubicacion?.trim() || undefined,
      notas: form.notas?.trim() || undefined,
    };

    if (editing) {
      updateMut.mutate({ id: editing.id, data: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const isLoading = createMut.isPending || updateMut.isPending;

  const updateField = (field: keyof EventoCreate, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">
            {editing ? "Editar evento" : "Nuevo evento"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 text-gray-500 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Título */}
          <div>
            <label className="block text-sm font-medium mb-1">Título *</label>
            <input
              type="text"
              value={form.titulo}
              onChange={(e) => updateField("titulo", e.target.value)}
              placeholder="Ej: Reunión con cliente"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Fecha + Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Fecha</label>
              <input
                type="date"
                value={form.fecha_evento}
                onChange={(e) => updateField("fecha_evento", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hora</label>
              <input
                type="time"
                value={form.hora_evento}
                onChange={(e) => updateField("hora_evento", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Hora fin</label>
              <input
                type="time"
                value={form.hora_fin}
                onChange={(e) => updateField("hora_fin", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Duración (min)</label>
              <input
                type="number"
                min={15}
                step={15}
                value={form.duracion_min}
                onChange={(e) => updateField("duracion_min", Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tipo + Estado */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <select
                value={form.entidad_tipo ?? ""}
                onChange={(e) => updateField("entidad_tipo", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sin tipo</option>
                <option value="trabajo">Trabajo</option>
                <option value="reunion">Reunión</option>
                <option value="tarea">Tarea</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <select
                value={form.estado ?? "pendiente"}
                onChange={(e) => updateField("estado", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pendiente">Pendiente</option>
                <option value="confirmado">Confirmado</option>
                <option value="completado">Completado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium mb-1">Cliente</label>
            <input
              type="text"
              value={form.cliente_nombre ?? ""}
              onChange={(e) => updateField("cliente_nombre", e.target.value)}
              placeholder="Nombre del cliente"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Ubicación */}
          <div>
            <label className="block text-sm font-medium mb-1">Ubicación</label>
            <input
              type="text"
              value={form.ubicacion ?? ""}
              onChange={(e) => updateField("ubicacion", e.target.value)}
              placeholder="Dirección o lugar"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium mb-1">Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.color ?? "#3B82F6"}
                onChange={(e) => updateField("color", e.target.value)}
                className="h-9 w-12 border rounded cursor-pointer"
              />
              <span className="text-xs text-gray-500">{form.color}</span>
            </div>
          </div>

          {/* Descripción / Notas */}
          <div>
            <label className="block text-sm font-medium mb-1">Notas</label>
            <textarea
              value={form.notas ?? ""}
              onChange={(e) => updateField("notas", e.target.value)}
              rows={3}
              placeholder="Notas adicionales..."
              className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? "Guardando..." : editing ? "Actualizar" : "Crear evento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────── page ─────────────── */

export default function CalendarioPage() {
  const queryClient = useQueryClient();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-based
  const [selectedDate, setSelectedDate] = useState<string | null>(toISO(today));
  const [filtroTipo, setFiltroTipo] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventoCalendario | null>(null);

  // date range for the month view (include surrounding days)
  const rangeFrom = toISO(new Date(viewYear, viewMonth, 1));
  const rangeTo = toISO(new Date(viewYear, viewMonth + 1, 0));

  const { data: eventos, isLoading, error, refetch } = useQuery({
    queryKey: ["eventos", rangeFrom, rangeTo],
    queryFn: () => getEventosRango(rangeFrom, rangeTo),
  });

  const deleteMut = useMutation({
    mutationFn: eliminarEvento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
    },
  });

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map: Record<string, EventoCalendario[]> = {};
    eventos?.forEach((ev) => {
      if (!map[ev.fecha_evento]) map[ev.fecha_evento] = [];
      map[ev.fecha_evento].push(ev);
    });
    return map;
  }, [eventos]);

  // Build calendar grid
  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  // Filter events for selected day
  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    const all = eventsByDate[selectedDate] ?? [];
    if (!filtroTipo) return all;
    return all.filter((ev) => ev.entidad_tipo === filtroTipo);
  }, [selectedDate, eventsByDate, filtroTipo]);

  const navigateMonth = (delta: number) => {
    let newMonth = viewMonth + delta;
    let newYear = viewYear;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setViewYear(newYear);
    setViewMonth(newMonth);
  };

  const goToToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedDate(toISO(now));
  };

  const openNew = () => {
    setEditingEvent(null);
    setShowModal(true);
  };

  const openEdit = (ev: EventoCalendario) => {
    setEditingEvent(ev);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Eliminar este evento?")) {
      deleteMut.mutate(id);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingEvent(null);
  };

  // Count events for a cell
  const getCellEvents = (iso: string | null): EventoCalendario[] => {
    if (!iso) return [];
    const all = eventsByDate[iso] ?? [];
    if (!filtroTipo) return all;
    return all.filter((ev) => ev.entidad_tipo === filtroTipo);
  };

  const selectedDateFormatted = selectedDate
    ? formatDate(selectedDate)
    : "";

  return (
    <div>
      <PageHeader
        title="Calendario"
        description={`${eventos?.length ?? 0} eventos este mes`}
        action={
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nuevo evento
          </button>
        }
      />

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold min-w-[180px] text-center">
            {MESES[viewMonth]} {viewYear}
          </h2>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            Hoy
          </button>

          {/* Tipo filter */}
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-3 py-1.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {FILTROS_TIPO.map((f) => (
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
        <ErrorState message="Error al cargar eventos" onRetry={() => refetch()} />
      ) : (
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Calendar grid */}
          <div className="flex-1">
            <Card className="rounded-xl shadow-sm overflow-hidden">
              <CardContent className="p-2 sm:p-4">
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-1">
                  {DIAS_SEMANA.map((d) => (
                    <div
                      key={d}
                      className="text-center text-xs font-semibold text-gray-500 py-2"
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {/* Grid rows */}
                <div className="space-y-0.5">
                  {grid.map((row, ri) => (
                    <div key={ri} className="grid grid-cols-7 gap-0.5">
                      {row.map((cell, ci) => {
                        const cellEvents = getCellEvents(cell.iso);
                        const isSel = cell.iso === selectedDate;
                        const todayFlag = cell.date ? isToday(cell.date) : false;

                        return (
                          <button
                            key={ci}
                            onClick={() => cell.iso && setSelectedDate(cell.iso)}
                            className={cn(
                              "min-h-[60px] sm:min-h-[80px] p-1.5 rounded-lg text-left transition-colors cursor-pointer",
                              "border border-transparent hover:border-blue-200 hover:bg-blue-50/30",
                              !cell.isCurrentMonth && "opacity-35",
                              isSel && "border-blue-400 bg-blue-50",
                              todayFlag && !isSel && "border-amber-300 bg-amber-50/50"
                            )}
                          >
                            <span
                              className={cn(
                                "inline-flex items-center justify-center w-6 h-6 text-xs rounded-full",
                                todayFlag && "bg-amber-400 text-white font-bold",
                                isSel && !todayFlag && "bg-blue-600 text-white font-bold",
                                !todayFlag && !isSel && cell.isCurrentMonth && "text-gray-800",
                                !cell.isCurrentMonth && "text-gray-400"
                              )}
                            >
                              {cell.day}
                            </span>

                            {/* Event dots */}
                            <div className="mt-1 space-y-0.5">
                              {cellEvents.slice(0, 3).map((ev) => (
                                <div
                                  key={ev.id}
                                  className="flex items-center gap-1"
                                  title={`${ev.titulo}${ev.hora_evento ? ` (${ev.hora_evento.slice(0, 5)})` : ""}`}
                                >
                                  <span
                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                    style={{ backgroundColor: getColor(ev) }}
                                  />
                                  <span className="text-[10px] sm:text-xs text-gray-700 truncate leading-tight">
                                    {ev.hora_evento
                                      ? `${ev.hora_evento.slice(0, 5)} ${ev.titulo}`
                                      : ev.titulo}
                                  </span>
                                </div>
                              ))}
                              {cellEvents.length > 3 && (
                                <span className="text-[10px] text-gray-400 pl-2">
                                  +{cellEvents.length - 3} más
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side panel: selected day events */}
          <div className="w-full lg:w-80 shrink-0">
            <Card className="rounded-xl shadow-sm h-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold text-sm">
                    {selectedDate ? selectedDateFormatted : "Selecciona un día"}
                  </h3>
                </div>
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto">
                {!selectedDate ? (
                  <p className="text-sm text-gray-400 text-center py-6">
                    Haz click en un día para ver sus eventos
                  </p>
                ) : selectedEvents.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-400 mb-3">
                      {filtroTipo
                        ? "No hay eventos de este tipo"
                        : "Sin eventos para este día"}
                    </p>
                    <button
                      onClick={openNew}
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Añadir evento
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3 rounded-lg border hover:border-blue-200 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: getColor(ev) }}
                            />
                            <h4 className="font-medium text-sm truncate">
                              {ev.titulo}
                            </h4>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={() => openEdit(ev)}
                              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600 cursor-pointer"
                              title="Editar"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(ev.id)}
                              className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 cursor-pointer"
                              title="Eliminar"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-2 space-y-1">
                          {ev.hora_evento && (
                            <p className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {ev.hora_evento.slice(0, 5)}
                              {ev.hora_fin && ` - ${ev.hora_fin.slice(0, 5)}`}
                              {!ev.hora_fin && ` (${ev.duracion_min} min)`}
                            </p>
                          )}
                          {ev.ubicacion && (
                            <p className="flex items-center gap-1.5 text-xs text-gray-500">
                              <MapPin className="h-3 w-3" />
                              {ev.ubicacion}
                            </p>
                          )}
                          {ev.entidad_tipo && (
                            <p className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Tag className="h-3 w-3" />
                              {TIPO_LABELS[ev.entidad_tipo] || ev.entidad_tipo}
                            </p>
                          )}
                          {ev.cliente_nombre && (
                            <p className="text-xs text-gray-500 ml-4.5">
                              {ev.cliente_nombre}
                            </p>
                          )}
                        </div>

                        {ev.notas && (
                          <p className="mt-2 text-xs text-gray-400 line-clamp-2">
                            {ev.notas}
                          </p>
                        )}

                        {/* Estado badge */}
                        <div className="mt-2">
                          <span
                            className={cn(
                              "inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                              ev.estado === "pendiente" && "bg-yellow-100 text-yellow-800",
                              ev.estado === "confirmado" && "bg-blue-100 text-blue-800",
                              ev.estado === "completado" && "bg-green-100 text-green-800",
                              ev.estado === "cancelado" && "bg-red-100 text-red-800"
                            )}
                          >
                            {ev.estado}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <EventoFormModal
          initialDate={selectedDate ?? toISO(new Date())}
          editing={editingEvent}
          onClose={handleModalClose}
          onSaved={handleModalClose}
        />
      )}
    </div>
  );
}

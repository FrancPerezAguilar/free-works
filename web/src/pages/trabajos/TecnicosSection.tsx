import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getTecnicos,
  getTecnicosTrabajo,
  asignarTecnico,
  desasignarTecnico,
  createTecnico,
  type Tecnico,
  type TecnicoAsignadoTrabajo,
} from "@/api/trabajos";
import { Plus, Trash2, User, Clock, ChevronDown, Loader2 } from "lucide-react";

interface Props {
  trabajoId: number;
}

export function TecnicosSection({ trabajoId }: Props) {
  const queryClient = useQueryClient();
  const [showNuevo, setShowNuevo] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoEspecialidad, setNuevoEspecialidad] = useState("");

  const { data: asignados = [], isLoading } = useQuery<TecnicoAsignadoTrabajo[]>({
    queryKey: ["tecnicos-trabajo", trabajoId],
    queryFn: () => getTecnicosTrabajo(trabajoId),
  });

  const { data: catalogo = [] } = useQuery<Tecnico[]>({
    queryKey: ["tecnicos", "catalogo"],
    queryFn: getTecnicos,
  });

  const asignadosIds = new Set(asignados.map((a) => a.tecnico_id));
  const disponibles = catalogo.filter((t) => !asignadosIds.has(t.id));

  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState<string>("");
  const [horas, setHoras] = useState("");

  const asignarMutation = useMutation({
    mutationFn: () =>
      asignarTecnico(trabajoId, {
        tecnico_id: Number(tecnicoSeleccionado),
        horas: parseFloat(horas) || 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tecnicos-trabajo", trabajoId] });
      setTecnicoSeleccionado("");
      setHoras("");
    },
  });

  const desasignarMutation = useMutation({
    mutationFn: (tecnicoId: number) => desasignarTecnico(trabajoId, tecnicoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tecnicos-trabajo", trabajoId] }),
  });

  const crearMutation = useMutation({
    mutationFn: () =>
      createTecnico({
        nombre: nuevoNombre.trim(),
        especialidad: nuevoEspecialidad.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tecnicos", "catalogo"] });
      setNuevoNombre("");
      setNuevoEspecialidad("");
      setShowNuevo(false);
    },
  });

  const handleAsignar = () => {
    if (!tecnicoSeleccionado) return;
    asignarMutation.mutate();
  };

  const totalHoras = asignados.reduce((sum, t) => sum + Number(t.horas || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">Técnicos asignados</h3>
        <span className="text-xs text-gray-400">{totalHoras.toFixed(1)}h totales</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando…
        </div>
      ) : asignados.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Sin técnicos asignados</p>
      ) : (
        <div className="space-y-2">
          {asignados.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">
                    {t.nombre}
                    {t.apellidos && ` ${t.apellidos}`}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {Number(t.horas || 0).toFixed(1)}h
                    </span>
                    {t.especialidad && (
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                        {t.especialidad}
                      </span>
                    )}
                    {t.rol && (
                      <span className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">
                        {t.rol}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => desasignarMutation.mutate(t.tecnico_id)}
                disabled={desasignarMutation.isPending}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50"
                title="Quitar técnico"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 items-end flex-wrap">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs text-gray-500 mb-1">Técnico</label>
          <div className="relative">
            <select
              value={tecnicoSeleccionado}
              onChange={(e) => setTecnicoSeleccionado(e.target.value)}
              className="w-full appearance-none px-3 py-2 pr-8 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
            >
              <option value="">Selecciona…</option>
              {disponibles.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                  {t.apellidos && ` ${t.apellidos}`}
                  {t.especialidad ? ` — ${t.especialidad}` : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div className="w-24">
          <label className="block text-xs text-gray-500 mb-1">Horas</label>
          <input
            type="number"
            value={horas}
            onChange={(e) => setHoras(e.target.value)}
            placeholder="0"
            min="0"
            step="0.5"
            className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handleAsignar}
          disabled={!tecnicoSeleccionado || asignarMutation.isPending}
          className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
        >
          <Plus className="h-4 w-4" /> Asignar
        </button>
        <button
          onClick={() => setShowNuevo((v) => !v)}
          className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer"
        >
          {showNuevo ? "Cancelar" : "Nuevo técnico"}
        </button>
      </div>

      {showNuevo && (
        <div className="border rounded-lg p-3 bg-gray-50 space-y-2">
          <p className="text-xs font-medium text-gray-600">Crear técnico nuevo</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              placeholder="Nombre"
              className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={nuevoEspecialidad}
              onChange={(e) => setNuevoEspecialidad(e.target.value)}
              placeholder="Especialidad (opcional)"
              className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => crearMutation.mutate()}
              disabled={!nuevoNombre.trim() || crearMutation.isPending}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {crearMutation.isPending ? "Creando…" : "Crear"}
            </button>
          </div>
        </div>
      )}

      {asignarMutation.isError && (
        <p className="text-xs text-red-600">Error al asignar el técnico.</p>
      )}
    </div>
  );
}

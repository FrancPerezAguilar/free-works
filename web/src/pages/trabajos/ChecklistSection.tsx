import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addTareaChecklist, completarTarea } from "@/api/trabajos";
import { Check, Plus, Calendar } from "lucide-react";

interface Props {
  trabajoId: number;
  items?: Array<{
    id: number;
    descripcion: string;
    completada: boolean;
    fecha_programada: string | null;
    hora_programada: string | null;
  }>;
}

export function ChecklistSection({ trabajoId, items = [] }: Props) {
  const queryClient = useQueryClient();
  const [descripcion, setDescripcion] = useState("");
  const [fechaProg, setFechaProg] = useState("");
  const [showForm, setShowForm] = useState(false);

  const addMutation = useMutation({
    mutationFn: () =>
      addTareaChecklist(trabajoId, {
        descripcion,
        ...(fechaProg ? { fecha_programada: fechaProg } : {}),
      }),
    onSuccess: () => {
      setDescripcion("");
      setFechaProg("");
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["trabajo", trabajoId] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (itemId: number) => completarTarea(itemId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["trabajo", trabajoId] }),
  });

  const completadas = items.filter((i) => i.completada).length;
  const total = items.length;
  const progreso = total > 0 ? Math.round((completadas / total) * 100) : 0;

  return (
    <div>
      {/* Progress bar */}
      {total > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-500 mb-1">
            <span>
              {completadas} de {total} tareas
            </span>
            <span>{progreso}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>
      )}

      {/* Task list */}
      {items.length === 0 && !showForm ? (
        <p className="text-gray-500 text-sm py-4">No hay tareas en el checklist</p>
      ) : (
        <div className="space-y-2 mb-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-3 rounded-md border ${
                item.completada ? "bg-gray-50 border-gray-200" : "bg-white"
              }`}
            >
              <button
                onClick={() => completeMutation.mutate(item.id)}
                disabled={item.completada || completeMutation.isPending}
                className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 cursor-pointer ${
                  item.completada
                    ? "bg-green-500 border-green-500"
                    : "border-gray-300 hover:border-blue-500"
                }`}
              >
                {item.completada && <Check className="h-3 w-3 text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm ${
                    item.completada ? "text-gray-400 line-through" : ""
                  }`}
                >
                  {item.descripcion}
                </p>
                {(item.fecha_programada || item.hora_programada) && (
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {item.fecha_programada && new Date(item.fecha_programada).toLocaleDateString("es-ES")}
                    {item.hora_programada && ` ${item.hora_programada}`}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add task form */}
      {showForm ? (
        <div className="border rounded-md p-3 bg-gray-50">
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Descripción</label>
              <input
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nueva tarea..."
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Fecha programada (opcional)
              </label>
              <input
                type="date"
                value={fechaProg}
                onChange={(e) => setFechaProg(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowForm(false); setDescripcion(""); setFechaProg(""); }}
                className="px-3 py-1.5 text-sm border rounded-md hover:bg-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => descripcion.trim() && addMutation.mutate()}
                disabled={!descripcion.trim() || addMutation.isPending}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
              >
                {addMutation.isPending ? "Añadiendo..." : "Añadir"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Añadir tarea
        </button>
      )}
    </div>
  );
}

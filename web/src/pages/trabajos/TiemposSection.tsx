import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { registrarTiempo } from "@/api/trabajos";
import { Plus, Clock } from "lucide-react";

interface Props {
  trabajoId: number;
  items?: Array<{
    id: number;
    fecha: string;
    horas: number;
    descripcion: string | null;
  }>;
}

export function TiemposSection({ trabajoId, items = [] }: Props) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [horas, setHoras] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);

  const mutation = useMutation({
    mutationFn: () =>
      registrarTiempo(trabajoId, {
        horas: Number(horas),
        descripcion,
        fecha,
      }),
    onSuccess: () => {
      setHoras("");
      setDescripcion("");
      setFecha(new Date().toISOString().split("T")[0]);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["trabajo", trabajoId] });
    },
  });

  const totalHoras = items.reduce((sum, i) => sum + i.horas, 0);

  return (
    <div>
      {/* Summary */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Clock className="h-4 w-4" />
        <span>
          Total: <strong>{totalHoras}h</strong> en {items.length} registros
        </span>
      </div>

      {/* Time entries */}
      {items.length === 0 && !showForm ? (
        <p className="text-gray-500 text-sm py-4">Sin registros de tiempo</p>
      ) : (
        <div className="space-y-2 mb-4">
          {[...items]
            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
            .map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between p-3 border rounded-md bg-white"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{item.horas}h</span>
                    {item.descripcion && (
                      <span className="text-gray-500"> — {item.descripcion}</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(item.fecha).toLocaleDateString("es-ES")}
                  </p>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Add form */}
      {showForm ? (
        <div className="border rounded-md p-3 bg-gray-50">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Horas</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={horas}
                onChange={(e) => setHoras(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="2.5"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-xs text-gray-500 mb-1">
              Descripción (opcional)
            </label>
            <input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="¿Qué se hizo?"
            />
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-sm border rounded-md hover:bg-white cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={() => horas && mutation.mutate()}
              disabled={!horas || Number(horas) <= 0 || mutation.isPending}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {mutation.isPending ? "Registrando..." : "Registrar"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Registrar horas
        </button>
      )}
    </div>
  );
}

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTrabajo } from "@/api/trabajos";
import type { TecnicoAsignado } from "@/types/trabajo";
import { Plus, Trash2, User, Clock } from "lucide-react";

interface Props {
  trabajoId: number;
  tecnicos?: TecnicoAsignado[];
}

export function TecnicosSection({ trabajoId, tecnicos = [] }: Props) {
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState("");
  const [horas, setHoras] = useState("");

  const mutation = useMutation({
    mutationFn: (data: { tecnicos_asignados: TecnicoAsignado[] }) =>
      updateTrabajo(trabajoId, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["trabajo", trabajoId] }),
  });

  const handleAdd = () => {
    if (!nombre.trim()) return;
    const nuevo: TecnicoAsignado = {
      nombre: nombre.trim(),
      horas: parseFloat(horas) || 0,
    };
    mutation.mutate({ tecnicos_asignados: [...tecnicos, nuevo] });
    setNombre("");
    setHoras("");
  };

  const handleRemove = (idx: number) => {
    const updated = tecnicos.filter((_, i) => i !== idx);
    mutation.mutate({ tecnicos_asignados: updated });
  };

  const totalHoras = tecnicos.reduce((sum, t) => sum + t.horas, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">Técnicos asignados</h3>
        <span className="text-xs text-gray-400">{totalHoras}h totales</span>
      </div>

      {/* Lista de técnicos */}
      {tecnicos.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Sin técnicos asignados</p>
      ) : (
        <div className="space-y-2">
          {tecnicos.map((t, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">{t.nombre}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {t.horas}h
                    {t.especialidad && (
                      <span className="ml-2 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                        {t.especialidad}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleRemove(idx)}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                title="Quitar técnico"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Añadir técnico */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del técnico"
            className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
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
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={!nombre.trim()}
          className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
        >
          <Plus className="h-4 w-4" /> Añadir
        </button>
      </div>
    </div>
  );
}

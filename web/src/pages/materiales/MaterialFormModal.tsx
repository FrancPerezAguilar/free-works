import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createMaterial } from "@/api/materiales";
import type { MaterialCreate } from "@/types/material";
import { X } from "lucide-react";

interface Props {
  onClose: () => void;
  initialData?: Partial<MaterialCreate>;
}

export function MaterialFormModal({ onClose, initialData }: Props) {
  const [form, setForm] = useState({
    nombre: initialData?.nombre ?? "",
    descripcion: initialData?.descripcion ?? "",
    categoria: initialData?.categoria ?? "",
    precio_unitario: initialData?.precio_unitario?.toString() ?? "0",
    unidad_medida: initialData?.unidad_medida ?? "ud",
    fabricante: initialData?.fabricante ?? "",
  });
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () => {
      const payload: MaterialCreate = {
        nombre: form.nombre,
      };
      if (form.descripcion) payload.descripcion = form.descripcion;
      if (form.categoria) payload.categoria = form.categoria;
      payload.precio_unitario = Number(form.precio_unitario) || 0;
      payload.unidad_medida = form.unidad_medida || "ud";
      if (form.fabricante) payload.fabricante = form.fabricante;
      return createMaterial(payload);
    },
    onSuccess: () => onClose(),
    onError: (e: Error) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setError("");
    mutation.mutate();
  };

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {initialData ? "Editar material" : "Nuevo material"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Nombre *
            </label>
            <input
              value={form.nombre}
              onChange={(e) => update("nombre", e.target.value)}
              className="w-full py-3 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Cable H07V-K 2.5mm²"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Descripción
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) => update("descripcion", e.target.value)}
              className="w-full py-3 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Descripción del material"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Categoría
              </label>
              <input
                value={form.categoria}
                onChange={(e) => update("categoria", e.target.value)}
                className="w-full py-3 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: cables"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Fabricante
              </label>
              <input
                value={form.fabricante}
                onChange={(e) => update("fabricante", e.target.value)}
                className="w-full py-3 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Prysmian"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Precio unitario
              </label>
              <input
                type="number"
                step="0.01"
                value={form.precio_unitario}
                onChange={(e) => update("precio_unitario", e.target.value)}
                className="w-full py-3 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Unidad de medida
              </label>
              <select
                value={form.unidad_medida}
                onChange={(e) => update("unidad_medida", e.target.value)}
                className="w-full py-3 px-3 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ud">ud</option>
                <option value="m">m</option>
                <option value="kg">kg</option>
                <option value="l">l</option>
                <option value="m²">m²</option>
                <option value="m³">m³</option>
                <option value="h">h</option>
                <option value="caja">caja</option>
                <option value="rollo">rollo</option>
                <option value="pack">pack</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {mutation.isPending ? "Creando..." : "Crear material"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

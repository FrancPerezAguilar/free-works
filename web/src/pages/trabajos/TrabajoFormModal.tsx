import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createTrabajo } from "@/api/trabajos";
import type { TrabajoCreate } from "@/types/trabajo";
import { getClientes } from "@/api/clientes";
import { X } from "lucide-react";

interface Props {
  onClose: () => void;
}

export function TrabajoFormModal({ onClose }: Props) {
  const { data: clientes } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => getClientes(),
  });

  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    cliente_id: "",
    cliente_nombre: "",
    prioridad: "media",
    obra_calle: "",
    obra_numero: "",
    obra_municipio: "",
    obra_provincia: "",
    fecha_inicio: "",
    fecha_fin_estimada: "",
  });
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () => {
      const payload: TrabajoCreate = {
        titulo: form.titulo,
      };
      if (form.descripcion) payload.descripcion = form.descripcion;
      if (form.prioridad !== "media") payload.prioridad = form.prioridad;
      if (form.cliente_id) payload.cliente_id = Number(form.cliente_id);
      if (form.obra_calle) payload.obra_calle = form.obra_calle;
      if (form.obra_numero) payload.obra_numero = form.obra_numero;
      if (form.obra_municipio) payload.obra_municipio = form.obra_municipio;
      if (form.obra_provincia) payload.obra_provincia = form.obra_provincia;
      if (form.fecha_inicio) payload.fecha_inicio = form.fecha_inicio;
      if (form.fecha_fin_estimada) payload.fecha_fin_estimada = form.fecha_fin_estimada;
      return createTrabajo(payload);
    },
    onSuccess: () => onClose(),
    onError: (e: Error) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim()) {
      setError("El título es obligatorio");
      return;
    }
    setError("");
    mutation.mutate();
  };

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleClienteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    update("cliente_id", selectedId);
    const cliente = clientes?.find((c) => String(c.id) === selectedId);
    update("cliente_nombre", cliente?.nombre || "");
  };

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
          <h2 className="text-lg font-semibold">Nuevo trabajo</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Título *</label>
            <input
              value={form.titulo}
              onChange={(e) => update("titulo", e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Título del trabajo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Cliente</label>
            <select
              value={form.cliente_id}
              onChange={handleClienteChange}
              className="w-full px-3 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sin cliente</option>
              {clientes?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => update("descripcion", e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Descripción del trabajo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Prioridad</label>
            <select
              value={form.prioridad}
              onChange={(e) => update("prioridad", e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>

          <fieldset className="border rounded-md p-3">
            <legend className="text-sm font-medium px-1">Dirección de obra</legend>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Calle</label>
                <input
                  value={form.obra_calle}
                  onChange={(e) => update("obra_calle", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Número</label>
                <input
                  value={form.obra_numero}
                  onChange={(e) => update("obra_numero", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Municipio</label>
                <input
                  value={form.obra_municipio}
                  onChange={(e) => update("obra_municipio", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Provincia</label>
                <input
                  value={form.obra_provincia}
                  onChange={(e) => update("obra_provincia", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fecha inicio</label>
              <input
                type="date"
                value={form.fecha_inicio}
                onChange={(e) => update("fecha_inicio", e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fin estimado</label>
              <input
                type="date"
                value={form.fecha_fin_estimada}
                onChange={(e) => update("fecha_fin_estimada", e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
              {mutation.isPending ? "Creando..." : "Crear trabajo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

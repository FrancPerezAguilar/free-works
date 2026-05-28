import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createOportunidad } from "@/api/oportunidades";
import { getClientes } from "@/api/clientes";
import type { OportunidadCreate } from "@/types/oportunidad";
import { X } from "lucide-react";

const ORIGENES = [
  { value: "", label: "Sin especificar" },
  { value: "llamada", label: "Llamada" },
  { value: "email", label: "Email" },
  { value: "visita", label: "Visita" },
  { value: "recomendacion", label: "Recomendación" },
  { value: "web", label: "Web" },
];

interface Props {
  onClose: () => void;
  initialData?: Partial<OportunidadCreate>;
}

export function OportunidadFormModal({ onClose, initialData }: Props) {
  const { data: clientes } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => getClientes(),
  });

  const [form, setForm] = useState({
    titulo: initialData?.titulo ?? "",
    descripcion: initialData?.descripcion ?? "",
    cliente_id: initialData?.cliente_id?.toString() ?? "",
    cliente_nombre: initialData?.cliente_nombre ?? "",
    origen: initialData?.origen ?? "",
    probabilidad_cierre: initialData?.probabilidad_cierre?.toString() ?? "50",
    presupuesto_estimado:
      initialData?.presupuesto_estimado?.toString() ?? "0",
    fecha_contacto: initialData?.fecha_contacto ?? "",
    fecha_cierre_estimada: initialData?.fecha_cierre_estimada ?? "",
    notas_seguimiento: initialData?.notas_seguimiento ?? "",
  });
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () => {
      const payload: OportunidadCreate = {
        titulo: form.titulo,
      };
      if (form.descripcion) payload.descripcion = form.descripcion;
      if (form.cliente_id) payload.cliente_id = Number(form.cliente_id);
      if (form.cliente_nombre) payload.cliente_nombre = form.cliente_nombre;
      if (form.origen) payload.origen = form.origen;
      payload.probabilidad_cierre = Number(form.probabilidad_cierre) || 50;
      payload.presupuesto_estimado =
        Number(form.presupuesto_estimado) || 0;
      if (form.fecha_contacto) payload.fecha_contacto = form.fecha_contacto;
      if (form.fecha_cierre_estimada)
        payload.fecha_cierre_estimada = form.fecha_cierre_estimada;
      if (form.notas_seguimiento)
        payload.notas_seguimiento = form.notas_seguimiento;
      return createOportunidad(payload);
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
          <h2 className="text-lg font-semibold">
            {initialData ? "Editar oportunidad" : "Nueva oportunidad"}
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
              Título *
            </label>
            <input
              value={form.titulo}
              onChange={(e) => update("titulo", e.target.value)}
              className="w-full py-3 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Instalación eléctrica local comercial"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Cliente</label>
            <select
              value={form.cliente_id}
              onChange={handleClienteChange}
              className="w-full py-3 px-3 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium mb-1">Origen</label>
            <select
              value={form.origen}
              onChange={(e) => update("origen", e.target.value)}
              className="w-full py-3 px-3 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ORIGENES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Descripción
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) => update("descripcion", e.target.value)}
              className="w-full py-3 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Descripción de la oportunidad"
            />
          </div>

          {/* Probabilidad + presupuesto */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Probabilidad cierre (%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={form.probabilidad_cierre}
                onChange={(e) =>
                  update("probabilidad_cierre", e.target.value)
                }
                className="w-full"
              />
              <div className="text-center text-sm font-medium mt-1">
                {form.probabilidad_cierre}%
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Presupuesto estimado
              </label>
              <input
                type="number"
                step="0.01"
                value={form.presupuesto_estimado}
                onChange={(e) =>
                  update("presupuesto_estimado", e.target.value)
                }
                className="w-full py-3 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Fecha contacto
              </label>
              <input
                type="date"
                value={form.fecha_contacto}
                onChange={(e) => update("fecha_contacto", e.target.value)}
                className="w-full py-3 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Fecha cierre estimada
              </label>
              <input
                type="date"
                value={form.fecha_cierre_estimada}
                onChange={(e) =>
                  update("fecha_cierre_estimada", e.target.value)
                }
                className="w-full py-3 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Notas de seguimiento
            </label>
            <textarea
              value={form.notas_seguimiento}
              onChange={(e) => update("notas_seguimiento", e.target.value)}
              className="w-full py-3 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Llamar en una semana, enviar catálogo..."
            />
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
              {mutation.isPending ? "Creando..." : "Crear oportunidad"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

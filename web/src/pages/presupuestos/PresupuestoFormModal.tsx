import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createPresupuesto } from "@/api/presupuestos";
import { getClientes } from "@/api/clientes";
import type { PresupuestoCreate } from "@/types/presupuesto";
import { X } from "lucide-react";

interface Props {
  onClose: () => void;
  initialData?: Partial<PresupuestoCreate>;
}

export function PresupuestoFormModal({ onClose, initialData }: Props) {
  const { data: clientes } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => getClientes(),
  });

  const [form, setForm] = useState({
    titulo: initialData?.titulo ?? "",
    descripcion: initialData?.descripcion ?? "",
    cliente_id: initialData?.cliente_id?.toString() ?? "",
    cliente_nombre: initialData?.cliente_nombre ?? "",
    base_imponible: initialData?.base_imponible?.toString() ?? "",
    iva: initialData?.iva?.toString() ?? "",
    tipo_iva: initialData?.tipo_iva?.toString() ?? "21",
    total: initialData?.total?.toString() ?? "",
    condiciones_pago: initialData?.condiciones_pago ?? "",
    validez_dias: initialData?.validez_dias?.toString() ?? "30",
    notas: initialData?.notas ?? "",
  });
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () => {
      const base = Number(form.base_imponible) || 0;
      const tipoIva = Number(form.tipo_iva) || 21;
      const ivaCalculado = Number(form.iva) || base * (tipoIva / 100);
      const totalCalculado = Number(form.total) || base + ivaCalculado;

      const payload: PresupuestoCreate = {
        titulo: form.titulo,
      };
      if (form.descripcion) payload.descripcion = form.descripcion;
      if (form.cliente_id) payload.cliente_id = Number(form.cliente_id);
      if (form.condiciones_pago) payload.condiciones_pago = form.condiciones_pago;
      if (form.notas) payload.notas = form.notas;
      payload.validez_dias = Number(form.validez_dias) || 30;
      payload.base_imponible = base;
      payload.tipo_iva = tipoIva;
      payload.iva = ivaCalculado;
      payload.total = totalCalculado;
      return createPresupuesto(payload);
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
            {initialData ? "Editar presupuesto" : "Nuevo presupuesto"}
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
            <label className="block text-sm font-medium mb-1">Título *</label>
            <input
              value={form.titulo}
              onChange={(e) => update("titulo", e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Reforma eléctrica cocina"
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
              placeholder="Descripción del presupuesto"
            />
          </div>

          {/* Importes */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Base imponible
              </label>
              <input
                type="number"
                step="0.01"
                value={form.base_imponible}
                onChange={(e) => update("base_imponible", e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="705.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">IVA %</label>
              <input
                type="number"
                step="0.01"
                value={form.tipo_iva}
                onChange={(e) => update("tipo_iva", e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Total</label>
              <input
                type="number"
                step="0.01"
                value={form.total}
                onChange={(e) => update("total", e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="853.05"
              />
            </div>
          </div>

          {/* Condiciones */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Validez (días)
              </label>
              <input
                type="number"
                value={form.validez_dias}
                onChange={(e) => update("validez_dias", e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Condiciones de pago
              </label>
              <input
                value={form.condiciones_pago}
                onChange={(e) => update("condiciones_pago", e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Transferencia 30 días"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Notas adicionales
            </label>
            <textarea
              value={form.notas}
              onChange={(e) => update("notas", e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Material y mano de obra incluidos"
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
              {mutation.isPending ? "Creando..." : "Crear presupuesto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

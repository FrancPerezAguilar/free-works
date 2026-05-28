import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createCliente } from "@/api/clientes";
import { X } from "lucide-react";

interface Props {
  onClose: () => void;
}

export function ClienteFormModal({ onClose }: Props) {
  const [form, setForm] = useState({
    nombre: "",
    nif_cif: "",
    telefono_principal: "",
    email: "",
    direccion_calle: "",
    direccion_numero: "",
    direccion_municipio: "",
    direccion_provincia: "",
    direccion_codigo_postal: "",
  });
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () => createCliente(form),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Nuevo cliente</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Nombre *</label>
            <input
              value={form.nombre}
              onChange={(e) => update("nombre", e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre completo"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">NIF/CIF</label>
              <input
                value={form.nif_cif}
                onChange={(e) => update("nif_cif", e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="12345678A"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <input
                value={form.telefono_principal}
                onChange={(e) => update("telefono_principal", e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+34 612 345 678"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="cliente@email.com"
              type="email"
            />
          </div>

          <fieldset className="border rounded-md p-3">
            <legend className="text-sm font-medium px-1">Dirección</legend>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Calle</label>
                <input
                  value={form.direccion_calle}
                  onChange={(e) => update("direccion_calle", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Número</label>
                <input
                  value={form.direccion_numero}
                  onChange={(e) => update("direccion_numero", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Municipio</label>
                <input
                  value={form.direccion_municipio}
                  onChange={(e) => update("direccion_municipio", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Provincia</label>
                <input
                  value={form.direccion_provincia}
                  onChange={(e) => update("direccion_provincia", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">CP</label>
                <input
                  value={form.direccion_codigo_postal}
                  onChange={(e) => update("direccion_codigo_postal", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </fieldset>

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
              {mutation.isPending ? "Creando..." : "Crear cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

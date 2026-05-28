import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFactura } from "@/api/facturas";
import { getClientes } from "@/api/clientes";
import type { FacturaCreate } from "@/types/factura";
import { X } from "lucide-react";

interface Props {
  onClose: () => void;
  initialData?: Partial<FacturaCreate>;
}

export function FacturaFormModal({ onClose, initialData }: Props) {
  const { data: clientes } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => getClientes(),
  });

  const [form, setForm] = useState({
    tipo: initialData?.tipo ?? "factura",
    cliente_id: initialData?.cliente_id?.toString() ?? "",
    cliente_nombre: initialData?.cliente_nombre ?? "",
    nif_cif_cliente: initialData?.nif_cif_cliente ?? "",
    trabajo_id: initialData?.trabajo_id?.toString() ?? "",
    presupuesto_id: initialData?.presupuesto_id?.toString() ?? "",
    fecha_emision: initialData?.fecha_emision ?? new Date().toISOString().split("T")[0],
    fecha_vencimiento: initialData?.fecha_vencimiento ?? "",
    base_imponible: initialData?.base_imponible?.toString() ?? "",
    iva: initialData?.iva?.toString() ?? "",
    tipo_iva: initialData?.tipo_iva?.toString() ?? "21",
    total: initialData?.total?.toString() ?? "",
    estado_pago: initialData?.estado_pago ?? "pendiente",
    forma_pago: initialData?.forma_pago ?? "",
    datos_bancarios_iban: initialData?.datos_bancarios_iban ?? "",
    datos_bancarios_titular: initialData?.datos_bancarios_titular ?? "",
    regimen_iva: initialData?.regimen_iva ?? "",
    factura_direccion_calle: initialData?.factura_direccion_calle ?? "",
    factura_direccion_numero: initialData?.factura_direccion_numero ?? "",
    factura_direccion_codigo_postal:
      initialData?.factura_direccion_codigo_postal ?? "",
    factura_direccion_municipio:
      initialData?.factura_direccion_municipio ?? "",
    factura_direccion_provincia:
      initialData?.factura_direccion_provincia ?? "",
  });
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () => {
      const base = Number(form.base_imponible) || 0;
      const tipoIva = Number(form.tipo_iva) || 21;
      const ivaCalculado = Number(form.iva) || base * (tipoIva / 100);
      const totalCalculado = Number(form.total) || base + ivaCalculado;

      const payload: FacturaCreate = {};
      if (form.tipo) payload.tipo = form.tipo;
      if (form.cliente_id) payload.cliente_id = Number(form.cliente_id);
      if (form.cliente_nombre) payload.cliente_nombre = form.cliente_nombre;
      if (form.nif_cif_cliente) payload.nif_cif_cliente = form.nif_cif_cliente;
      if (form.trabajo_id) payload.trabajo_id = Number(form.trabajo_id);
      if (form.presupuesto_id)
        payload.presupuesto_id = Number(form.presupuesto_id);
      if (form.fecha_emision) payload.fecha_emision = form.fecha_emision;
      if (form.fecha_vencimiento) payload.fecha_vencimiento = form.fecha_vencimiento;
      if (form.forma_pago) payload.forma_pago = form.forma_pago;
      if (form.datos_bancarios_iban)
        payload.datos_bancarios_iban = form.datos_bancarios_iban;
      if (form.datos_bancarios_titular)
        payload.datos_bancarios_titular = form.datos_bancarios_titular;
      if (form.regimen_iva) payload.regimen_iva = form.regimen_iva;
      if (form.factura_direccion_calle)
        payload.factura_direccion_calle = form.factura_direccion_calle;
      if (form.factura_direccion_numero)
        payload.factura_direccion_numero = form.factura_direccion_numero;
      if (form.factura_direccion_codigo_postal)
        payload.factura_direccion_codigo_postal =
          form.factura_direccion_codigo_postal;
      if (form.factura_direccion_municipio)
        payload.factura_direccion_municipio =
          form.factura_direccion_municipio;
      if (form.factura_direccion_provincia)
        payload.factura_direccion_provincia =
          form.factura_direccion_provincia;

      payload.base_imponible = base;
      payload.tipo_iva = tipoIva;
      payload.iva = ivaCalculado;
      payload.total = totalCalculado;
      payload.estado_pago = form.estado_pago;

      return createFactura(payload);
    },
    onSuccess: () => onClose(),
    onError: (e: Error) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cliente_nombre.trim()) {
      setError("El cliente es obligatorio");
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
        className="bg-white rounded-lg w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {initialData ? "Editar factura" : "Nueva factura"}
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

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium mb-1">Tipo</label>
            <select
              value={form.tipo}
              onChange={(e) => update("tipo", e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="factura">Factura</option>
              <option value="factura_simplificada">
                Factura simplificada
              </option>
              <option value="factura_rectificativa">
                Factura rectificativa
              </option>
            </select>
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Cliente *
            </label>
            <select
              value={form.cliente_id}
              onChange={handleClienteChange}
              className="w-full px-3 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar cliente</option>
              {clientes?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            {/* Cliente manual si no se selecciona de la lista */}
            {!form.cliente_id && (
              <input
                value={form.cliente_nombre}
                onChange={(e) => update("cliente_nombre", e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                placeholder="O escribe el nombre del cliente"
              />
            )}
          </div>

          {/* NIF/CIF */}
          <div>
            <label className="block text-sm font-medium mb-1">
              NIF/CIF
            </label>
            <input
              value={form.nif_cif_cliente}
              onChange={(e) => update("nif_cif_cliente", e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="12345678A"
            />
          </div>

          {/* Vinculados */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Trabajo #
              </label>
              <input
                type="number"
                value={form.trabajo_id}
                onChange={(e) => update("trabajo_id", e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Opcional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Presupuesto #
              </label>
              <input
                type="number"
                value={form.presupuesto_id}
                onChange={(e) => update("presupuesto_id", e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Opcional"
              />
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Fecha emisión
              </label>
              <input
                type="date"
                value={form.fecha_emision}
                onChange={(e) => update("fecha_emision", e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Vencimiento
              </label>
              <input
                type="date"
                value={form.fecha_vencimiento}
                onChange={(e) => update("fecha_vencimiento", e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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

          {/* Forma de pago y estado */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Forma de pago
              </label>
              <select
                value={form.forma_pago}
                onChange={(e) => update("forma_pago", e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar</option>
                <option value="transferencia">Transferencia</option>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="domiciliacion">Domiciliación</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Estado de pago
              </label>
              <select
                value={form.estado_pago}
                onChange={(e) => update("estado_pago", e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pendiente">Pendiente</option>
                <option value="pagada">Pagada</option>
                <option value="vencida">Vencida</option>
                <option value="cobrada">Cobrada</option>
              </select>
            </div>
          </div>

          {/* Datos bancarios */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-2">Datos bancarios</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">IBAN</label>
                <input
                  value={form.datos_bancarios_iban}
                  onChange={(e) =>
                    update("datos_bancarios_iban", e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ES00 0000 0000 0000 0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Titular
                </label>
                <input
                  value={form.datos_bancarios_titular}
                  onChange={(e) =>
                    update("datos_bancarios_titular", e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre del titular"
                />
              </div>
            </div>
          </div>

          {/* Dirección factura */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-2">
              Dirección de facturación
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Calle</label>
                <input
                  value={form.factura_direccion_calle}
                  onChange={(e) =>
                    update("factura_direccion_calle", e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Calle Mayor"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nº</label>
                <input
                  value={form.factura_direccion_numero}
                  onChange={(e) =>
                    update("factura_direccion_numero", e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="12"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-3">
              <div>
                <label className="block text-sm font-medium mb-1">C.P.</label>
                <input
                  value={form.factura_direccion_codigo_postal}
                  onChange={(e) =>
                    update("factura_direccion_codigo_postal", e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="28001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Municipio
                </label>
                <input
                  value={form.factura_direccion_municipio}
                  onChange={(e) =>
                    update("factura_direccion_municipio", e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Madrid"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Provincia
                </label>
                <input
                  value={form.factura_direccion_provincia}
                  onChange={(e) =>
                    update("factura_direccion_provincia", e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Madrid"
                />
              </div>
            </div>
          </div>

          {/* Régimen IVA */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Régimen IVA
            </label>
            <input
              value={form.regimen_iva}
              onChange={(e) => update("regimen_iva", e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="General"
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
              {mutation.isPending ? "Creando..." : "Crear factura"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

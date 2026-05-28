import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addLinea } from "@/api/presupuestos";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import type { LineaPresupuesto } from "@/types/presupuesto";

interface Props {
  presupuestoId: number;
  lineas: LineaPresupuesto[];
}

export function LineasSection({ presupuestoId, lineas }: Props) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [descripcion, setDescripcion] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [unidad, setUnidad] = useState("ud");
  const [precioUnitario, setPrecioUnitario] = useState("");

  const importeCalculado =
    (Number(cantidad) || 0) * (Number(precioUnitario) || 0);

  const mutation = useMutation({
    mutationFn: () =>
      addLinea(presupuestoId, {
        descripcion,
        cantidad: Number(cantidad) || 1,
        unidad,
        precio_unitario: Number(precioUnitario) || 0,
        importe: importeCalculado,
      }),
    onSuccess: () => {
      setDescripcion("");
      setCantidad("1");
      setPrecioUnitario("");
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["presupuesto", presupuestoId] });
    },
  });

  const total = lineas.reduce((sum, l) => sum + (l.importe || 0), 0);

  return (
    <div>
      {lineas.length === 0 && !showForm ? (
        <p className="text-gray-500 text-sm py-4">Sin partidas desglosadas</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-lg border overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-medium">Descripción</th>
                  <th className="text-right p-3 font-medium">Cant.</th>
                  <th className="text-left p-3 font-medium">Ud.</th>
                  <th className="text-right p-3 font-medium">Precio ud.</th>
                  <th className="text-right p-3 font-medium">Importe</th>
                </tr>
              </thead>
              <tbody>
                {lineas.map((l) => (
                  <tr key={l.id} className="border-b last:border-0">
                    <td className="p-3">{l.descripcion}</td>
                    <td className="p-3 text-right">{l.cantidad}</td>
                    <td className="p-3 text-gray-500">{l.unidad}</td>
                    <td className="p-3 text-right">
                      {formatCurrency(l.precio_unitario)}
                    </td>
                    <td className="p-3 text-right font-medium">
                      {formatCurrency(l.importe)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t bg-gray-50 font-medium">
                  <td colSpan={4} className="p-3 text-right">
                    Total líneas
                  </td>
                  <td className="p-3 text-right">
                    {formatCurrency(total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2 mb-4">
            {lineas.map((l) => (
              <div
                key={l.id}
                className="border rounded-md p-3 bg-white"
              >
                <p className="text-sm font-medium">{l.descripcion}</p>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>
                    {l.cantidad} {l.unidad} × {formatCurrency(l.precio_unitario)}
                  </span>
                  <span className="font-medium text-gray-700">
                    {formatCurrency(l.importe)}
                  </span>
                </div>
              </div>
            ))}
            <div className="border rounded-md p-3 bg-gray-50 font-medium text-sm flex justify-between">
              <span>Total líneas</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </>
      )}

      {/* Add line form */}
      {showForm ? (
        <div className="border rounded-md p-3 bg-gray-50">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Descripción
            </label>
            <input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Punto de luz sencillo"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-4 gap-3 mt-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Cantidad
              </label>
              <input
                type="number"
                step="0.01"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ud.</label>
              <input
                value={unidad}
                onChange={(e) => setUnidad(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Precio ud.
              </label>
              <input
                type="number"
                step="0.01"
                value={precioUnitario}
                onChange={(e) => setPrecioUnitario(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Importe
              </label>
              <p className="text-sm font-medium pt-2">
                {formatCurrency(importeCalculado)}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-sm border rounded-md hover:bg-white cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={() => descripcion.trim() && mutation.mutate()}
              disabled={
                !descripcion.trim() || !precioUnitario || mutation.isPending
              }
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {mutation.isPending ? "Añadiendo..." : "Añadir línea"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Añadir partida
        </button>
      )}
    </div>
  );
}

import { formatCurrency } from "@/lib/utils";

interface Props {
  items?: Array<{
    id?: number;
    material_nombre?: string;
    cantidad: number;
    unidad?: string;
    precio_unitario?: number;
    subtotal?: number;
    notas?: string | null;
  }>;
}

export function MaterialesSection({ items = [] }: Props) {
  const totalCoste = items.reduce(
    (sum, m) => sum + (m.subtotal ?? (m.cantidad * (m.precio_unitario ?? 0))),
    0,
  );

  if (items.length === 0) {
    return <p className="text-gray-500 text-sm py-4">Sin materiales registrados</p>;
  }

  return (
    <div>
      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-3 font-medium">Material</th>
              <th className="text-left p-3 font-medium">Cantidad</th>
              <th className="text-left p-3 font-medium">Ud.</th>
              <th className="text-right p-3 font-medium">Precio ud.</th>
              <th className="text-right p-3 font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m, i) => {
              const subtotal = m.subtotal ?? (m.cantidad * (m.precio_unitario ?? 0));
              return (
                <tr key={m.id ?? i} className="border-b last:border-0">
                  <td className="p-3 font-medium">
                    {m.material_nombre || "Material"}
                    {m.notas && (
                      <p className="text-xs text-gray-400 mt-0.5">{m.notas}</p>
                    )}
                  </td>
                  <td className="p-3">{m.cantidad}</td>
                  <td className="p-3 text-gray-500">{m.unidad || "ud"}</td>
                  <td className="p-3 text-right">
                    {m.precio_unitario ? formatCurrency(m.precio_unitario) : "—"}
                  </td>
                  <td className="p-3 text-right font-medium">
                    {formatCurrency(subtotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t bg-gray-50 font-medium">
              <td colSpan={4} className="p-3 text-right">
                Total materiales
              </td>
              <td className="p-3 text-right">{formatCurrency(totalCoste)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {items.map((m, i) => {
          const subtotal = m.subtotal ?? (m.cantidad * (m.precio_unitario ?? 0));
          return (
            <div key={m.id ?? i} className="border rounded-md p-3 bg-white">
              <div className="flex justify-between">
                <span className="font-medium text-sm">
                  {m.material_nombre || "Material"}
                </span>
                <span className="text-sm font-medium">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex gap-3 text-xs text-gray-500 mt-1">
                <span>
                  {m.cantidad} {m.unidad || "ud"}
                </span>
                {m.precio_unitario && (
                  <span>{formatCurrency(m.precio_unitario)} / ud</span>
                )}
              </div>
              {m.notas && <p className="text-xs text-gray-400 mt-1">{m.notas}</p>}
            </div>
          );
        })}
        <div className="border rounded-md p-3 bg-gray-50 font-medium text-sm flex justify-between">
          <span>Total materiales</span>
          <span>{formatCurrency(totalCoste)}</span>
        </div>
      </div>
    </div>
  );
}

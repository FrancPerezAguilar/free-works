import { api } from "./client";
import type { Factura, FacturaCreate, LineaFactura } from "../types/factura";

// ── Facturas ──

export function getFacturas(params?: {
  estado_pago?: string;
  activo?: boolean;
}): Promise<Factura[]> {
  const qs = new URLSearchParams();
  if (params?.estado_pago) qs.set("estado_pago", params.estado_pago);
  if (params?.activo !== undefined) qs.set("activo", String(params.activo));
  return api.get(`facturas${qs.toString() ? `?${qs}` : ""}`);
}

export function getFactura(id: number): Promise<Factura> {
  return api.get(`facturas/${id}`);
}

export function createFactura(data: FacturaCreate): Promise<{
  id: number;
}> {
  return api.post("facturas", data);
}

export function updateFactura(
  id: number,
  data: Partial<FacturaCreate> & { estado_pago?: string },
): Promise<{ mensaje: string }> {
  return api.patch(`facturas/${id}`, data);
}

// ── Líneas ──

export function getLineas(facturaId: number): Promise<LineaFactura[]> {
  return api.get(`facturas/${facturaId}/lineas`);
}

export function addLinea(
  facturaId: number,
  data: {
    descripcion: string;
    cantidad?: number;
    unidad?: string;
    precio_unitario?: number;
    importe?: number;
  },
): Promise<{ mensaje: string }> {
  return api.post(`facturas/${facturaId}/lineas`, data);
}

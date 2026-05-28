import { api } from "./client";
import type { Presupuesto, PresupuestoCreate, LineaPresupuesto } from "../types/presupuesto";

// ── Presupuestos ──

export function getPresupuestos(params?: {
  estado?: string;
  activo?: boolean;
}): Promise<Presupuesto[]> {
  const qs = new URLSearchParams();
  if (params?.estado) qs.set("estado", params.estado);
  if (params?.activo !== undefined) qs.set("activo", String(params.activo));
  return api.get(`presupuestos${qs.toString() ? `?${qs}` : ""}`);
}

export function getPresupuesto(id: number): Promise<Presupuesto> {
  return api.get(`presupuestos/${id}`);
}

export function createPresupuesto(data: PresupuestoCreate): Promise<{
  id: number;
}> {
  return api.post("presupuestos", data);
}

export function updatePresupuesto(
  id: number,
  data: Partial<PresupuestoCreate> & { estado?: string },
): Promise<{ mensaje: string }> {
  return api.patch(`presupuestos/${id}`, data);
}

export function deletePresupuesto(id: number): Promise<{ mensaje: string }> {
  return api.delete(`presupuestos/${id}`);
}

// ── Líneas ──

export function getLineas(presupuestoId: number): Promise<LineaPresupuesto[]> {
  return api.get(`presupuestos/${presupuestoId}/lineas`);
}

export function addLinea(
  presupuestoId: number,
  data: {
    descripcion: string;
    cantidad?: number;
    unidad?: string;
    precio_unitario?: number;
    importe?: number;
  },
): Promise<{ mensaje: string }> {
  return api.post(`presupuestos/${presupuestoId}/lineas`, data);
}

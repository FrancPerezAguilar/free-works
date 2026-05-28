import { api } from "./client";
import type { Trabajo, TrabajoCreate, ChecklistItem, RegistroTiempo, Comentario } from "../types/trabajo";

export function getTrabajos(params?: { estado?: string; activo?: boolean }): Promise<Trabajo[]> {
  const qs = new URLSearchParams();
  if (params?.estado) qs.set("estado", params.estado);
  if (params?.activo !== undefined) qs.set("activo", String(params.activo));
  return api.get(`trabajos${qs.toString() ? `?${qs}` : ""}`);
}

export function getTrabajo(id: number): Promise<Trabajo> {
  return api.get(`trabajos/${id}`);
}

export function createTrabajo(data: TrabajoCreate): Promise<{ id: number }> {
  return api.post("trabajos", data);
}

export function updateTrabajo(id: number, data: Partial<TrabajoCreate> & { estado?: string }): Promise<{ mensaje: string }> {
  return api.patch(`trabajos/${id}`, data);
}

export function getChecklist(trabajoId: number): Promise<ChecklistItem[]> {
  return api.get(`trabajos/${trabajoId}/checklist`);
}

export function addTareaChecklist(trabajoId: number, data: { descripcion: string; fecha_programada?: string }): Promise<{ mensaje: string }> {
  return api.post(`trabajos/${trabajoId}/checklist`, data);
}

export function completarTarea(itemId: number): Promise<{ mensaje: string }> {
  return api.patch(`checklist/${itemId}`);
}

export function registrarTiempo(trabajoId: number, data: { horas: number; descripcion?: string; fecha?: string }): Promise<{ mensaje: string }> {
  return api.post(`trabajos/${trabajoId}/tiempos`, data);
}

export function getComentarios(trabajoId: number): Promise<Comentario[]> {
  return api.get(`trabajos/${trabajoId}/comentarios`);
}

export function addComentario(trabajoId: number, data: { contenido: string; autor?: string }): Promise<{ mensaje: string }> {
  return api.post(`trabajos/${trabajoId}/comentarios`, data);
}

export function getTareasPorFecha(fecha: string): Promise<ChecklistItem[]> {
  return api.get(`tareas/fecha/${fecha}`);
}

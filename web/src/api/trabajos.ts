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

// ── Técnicos ──────────────────────────────────────

export interface Tecnico {
  id: number;
  nombre: string;
  apellidos?: string;
  especialidad?: string;
  telefono?: string;
  email?: string;
  activo?: boolean;
}

export interface TecnicoAsignadoTrabajo {
  id: number;
  trabajo_id: number;
  tecnico_id: number;
  horas: number;
  rol?: string;
  nombre: string;
  apellidos?: string;
  especialidad?: string;
}

export function getTecnicos(): Promise<Tecnico[]> {
  return api.get("tecnicos");
}

export function createTecnico(data: Omit<Tecnico, "id" | "activo">): Promise<{ id: number; codigo_tecnico: string }> {
  return api.post("tecnicos", data);
}

export function getTecnicosTrabajo(trabajoId: number): Promise<TecnicoAsignadoTrabajo[]> {
  return api.get(`trabajos/${trabajoId}/tecnicos`);
}

export function asignarTecnico(
  trabajoId: number,
  data: { tecnico_id: number; horas?: number; rol?: string },
): Promise<{ id: number; mensaje: string }> {
  return api.post(`trabajos/${trabajoId}/tecnicos`, data);
}

export function desasignarTecnico(trabajoId: number, tecnicoId: number): Promise<{ mensaje: string }> {
  return api.delete(`trabajos/${trabajoId}/tecnicos/${tecnicoId}`);
}

// ── Adjuntos ──────────────────────────────────────

export function getAdjuntos(trabajoId: number): Promise<import("../types/trabajo").Adjunto[]> {
  return api.get(`trabajos/${trabajoId}/adjuntos`);
}

export function uploadAdjunto(
  trabajoId: number,
  file: File,
  descripcion?: string,
): Promise<{ id: number; tipo: string; nombre: string; url: string; mensaje: string }> {
  const formData = new FormData();
  formData.append("archivo", file);
  if (descripcion) formData.append("descripcion", descripcion);
  return api.post(`trabajos/${trabajoId}/adjuntos`, formData);
}

export function deleteAdjunto(adjuntoId: number): Promise<{ mensaje: string }> {
  return api.delete(`adjuntos/${adjuntoId}`);
}

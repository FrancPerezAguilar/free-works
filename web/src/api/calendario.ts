import { api } from "./client";
import type { EventoCalendario, EventoCreate } from "../types/calendario";

export function getEventos(params?: {
  fecha?: string;
  entidad_tipo?: string;
  estado?: string;
}): Promise<EventoCalendario[]> {
  const qs = new URLSearchParams();
  if (params?.fecha) qs.set("fecha", params.fecha);
  if (params?.entidad_tipo) qs.set("entidad_tipo", params.entidad_tipo);
  if (params?.estado) qs.set("estado", params.estado);
  return api.get(`eventos${qs.toString() ? `?${qs}` : ""}`);
}

export function getEventosRango(
  desde: string,
  hasta: string
): Promise<EventoCalendario[]> {
  return api.get(`eventos/rango?desde=${desde}&hasta=${hasta}`);
}

export function crearEvento(
  data: EventoCreate
): Promise<{ id: number }> {
  return api.post("eventos", data);
}

export function actualizarEvento(
  id: number,
  data: Partial<EventoCreate>
): Promise<{ mensaje: string }> {
  return api.patch(`eventos/${id}`, data);
}

export function eliminarEvento(id: number): Promise<{ mensaje: string }> {
  return api.delete(`eventos/${id}`);
}

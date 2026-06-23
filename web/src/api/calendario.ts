/**
 * Calendario → Appwrite collection `calendario`.
 *
 * Mantiene las mismas firmas que la versión anterior.
 *
 * Notas:
 * - `getEventos` con filtros varios se simula componiendo Query.equal.
 * - `getEventosRango` usa Query.between sobre el campo `fecha_evento`.
 */

import {
  listDocs,
  createDocReturnId,
  updateDocReturnOk,
  deleteDocReturnOk,
} from "../lib/appwriteDb";
import { COLLECTIONS } from "../config";
import type { EventoCalendario, EventoCreate } from "../types/calendario";

const COLL = COLLECTIONS.calendario;

export async function getEventos(params?: {
  fecha?: string;
  entidad_tipo?: string;
  estado?: string;
}): Promise<EventoCalendario[]> {
  const queries: Parameters<typeof listDocs>[1] = [];
  if (params?.fecha) queries.push({ type: "equal", attr: "fecha_evento", value: params.fecha });
  if (params?.entidad_tipo) queries.push({ type: "equal", attr: "entidad_tipo", value: params.entidad_tipo });
  if (params?.estado) queries.push({ type: "equal", attr: "estado", value: params.estado });
  const docs = await listDocs<EventoCalendario>(COLL, queries);
  return docs.map(({ appwrite_id: _a, ...rest }) => rest as EventoCalendario);
}

export async function getEventosRango(
  desde: string,
  hasta: string,
): Promise<EventoCalendario[]> {
  const docs = await listDocs<EventoCalendario>(COLL, [
    { type: "between", attr: "fecha_evento", start: desde, end: hasta },
    { type: "orderAsc", attr: "fecha_evento" },
  ]);
  return docs.map(({ appwrite_id: _a, ...rest }) => rest as EventoCalendario);
}

export async function crearEvento(data: EventoCreate): Promise<{ id: number }> {
  return createDocReturnId(COLL, data as unknown as Record<string, unknown>);
}

export async function actualizarEvento(
  id: number,
  data: Partial<EventoCreate>,
): Promise<{ mensaje: string }> {
  return updateDocReturnOk(COLL, id, data as unknown as Record<string, unknown>);
}

export async function eliminarEvento(id: number): Promise<{ mensaje: string }> {
  return deleteDocReturnOk(COLL, id);
}
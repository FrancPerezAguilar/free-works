import { api } from "./client";
import type { Oportunidad, OportunidadCreate } from "../types/oportunidad";

export function getOportunidades(params?: {
  estado?: string;
}): Promise<Oportunidad[]> {
  const qs = new URLSearchParams();
  if (params?.estado) qs.set("estado", params.estado);
  return api.get(`oportunidades${qs.toString() ? `?${qs}` : ""}`);
}

export function getOportunidad(id: number): Promise<Oportunidad> {
  return api.get(`oportunidades/${id}`);
}

export function createOportunidad(
  data: OportunidadCreate,
): Promise<{ id: number }> {
  return api.post("oportunidades", data);
}

export function updateOportunidad(
  id: number,
  data: Partial<OportunidadCreate> & { estado?: string },
): Promise<{ mensaje: string }> {
  return api.patch(`oportunidades/${id}`, data);
}

import { api } from "./client";
import type { Material, MaterialCreate } from "../types/material";

export function getMateriales(params?: {
  categoria?: string;
  activo?: boolean;
}): Promise<Material[]> {
  const qs = new URLSearchParams();
  if (params?.categoria) qs.set("categoria", params.categoria);
  if (params?.activo !== undefined) qs.set("activo", String(params.activo));
  return api.get(`materiales${qs.toString() ? `?${qs}` : ""}`);
}

export function createMaterial(
  data: MaterialCreate,
): Promise<{ id: number }> {
  return api.post("materiales", data);
}

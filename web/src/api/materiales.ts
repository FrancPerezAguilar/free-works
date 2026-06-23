/**
 * Materiales → Appwrite collection `materiales`.
 *
 * Mantiene las mismas firmas que la versión anterior.
 */

import { listDocs, getDoc, createDocReturnId } from "../lib/appwriteDb";
import { COLLECTIONS } from "../config";
import type { Material, MaterialCreate } from "../types/material";

const COLL = COLLECTIONS.materiales;

export async function getMateriales(params?: {
  categoria?: string;
  activo?: boolean;
}): Promise<Material[]> {
  const queries: Parameters<typeof listDocs>[1] = [];
  if (params?.categoria) {
    queries.push({ type: "equal", attr: "categoria", value: params.categoria });
  }
  if (params?.activo !== undefined) {
    queries.push({ type: "equal", attr: "activo", value: params.activo });
  }
  const docs = await listDocs<Material>(COLL, queries);
  return docs.map(({ appwrite_id: _a, ...rest }) => rest as Material);
}

export async function createMaterial(data: MaterialCreate): Promise<{ id: number }> {
  return createDocReturnId(COLL, data as unknown as Record<string, unknown>);
}
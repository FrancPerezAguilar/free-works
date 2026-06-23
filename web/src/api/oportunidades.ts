/**
 * Oportunidades → Appwrite collection `oportunidades`.
 *
 * Mantiene las mismas firmas que la versión anterior.
 */

import {
  listDocs,
  getDoc,
  createDocReturnId,
  updateDocReturnOk,
} from "../lib/appwriteDb";
import { COLLECTIONS } from "../config";
import type { Oportunidad, OportunidadCreate } from "../types/oportunidad";

const COLL = COLLECTIONS.oportunidades;

export async function getOportunidades(params?: { estado?: string }): Promise<Oportunidad[]> {
  const queries: Parameters<typeof listDocs>[1] = [];
  if (params?.estado) {
    queries.push({ type: "equal", attr: "estado", value: params.estado });
  }
  const docs = await listDocs<Oportunidad>(COLL, queries);
  return docs.map(({ appwrite_id: _a, ...rest }) => rest as Oportunidad);
}

export async function getOportunidad(id: number): Promise<Oportunidad> {
  const doc = await getDoc<Oportunidad>(COLL, id);
  const { appwrite_id: _a, ...rest } = doc;
  return rest as Oportunidad;
}

export async function createOportunidad(data: OportunidadCreate): Promise<{ id: number }> {
  return createDocReturnId(COLL, data as unknown as Record<string, unknown>);
}

export async function updateOportunidad(
  id: number,
  data: Partial<OportunidadCreate> & { estado?: string },
): Promise<{ mensaje: string }> {
  return updateDocReturnOk(COLL, id, data as unknown as Record<string, unknown>);
}
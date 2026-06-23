/**
 * Presupuestos + líneas → Appwrite collections `presupuestos` y
 * `presupuesto_lineas`.
 *
 * Mantiene las mismas firmas que la versión anterior.
 */

import {
  listDocs,
  getDoc,
  createDocReturnId,
  updateDocReturnOk,
  deleteDocReturnOk,
} from "../lib/appwriteDb";
import { COLLECTIONS } from "../config";
import type {
  Presupuesto,
  PresupuestoCreate,
  LineaPresupuesto,
} from "../types/presupuesto";

const COLL = COLLECTIONS.presupuestos;
const COLL_LINEAS = COLLECTIONS.presupuestoLineas;

// ── Presupuestos ─────────────────────────────────────────────

export async function getPresupuestos(params?: {
  estado?: string;
  activo?: boolean;
}): Promise<Presupuesto[]> {
  const queries: Parameters<typeof listDocs>[1] = [];
  if (params?.estado) queries.push({ type: "equal", attr: "estado", value: params.estado });
  if (params?.activo !== undefined) queries.push({ type: "equal", attr: "activo", value: params.activo });
  const docs = await listDocs<Presupuesto>(COLL, queries);
  return docs.map(({ appwrite_id: _a, ...rest }) => rest as Presupuesto);
}

export async function getPresupuesto(id: number): Promise<Presupuesto> {
  const doc = await getDoc<Presupuesto>(COLL, id);
  const { appwrite_id: _a, ...rest } = doc;
  return rest as Presupuesto;
}

export async function createPresupuesto(data: PresupuestoCreate): Promise<{ id: number }> {
  return createDocReturnId(COLL, data as unknown as Record<string, unknown>);
}

export async function updatePresupuesto(
  id: number,
  data: Partial<PresupuestoCreate> & { estado?: string },
): Promise<{ mensaje: string }> {
  return updateDocReturnOk(COLL, id, data as unknown as Record<string, unknown>);
}

export async function deletePresupuesto(id: number): Promise<{ mensaje: string }> {
  return deleteDocReturnOk(COLL, id);
}

// ── Líneas ───────────────────────────────────────────────────

export async function getLineas(presupuestoId: number): Promise<LineaPresupuesto[]> {
  const docs = await listDocs<LineaPresupuesto>(COLL_LINEAS, [
    { type: "equal", attr: "presupuesto_id", value: presupuestoId },
  ]);
  return docs.map(({ appwrite_id: _a, ...rest }) => rest as LineaPresupuesto);
}

export async function addLinea(
  presupuestoId: number,
  data: {
    descripcion: string;
    cantidad?: number;
    unidad?: string;
    precio_unitario?: number;
    importe?: number;
  },
): Promise<{ mensaje: string }> {
  await createDocReturnId(COLL_LINEAS, {
    presupuesto_id: presupuestoId,
    ...data,
  } as unknown as Record<string, unknown>);
  return { mensaje: "ok" };
}
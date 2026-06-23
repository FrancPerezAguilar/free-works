/**
 * Facturas + líneas → Appwrite collections `facturas` y `factura_lineas`.
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
import type { Factura, FacturaCreate, LineaFactura } from "../types/factura";

const COLL = COLLECTIONS.facturas;
const COLL_LINEAS = COLLECTIONS.facturaLineas;

export async function getFacturas(params?: {
  estado_pago?: string;
  activo?: boolean;
}): Promise<Factura[]> {
  const queries: Parameters<typeof listDocs>[1] = [];
  if (params?.estado_pago) queries.push({ type: "equal", attr: "estado_pago", value: params.estado_pago });
  if (params?.activo !== undefined) queries.push({ type: "equal", attr: "activo", value: params.activo });
  const docs = await listDocs<Factura>(COLL, queries);
  return docs.map(({ appwrite_id: _a, ...rest }) => rest as Factura);
}

export async function getFactura(id: number): Promise<Factura> {
  const doc = await getDoc<Factura>(COLL, id);
  const { appwrite_id: _a, ...rest } = doc;
  return rest as Factura;
}

export async function createFactura(data: FacturaCreate): Promise<{ id: number }> {
  return createDocReturnId(COLL, data as unknown as Record<string, unknown>);
}

export async function updateFactura(
  id: number,
  data: Partial<FacturaCreate> & { estado_pago?: string },
): Promise<{ mensaje: string }> {
  return updateDocReturnOk(COLL, id, data as unknown as Record<string, unknown>);
}

// ── Líneas ───────────────────────────────────────────────────

export async function getLineas(facturaId: number): Promise<LineaFactura[]> {
  const docs = await listDocs<LineaFactura>(COLL_LINEAS, [
    { type: "equal", attr: "factura_id", value: facturaId },
  ]);
  return docs.map(({ appwrite_id: _a, ...rest }) => rest as LineaFactura);
}

export async function addLinea(
  facturaId: number,
  data: {
    descripcion: string;
    cantidad?: number;
    unidad?: string;
    precio_unitario?: number;
    importe?: number;
  },
): Promise<{ mensaje: string }> {
  await createDocReturnId(COLL_LINEAS, {
    factura_id: facturaId,
    ...data,
  } as unknown as Record<string, unknown>);
  return { mensaje: "ok" };
}
/**
 * Clientes → Appwrite collection `clientes`.
 *
 * Mantiene las mismas firmas que la versión anterior basada en fetch
 * para que las páginas (`ClienteList`, `ClienteDetail`, `ClienteFormModal`)
 * no requieran cambios.
 */

import { listDocs, getDoc, createDocReturnId, updateDocReturnOk } from "../lib/appwriteDb";
import { COLLECTIONS } from "../config";
import type { Cliente, ClienteCreate, ClienteUpdate } from "../types/cliente";

const COLL = COLLECTIONS.clientes;

type ClienteAdaptado = Cliente & { id: number; appwrite_id: string };

export async function getClientes(activo = true): Promise<Cliente[]> {
  const docs = await listDocs<Cliente>(COLL, [
    { type: "equal", attr: "activo", value: activo },
  ]);
  return docs.map(({ appwrite_id: _a, ...rest }) => rest as Cliente);
}

export async function getCliente(id: number): Promise<Cliente> {
  const doc = await getDoc<Cliente>(COLL, id);
  const { appwrite_id: _a, ...rest } = doc;
  return rest as Cliente;
}

export async function createCliente(data: ClienteCreate): Promise<{ id: number }> {
  return createDocReturnId(COLL, data as unknown as Record<string, unknown>);
}

export async function updateCliente(
  id: number,
  data: ClienteUpdate,
): Promise<{ mensaje: string }> {
  return updateDocReturnOk(COLL, id, data as unknown as Record<string, unknown>);
}
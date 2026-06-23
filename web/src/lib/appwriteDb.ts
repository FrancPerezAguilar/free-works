/**
 * Helpers de bajo nivel sobre el SDK de Appwrite.
 *
 * - Centralizan la lista de queries (filtros, ordenación, paginación).
 * - Gestionan el mapeo bidireccional entre el `id` numérico que esperan
 *   las páginas React y el `$id` (string) que usa Appwrite.
 *
 * Por qué hace falta el mapeo:
 * Las páginas y los tipos TypeScript fueron diseñados para un backend
 * PostgreSQL con IDs numéricos (`id: number`). Appwrite usa IDs string
 * (`$id: string`). Para NO tocar las páginas ni los tipos, adaptamos
 * en este módulo: convertimos `string → number` al leer y
 * `number → string` al escribir. Ver {@link idMap} para los detalles.
 */

import { Query, ID, type Models } from "appwrite";
import { databases, APPWRITE_CONFIG } from "./appwrite";
import { idMap } from "./idMap";

const DB = APPWRITE_CONFIG.databaseId;

// ── Tipos públicos ────────────────────────────────────────────

export type AppwriteDoc = Models.Document & Record<string, unknown>;

export type QueryFilter =
  | { type: "equal"; attr: string; value: unknown }
  | { type: "notEqual"; attr: string; value: unknown }
  | { type: "less"; attr: string; value: number | string }
  | { type: "lessEqual"; attr: string; value: number | string }
  | { type: "greater"; attr: string; value: number | string }
  | { type: "greaterEqual"; attr: string; value: number | string }
  | { type: "search"; attr: string; value: string }
  | { type: "between"; attr: string; start: string | number; end: string | number }
  | { type: "isNull"; attr: string }
  | { type: "isNotNull"; attr: string }
  | { type: "orderAsc"; attr: string }
  | { type: "orderDesc"; attr: string }
  | { type: "limit"; value: number }
  | { type: "offset"; value: number };

// ── Helpers de Query ──────────────────────────────────────────

function filterToQuery(f: QueryFilter): string {
  switch (f.type) {
    case "equal":
      return Query.equal(f.attr, f.value as never);
    case "notEqual":
      return Query.notEqual(f.attr, f.value as never);
    case "less":
      return Query.lessThan(f.attr, f.value as never);
    case "lessEqual":
      return Query.lessThanEqual(f.attr, f.value as never);
    case "greater":
      return Query.greaterThan(f.attr, f.value as never);
    case "greaterEqual":
      return Query.greaterThanEqual(f.attr, f.value as never);
    case "search":
      return Query.search(f.attr, f.value);
    case "between":
      return Query.between(f.attr, f.start as never, f.end as never);
    case "isNull":
      return Query.isNull(f.attr);
    case "isNotNull":
      return Query.isNotNull(f.attr);
    case "orderAsc":
      return Query.orderAsc(f.attr);
    case "orderDesc":
      return Query.orderDesc(f.attr);
    case "limit":
      return Query.limit(f.value);
    case "offset":
      return Query.offset(f.value);
  }
}

// ── Adaptador de documento ────────────────────────────────────

type AdaptedDoc = {
  id: number;
  appwrite_id: string;
  fecha_creacion: string;
  fecha_modificacion: string;
  [k: string]: unknown;
};

/**
 * Convierte un documento Appwrite (`$id`, `$createdAt`, ...) en un
 * objeto plano compatible con los tipos de `web/src/types/*`.
 *
 * - Registra el mapeo `stringId ↔ numberId` en {@link idMap} para
 *   mantenerlo consistente en operaciones posteriores.
 * - Devuelve `id: number` (asignado por idMap).
 * - Mantiene `$id` accesible como `appwrite_id` por si alguna página
 *   necesita interoperar con el SDK.
 */
function adaptDoc(doc: AppwriteDoc): AdaptedDoc {
  const numericId = idMap.getOrAssign(doc.$id);
  const { $id, $createdAt, $updatedAt, $permissions, $databaseId, $collectionId, $sequence, ...rest } = doc;
  void $permissions; void $databaseId; void $collectionId; void $sequence;
  return {
    ...(rest as Record<string, unknown>),
    id: numericId,
    appwrite_id: $id,
    fecha_creacion: $createdAt,
    fecha_modificacion: $updatedAt,
  } as AdaptedDoc;
}

// ── API pública ───────────────────────────────────────────────

export async function listDocs<T = unknown>(
  collectionId: string,
  queries: QueryFilter[] = [],
): Promise<(T & AdaptedDoc)[]> {
  const queryStrings = queries.map(filterToQuery);
  const res = await databases.listDocuments(DB, collectionId, queryStrings);
  return res.documents.map((d) => adaptDoc(d as AppwriteDoc) as unknown as T & AdaptedDoc);
}

export async function getDoc<T = unknown>(
  collectionId: string,
  id: number | string,
): Promise<T & AdaptedDoc> {
  const appwriteId = idMap.resolve(id);
  const doc = await databases.getDocument(DB, collectionId, appwriteId);
  return adaptDoc(doc as AppwriteDoc) as unknown as T & AdaptedDoc;
}

export async function createDoc<T = unknown>(
  collectionId: string,
  data: Record<string, unknown>,
): Promise<T & AdaptedDoc> {
  // Limpia campos meta que Appwrite gestiona internamente
  const {
    id: _omitId,
    appwrite_id: _omitAid,
    fecha_creacion: _omitC,
    fecha_modificacion: _omitM,
    $id: _oid,
    ...payload
  } = data;
  void _omitId; void _omitAid; void _omitC; void _omitM; void _oid;

  const doc = await databases.createDocument(DB, collectionId, ID.unique(), payload);
  return adaptDoc(doc as AppwriteDoc) as unknown as T & AdaptedDoc;
}

export async function updateDoc<T = unknown>(
  collectionId: string,
  id: number | string,
  data: Record<string, unknown>,
): Promise<T & AdaptedDoc> {
  const appwriteId = idMap.resolve(id);
  const {
    id: _omitId,
    appwrite_id: _omitAid,
    fecha_creacion: _omitC,
    fecha_modificacion: _omitM,
    $id: _oid,
    ...payload
  } = data;
  void _omitId; void _omitAid; void _omitC; void _omitM; void _oid;

  const doc = await databases.updateDocument(DB, collectionId, appwriteId, payload);
  return adaptDoc(doc as AppwriteDoc) as unknown as T & AdaptedDoc;
}

export async function deleteDoc(
  collectionId: string,
  id: number | string,
): Promise<void> {
  const appwriteId = idMap.resolve(id);
  await databases.deleteDocument(DB, collectionId, appwriteId);
}

// ── Helpers de conveniencia ───────────────────────────────────

/**
 * Convierte un array de IDs numéricos (FKs) en un array de strings
 * `$id` apto para `Query.equal('cliente_id', [...])`.
 */
export function idsToAppwriteIds(ids: Array<number | string | null | undefined>): string[] {
  return ids.filter((x): x is number | string => x != null).map((id) => idMap.resolve(id));
}

/**
 * Atajo para crear un documento y devolver SOLO su `id` numérico,
 * manteniendo la firma `{ id: number }` que esperan las páginas.
 */
export async function createDocReturnId(
  collectionId: string,
  data: Record<string, unknown>,
): Promise<{ id: number }> {
  const created = await createDoc(collectionId, data);
  return { id: created.id };
}

/**
 * Atajo para `updateDoc` que devuelve `{ mensaje: 'ok' }`,
 * manteniendo la firma `{ mensaje: string }` que esperan las páginas.
 */
export async function updateDocReturnOk(
  collectionId: string,
  id: number | string,
  data: Record<string, unknown>,
): Promise<{ mensaje: string }> {
  await updateDoc(collectionId, id, data);
  return { mensaje: "ok" };
}

/**
 * Atajo para `deleteDoc` que devuelve `{ mensaje: 'ok' }`.
 */
export async function deleteDocReturnOk(
  collectionId: string,
  id: number | string,
): Promise<{ mensaje: string }> {
  await deleteDoc(collectionId, id);
  return { mensaje: "ok" };
}

// Re-export para módulos que necesiten `Query` directamente
export { Query };
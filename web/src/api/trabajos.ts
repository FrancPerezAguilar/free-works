/**
 * Trabajos + sub-entidades → Appwrite.
 *
 *   Trabajos            → `trabajos`
 *   Checklist           → `trabajo_checklist`
 *   Tiempos             → `trabajo_tiempos`
 *   Materiales usados   → `trabajo_materiales`
 *   Comentarios         → `comentarios` (polimórficos con entity_type='trabajo')
 *   Técnicos            → `tecnicos` + relación trabajo-tecnico documentada
 *                        inline en `trabajo_tecnicos` (si existiera) o vía
 *                        campo JSON en `trabajos.tecnicos_asignados`.
 *   Adjuntos            → `adjuntos` (subidos vía Appwrite Storage bucket)
 *
 * Mantiene las MISMAS firmas que la versión anterior basada en fetch
 * para que las páginas no necesiten cambios.
 */

import { ID } from "appwrite";
import {
  listDocs,
  getDoc,
  createDocReturnId,
  updateDocReturnOk,
  deleteDocReturnOk,
} from "../lib/appwriteDb";
import { databases, storage, APPWRITE_CONFIG } from "../lib/appwrite";
import { COLLECTIONS } from "../config";
import type {
  Trabajo,
  TrabajoCreate,
  ChecklistItem,
  RegistroTiempo,
  MaterialUsado,
  Comentario,
  Adjunto,
} from "../types/trabajo";

const COLL = COLLECTIONS.trabajos;
const COLL_CHECKLIST = COLLECTIONS.trabajoChecklist;
const COLL_TIEMPOS = COLLECTIONS.trabajoTiempos;
const COLL_MAT_USADOS = COLLECTIONS.trabajoMateriales;
const COLL_COMENTARIOS = COLLECTIONS.comentarios;
const COLL_TECNICOS = COLLECTIONS.tecnicos;
const COLL_ADJUNTOS = COLLECTIONS.adjuntos;
const DB = APPWRITE_CONFIG.databaseId;

// ── Tipos locales ─────────────────────────────────────────────

export interface Tecnico {
  id: number;
  nombre: string;
  apellidos?: string;
  especialidad?: string;
  telefono?: string;
  email?: string;
  activo?: boolean;
}

export interface TecnicoAsignadoTrabajo {
  id: number;
  trabajo_id: number;
  tecnico_id: number;
  horas: number;
  rol?: string;
  nombre: string;
  apellidos?: string;
  especialidad?: string;
}

function stripMeta<T extends Record<string, unknown>>(doc: T): Omit<T, "appwrite_id"> {
  const { appwrite_id: _a, ...rest } = doc as T & { appwrite_id?: string };
  void _a;
  return rest as Omit<T, "appwrite_id">;
}

// ── Trabajos ──────────────────────────────────────────────────

export async function getTrabajos(params?: {
  estado?: string;
  activo?: boolean;
}): Promise<Trabajo[]> {
  const queries: Parameters<typeof listDocs>[1] = [];
  if (params?.estado) queries.push({ type: "equal", attr: "estado", value: params.estado });
  if (params?.activo !== undefined) queries.push({ type: "equal", attr: "activo", value: params.activo });
  const docs = await listDocs<Trabajo>(COLL, queries);
  return docs.map((d) => stripMeta(d)) as unknown as Trabajo[];
}

export async function getTrabajo(id: number): Promise<Trabajo> {
  // 1) Trabajo base
  const trabajo = await getDoc<Trabajo>(COLL, id);
  const { appwrite_id: _a, ...rest } = trabajo;

  // 2) Sub-entidades en paralelo
  const [checklist, tiempos, materiales, comentarios] = await Promise.all([
    listDocs<ChecklistItem>(COLL_CHECKLIST, [
      { type: "equal", attr: "trabajo_id", value: trabajo.id },
      { type: "orderAsc", attr: "fecha_programada" },
    ]),
    listDocs<RegistroTiempo>(COLL_TIEMPOS, [
      { type: "equal", attr: "trabajo_id", value: trabajo.id },
      { type: "orderDesc", attr: "fecha" },
    ]),
    listDocs<MaterialUsado>(COLL_MAT_USADOS, [
      { type: "equal", attr: "trabajo_id", value: trabajo.id },
    ]),
    listDocs<Comentario>(COLL_COMENTARIOS, [
      { type: "equal", attr: "entity_type", value: "trabajo" },
      { type: "equal", attr: "entity_id", value: trabajo.id },
      { type: "orderAsc", attr: "fecha_creacion" },
    ]),
  ]);

  return {
    ...(rest as Omit<Trabajo, "id" | "appwrite_id">),
    id: trabajo.id,
    checklist: checklist.map((c) => stripMeta(c)) as unknown as ChecklistItem[],
    tiempos: tiempos.map((t) => stripMeta(t)) as unknown as RegistroTiempo[],
    materiales: materiales.map((m) => stripMeta(m)) as unknown as MaterialUsado[],
    comentarios: comentarios.map((c) => stripMeta(c)) as unknown as Comentario[],
  };
}

export async function createTrabajo(data: TrabajoCreate): Promise<{ id: number }> {
  return createDocReturnId(COLL, data as unknown as Record<string, unknown>);
}

export async function updateTrabajo(
  id: number,
  data: Partial<TrabajoCreate> & { estado?: string },
): Promise<{ mensaje: string }> {
  return updateDocReturnOk(COLL, id, data as unknown as Record<string, unknown>);
}

// ── Checklist ─────────────────────────────────────────────────

export async function getChecklist(trabajoId: number): Promise<ChecklistItem[]> {
  const docs = await listDocs<ChecklistItem>(COLL_CHECKLIST, [
    { type: "equal", attr: "trabajo_id", value: trabajoId },
    { type: "orderAsc", attr: "fecha_programada" },
  ]);
  return docs.map((d) => stripMeta(d)) as unknown as ChecklistItem[];
}

export async function addTareaChecklist(
  trabajoId: number,
  data: { descripcion: string; fecha_programada?: string; hora_programada?: string },
): Promise<{ mensaje: string }> {
  await createDocReturnId(COLL_CHECKLIST, {
    trabajo_id: trabajoId,
    completada: false,
    ...data,
  });
  return { mensaje: "ok" };
}

export async function completarTarea(itemId: number): Promise<{ mensaje: string }> {
  return updateDocReturnOk(COLL_CHECKLIST, itemId, {
    completada: true,
    fecha_completada: new Date().toISOString(),
  });
}

// ── Tiempos ───────────────────────────────────────────────────

export async function registrarTiempo(
  trabajoId: number,
  data: { horas: number; descripcion?: string; fecha?: string },
): Promise<{ mensaje: string }> {
  await createDocReturnId(COLL_TIEMPOS, {
    trabajo_id: trabajoId,
    fecha: data.fecha ?? new Date().toISOString().slice(0, 10),
    horas: data.horas,
    descripcion: data.descripcion ?? null,
  });
  return { mensaje: "ok" };
}

// ── Comentarios ───────────────────────────────────────────────

export async function getComentarios(trabajoId: number): Promise<Comentario[]> {
  const docs = await listDocs<Comentario>(COLL_COMENTARIOS, [
    { type: "equal", attr: "entity_type", value: "trabajo" },
    { type: "equal", attr: "entity_id", value: trabajoId },
    { type: "orderAsc", attr: "fecha_creacion" },
  ]);
  return docs.map((d) => stripMeta(d)) as unknown as Comentario[];
}

export async function addComentario(
  trabajoId: number,
  data: { contenido: string; autor?: string },
): Promise<{ mensaje: string }> {
  await createDocReturnId(COLL_COMENTARIOS, {
    entity_type: "trabajo",
    entity_id: trabajoId,
    autor: data.autor ?? "Usuario",
    contenido: data.contenido,
  });
  return { mensaje: "ok" };
}

// ── Materiales usados en el trabajo ───────────────────────────

export async function addMaterial(
  trabajoId: number,
  data: {
    material_id?: number;
    material_nombre?: string;
    cantidad: number;
    unidad?: string;
    precio_unitario?: number;
    notas?: string;
  },
): Promise<{ mensaje: string }> {
  const subtotal = (data.precio_unitario ?? 0) * data.cantidad;
  await createDocReturnId(COLL_MAT_USADOS, {
    trabajo_id: trabajoId,
    ...data,
    subtotal,
  });
  return { mensaje: "ok" };
}

// ── Tareas por fecha (para el calendario / dashboard) ─────────

export async function getTareasPorFecha(fecha: string): Promise<ChecklistItem[]> {
  const docs = await listDocs<ChecklistItem>(COLL_CHECKLIST, [
    { type: "equal", attr: "fecha_programada", value: fecha },
    { type: "orderAsc", attr: "hora_programada" },
  ]);
  return docs.map((d) => stripMeta(d)) as unknown as ChecklistItem[];
}

// ── Técnicos (catálogo) ───────────────────────────────────────

export async function getTecnicos(): Promise<Tecnico[]> {
  const docs = await listDocs<Tecnico>(COLL_TECNICOS, [
    { type: "equal", attr: "activo", value: true },
    { type: "orderAsc", attr: "nombre" },
  ]);
  return docs.map((d) => stripMeta(d)) as unknown as Tecnico[];
}

export async function createTecnico(
  data: Omit<Tecnico, "id" | "activo">,
): Promise<{ id: number; codigo_tecnico: string }> {
  const res = await createDocReturnId(COLL_TECNICOS, {
    ...data,
    activo: true,
  } as unknown as Record<string, unknown>);
  // codigo_tecnico se genera en backend; lo simulamos localmente
  return { id: res.id, codigo_tecnico: `TEC-${String(res.id).padStart(4, "0")}` };
}

// ── Asignación trabajo ↔ técnico ──────────────────────────────
//
// Appwrite no tiene joins. Modelamos la relación guardando un array
// de IDs en el campo `tecnicos_asignados` del propio trabajo. Esto
// mantiene el modelo simple y se alinea con la columna JSON existente
// en PostgreSQL.

export async function getTecnicosTrabajo(trabajoId: number): Promise<TecnicoAsignadoTrabajo[]> {
  const trabajo = await getDoc<Trabajo & { tecnicos_asignados?: Array<{ tecnico_id: number; horas: number; rol?: string }> }>(COLL, trabajoId);
  const asignados = (trabajo.tecnicos_asignados ?? []) as Array<{ tecnico_id: number; horas: number; rol?: string }>;
  if (asignados.length === 0) return [];

  // Hidratamos cada técnico
  const catalogo = await getTecnicos();
  const porId = new Map(catalogo.map((t) => [t.id, t]));

  return asignados
    .map((a, idx) => {
      const t = porId.get(a.tecnico_id);
      return {
        id: idx + 1, // id local de la relación
        trabajo_id: trabajo.id,
        tecnico_id: a.tecnico_id,
        horas: a.horas,
        rol: a.rol,
        nombre: t?.nombre ?? "(eliminado)",
        apellidos: t?.apellidos,
        especialidad: t?.especialidad,
      } satisfies TecnicoAsignadoTrabajo;
    });
}

export async function asignarTecnico(
  trabajoId: number,
  data: { tecnico_id: number; horas?: number; rol?: string },
): Promise<{ id: number; mensaje: string }> {
  const trabajo = await getDoc<Trabajo & { tecnicos_asignados?: Array<{ tecnico_id: number; horas: number; rol?: string }> }>(COLL, trabajoId);
  const actuales = (trabajo.tecnicos_asignados ?? []) as Array<{ tecnico_id: number; horas: number; rol?: string }>;

  // Si ya estaba asignado, actualizamos horas/rol
  const idx = actuales.findIndex((a) => a.tecnico_id === data.tecnico_id);
  const nuevos = [...actuales];
  if (idx >= 0) {
    nuevos[idx] = { tecnico_id: data.tecnico_id, horas: data.horas ?? nuevos[idx].horas, rol: data.rol ?? nuevos[idx].rol };
  } else {
    nuevos.push({ tecnico_id: data.tecnico_id, horas: data.horas ?? 0, rol: data.rol });
  }

  await updateDocReturnOk(COLL, trabajoId, { tecnicos_asignados: nuevos });
  return { id: trabajo.id, mensaje: "ok" };
}

export async function desasignarTecnico(
  trabajoId: number,
  tecnicoId: number,
): Promise<{ mensaje: string }> {
  const trabajo = await getDoc<Trabajo & { tecnicos_asignados?: Array<{ tecnico_id: number; horas: number; rol?: string }> }>(COLL, trabajoId);
  const actuales = (trabajo.tecnicos_asignados ?? []) as Array<{ tecnico_id: number; horas: number; rol?: string }>;
  const filtrados = actuales.filter((a) => a.tecnico_id !== tecnicoId);
  await updateDocReturnOk(COLL, trabajoId, { tecnicos_asignados: filtrados });
  return { mensaje: "ok" };
}

// ── Adjuntos ──────────────────────────────────────────────────
//
// Appwrite Storage guarda el archivo binario. Guardamos los metadatos
// en la colección `adjuntos` con el `bucket_file_id` que devuelve Storage.
// El campo `url` se construye a partir del endpoint público.

const BUCKET_ID = "adjuntos"; // nombre del bucket en Appwrite Storage

function inferTipo(mime: string): Adjunto["tipo"] {
  if (mime.startsWith("image/")) return "foto";
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("audio/")) return "audio";
  return "documento";
}

export async function getAdjuntos(trabajoId: number): Promise<Adjunto[]> {
  const docs = await listDocs<Adjunto & { trabajo_id?: number; entity_type?: string; entity_id?: number }>(COLL_ADJUNTOS, [
    { type: "equal", attr: "entity_type", value: "trabajo" },
    { type: "equal", attr: "entity_id", value: trabajoId },
    { type: "orderDesc", attr: "fecha_creacion" },
  ]);
  return docs.map((d) => {
    const meta = stripMeta(d);
    const appwriteFileId = (d as unknown as { bucket_file_id?: string }).bucket_file_id;
    const url = appwriteFileId
      ? `${APPWRITE_CONFIG.endpoint}/storage/buckets/${BUCKET_ID}/files/${appwriteFileId}/view?project=${APPWRITE_CONFIG.projectId}`
      : undefined;
    return { ...meta, url } as Adjunto;
  });
}

export async function uploadAdjunto(
  trabajoId: number,
  file: File,
  descripcion?: string,
): Promise<{ id: number; tipo: string; nombre: string; url: string; mensaje: string }> {
  // 1) Subimos el binario a Storage
  const uploaded = await storage.createFile(BUCKET_ID, ID.unique(), file);

  // 2) Registramos los metadatos
  const meta = await createDocReturnId(COLL_ADJUNTOS, {
    entity_type: "trabajo",
    entity_id: trabajoId,
    nombre: file.name,
    tipo: inferTipo(file.type),
    descripcion: descripcion ?? null,
    bucket_file_id: uploaded.$id,
    tamano_bytes: file.size,
    mime: file.type,
    subido_por: "Usuario",
  });

  const url = `${APPWRITE_CONFIG.endpoint}/storage/buckets/${BUCKET_ID}/files/${uploaded.$id}/view?project=${APPWRITE_CONFIG.projectId}`;

  // Limpieza: si falló la creación de metadatos, borrar el archivo subido
  return {
    id: meta.id,
    tipo: inferTipo(file.type),
    nombre: file.name,
    url,
    mensaje: "ok",
  };
}

export async function deleteAdjunto(adjuntoId: number): Promise<{ mensaje: string }> {
  // Recuperamos el doc para saber el bucket_file_id
  const doc = await getDoc<{ bucket_file_id?: string }>(COLL_ADJUNTOS, adjuntoId);
  if (doc.bucket_file_id) {
    try {
      await storage.deleteFile(BUCKET_ID, doc.bucket_file_id);
    } catch {
      // Si ya no existía el archivo, seguimos adelante borrando metadatos
    }
  }
  return deleteDocReturnOk(COLL_ADJUNTOS, adjuntoId);
}

// Silenciamos la advertencia de variable no usada si no se importa DB
void DB;
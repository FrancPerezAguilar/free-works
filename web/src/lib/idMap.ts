/**
 * Mapeo bidireccional estable entre los IDs string de Appwrite (`$id`)
 * y los IDs numéricos que esperan las páginas React (tipo `id: number`).
 *
 * Estrategia:
 * - Para documentos NUEVOS creados por la app: asignamos números
 *   incrementales a partir de 1. Se persiste en localStorage con clave
 *   `freeworks:idmap:counter`, así no se reinicia en cada recarga.
 * - Para IDs que vienen de fuera (otra herramienta, datos importados):
 *   cuando se lee por primera vez un `$id` desconocido, se le asigna
 *   el siguiente número del contador.
 * - El mapa `stringId ↔ numberId` se persiste en localStorage bajo
 *   `freeworks:idmap:store`. Esto garantiza que el mismo doc reciba
 *   siempre el mismo número entre renderizados y pestañas.
 *
 * Limitación: si dos pestañas crean documentos a la vez pueden
 * colisionar. Para evitarlo se podría usar un lock, pero el coste no
 * compensa en esta fase de desarrollo.
 */

const COUNTER_KEY = "freeworks:idmap:counter";
const STORE_KEY = "freeworks:idmap:store";

type Store = Record<string, number>;

function readStore(): Store {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    // localStorage lleno o no disponible (SSR, modo privado): seguimos en memoria
  }
}

function readCounter(): number {
  try {
    const raw = localStorage.getItem(COUNTER_KEY);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

function writeCounter(n: number): void {
  try {
    localStorage.setItem(COUNTER_KEY, String(n));
  } catch {
    // ignore
  }
}

// Caché en memoria (espejo de localStorage para no re-parsear en cada llamada)
let memoryStore: Store | null = null;
let memoryCounter: number | null = null;

function getStore(): Store {
  if (!memoryStore) memoryStore = readStore();
  return memoryStore;
}

function getCounter(): number {
  if (memoryCounter == null) memoryCounter = readCounter();
  return memoryCounter;
}

function persist(): void {
  if (memoryStore) writeStore(memoryStore);
  if (memoryCounter != null) writeCounter(memoryCounter);
}

/**
 * Devuelve el número asociado a un `$id` de Appwrite. Si es la primera
 * vez que lo vemos, le asigna el siguiente número del contador.
 */
function getOrAssign(appwriteId: string): number {
  const store = getStore();
  if (store[appwriteId] != null) return store[appwriteId];

  const counter = getCounter() + 1;
  memoryCounter = counter;
  store[appwriteId] = counter;
  persist();
  return counter;
}

/**
 * Resuelve un ID entrante (numérico o string) a un `$id` de Appwrite.
 * - Si recibe un número, busca su `appwrite_id` en el mapa.
 * - Si recibe un string, asume que ya es un `$id` válido.
 */
function resolve(id: number | string): string {
  if (typeof id === "string") return id;

  // Búsqueda inversa: recorremos el store para encontrar el string
  // asociado al número. Para colecciones grandes no escala, pero aquí
  // es perfectamente válido (cientos de docs como mucho).
  const store = getStore();
  for (const [appwriteId, numericId] of Object.entries(store)) {
    if (numericId === id) return appwriteId;
  }

  // Si no lo encontramos (p.ej. cache vacía tras un hard refresh y
  // nunca llegamos a leer el doc antes), tratamos el número como si
  // fuera un appwrite_id legacy. Esto preserva la compatibilidad con
  // IDs viejos que vengan del backend PostgreSQL antiguo.
  return String(id);
}

/**
 * Borra el mapeo (útil para tests o reset de caché).
 */
function clear(): void {
  memoryStore = {};
  memoryCounter = 0;
  persist();
}

export const idMap = {
  getOrAssign,
  resolve,
  clear,
};
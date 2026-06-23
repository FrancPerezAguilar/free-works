/**
 * Cliente HTTP legacy — DEPRECATED.
 *
 * Free Works ha migrado de FastAPI/PostgreSQL a Appwrite. Los módulos
 * de `web/src/api/*` ya no usan este `api`; consumen directamente
 * los helpers de `web/src/lib/appwriteDb.ts`.
 *
 * Este archivo se mantiene para:
 *   1. Compatibilidad con código de terceros (componentes assistant,
 *      integraciones puntuales) que aún hacen `fetch('/api/...')`.
 *   2. Servir como punto único de migración si en el futuro hace
 *      falta un proxy HTTP a Cloud Functions de Appwrite.
 *
 * Si una página aún importa `api` desde aquí, está usando el backend
 * antiguo y debería migrarse a los módulos `web/src/api/<entidad>.ts`.
 */

/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */

const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { detail?: string }).detail || res.statusText);
  }
  return res.json();
}

/** @deprecated Usa los módulos de `web/src/api/<entidad>.ts` (Appwrite). */
export const api = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, data?: unknown) => {
    if (data instanceof FormData) {
      return request<T>(path, { method: "POST", body: data });
    }
    return request<T>(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  patch: <T>(path: string, data?: unknown) => {
    if (data instanceof FormData) {
      return request<T>(path, { method: "PATCH", body: data });
    }
    return request<T>(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
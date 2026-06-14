const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { detail?: string }).detail || res.statusText);
  }
  return res.json();
}

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

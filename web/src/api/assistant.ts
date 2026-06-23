/**
 * Cliente API para el Asistente IA.
 * Conecta con el backend Free Works que hace proxy al Hermes API Server.
 */

export interface AssistantChatResponse {
  id: string;
  content: string;
  role: "assistant";
  timestamp: number;
}

export interface AssistantAudioResponse {
  status: string;
  filename: string;
  size: number;
  message: string;
}

export type StreamCallback = (chunk: string) => void;
export type StreamDone = () => void;
export type StreamError = (error: string) => void;

/**
 * Envía un mensaje de texto al asistente y devuelve la respuesta completa.
 * Usado como fallback o para respuestas no-streaming.
 */
export async function sendMessage(text: string): Promise<AssistantChatResponse> {
  const resp = await fetch("/api/assistant/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Error del asistente: ${resp.status} - ${err}`);
  }

  const data = await resp.json();
  return {
    id: crypto.randomUUID(),
    content: data.content || "Sin respuesta",
    role: "assistant",
    timestamp: Date.now(),
  };
}

/**
 * Envía un mensaje de texto y recibe la respuesta en streaming vía SSE.
 * onChunk se llama con cada fragmento de texto.
 * onDone se llama cuando el stream termina.
 * onError se llama si hay un error.
 * Devuelve una función abort() para cancelar el stream.
 */
export function sendMessageStream(
  text: string,
  history: Array<{ role: string; content: string }>,
  onChunk: StreamCallback,
  onDone: StreamDone,
  onError: StreamError
): () => void {
  const controller = new AbortController();

  fetch("/api/assistant/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text, history }),
    signal: controller.signal,
  })
    .then(async (resp) => {
      if (!resp.ok) {
        const err = await resp.text();
        onError(`Error ${resp.status}: ${err}`);
        return;
      }

      const reader = resp.body?.getReader();
      if (!reader) {
        onError("No se pudo leer el stream de respuesta");
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // guardar línea incompleta

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") {
                onDone();
                return;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.error) {
                  onError(parsed.error);
                  return;
                }
                if (parsed.content) {
                  onChunk(parsed.content);
                }
              } catch {
                // línea no-JSON, ignorar
              }
            }
          }
        }
        // Si el stream terminó sin [DONE], igual terminar
        onDone();
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") {
          onDone(); // abort no es error
        } else {
          onError((err as Error)?.message || "Error en el stream");
        }
      }
    })
    .catch((err) => {
      if (err?.name !== "AbortError") {
        onError(err?.message || "Error de conexión");
      }
    });

  return () => controller.abort();
}

/**
 * Envía un blob de audio al backend.
 * El backend lo guarda y devuelve confirmación.
 */
export async function sendAudio(blob: Blob): Promise<AssistantAudioResponse> {
  const formData = new FormData();
  formData.append("file", blob, "audio.webm");

  const resp = await fetch("/api/assistant/audio", {
    method: "POST",
    body: formData,
  });

  if (!resp.ok) {
    throw new Error(`Error al enviar audio: ${resp.status}`);
  }

  return resp.json();
}

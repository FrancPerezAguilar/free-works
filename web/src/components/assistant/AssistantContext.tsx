import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  sendMessageStream,
  sendAudio as apiSendAudio,
} from "@/api/assistant";

export type MessageRole = "user" | "assistant";
export type MessageType = "text" | "audio" | "file";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  type: MessageType;
  /** Nombre del archivo (solo para type === "file" o "audio") */
  fileName?: string;
  /** Tamaño del adjunto en bytes */
  fileSize?: number;
  /** MIME type del adjunto (audio/file) */
  mimeType?: string;
  /** Indicador de "escribiendo..." en respuestas del asistente */
  pending?: boolean;
  timestamp: number;
}

interface AssistantContextValue {
  messages: Message[];
  isOpen: boolean;
  isRecording: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  sendMessage: (text: string) => Promise<void>;
  addAudioMessage: (blob: Blob, fileName?: string) => Promise<void>;
  addFileMessage: (file: File) => Promise<void>;
  setRecordingState: (recording: boolean) => void;
  clearMessages: () => void;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

interface AssistantProviderProps {
  children: ReactNode;
}

/**
 * Convierte la lista de mensajes del contexto al formato history
 * esperado por el backend (solo role + content, sin metadata).
 */
function messagesToHistory(
  messages: Message[]
): Array<{ role: string; content: string }> {
  return messages
    .filter((m) => !m.pending && m.content && m.content !== "Escribiendo...")
    .map((m) => ({ role: m.role, content: m.content }));
}

export function AssistantProvider({ children }: AssistantProviderProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Ref para no romper la identidad de las funciones en consumidores
  const recordingRef = useRef(false);
  recordingRef.current = isRecording;

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  const setRecordingState = useCallback((r: boolean) => setIsRecording(r), []);

  const pushMessage = useCallback((msg: Omit<Message, "id" | "timestamp">) => {
    setMessages((prev) => [
      ...prev,
      {
        ...msg,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      },
    ]);
  }, []);

  const updateLastAssistant = useCallback((id: string, patch: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
    );
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      // 1) mensaje del usuario
      pushMessage({
        role: "user",
        content: trimmed,
        type: "text",
      });

      // 2) placeholder "escribiendo..." del asistente (lo actualizaremos en streaming)
      const placeholderId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        {
          id: placeholderId,
          role: "assistant",
          content: "",
          type: "text",
          pending: true,
          timestamp: Date.now(),
        },
      ]);

      // 3) Preparar history a partir de los mensajes anteriores (excluyendo el
      //    que acabamos de añadir, que se envía como `message`).
      setMessages((prev) => {
        // Capturamos el estado actual (sin el placeholder nuevo) para enviar
        // al backend como contexto. Excluimos el último mensaje (el user actual)
        // y el placeholder recién creado.
        const withoutPlaceholder = prev.filter((m) => m.id !== placeholderId);
        const history = messagesToHistory(withoutPlaceholder);

        sendMessageStream(
          trimmed,
          history,
          // onChunk: vamos acumulando el texto
          (chunk) => {
            updateLastAssistant(placeholderId, (prevMsg) => ({
              content: (prevMsg?.content ?? "") + chunk,
              pending: true,
            }));
          },
          // onDone: terminamos el pending
          () => {
            updateLastAssistant(placeholderId, { pending: false });
          },
          // onError: mostramos el error
          (errMsg) => {
            updateLastAssistant(placeholderId, {
              content: `❌ Error: ${errMsg}`,
              pending: false,
            });
          }
        );

        return prev;
      });
    },
    [pushMessage, updateLastAssistant]
  );

  const addAudioMessage = useCallback(
    async (blob: Blob, fileName = "audio.webm") => {
      // 1) mensaje del usuario (audio)
      pushMessage({
        role: "user",
        content: "🎤 Mensaje de voz",
        type: "audio",
        fileName,
        fileSize: blob.size,
        mimeType: blob.type,
      });

      // 2) placeholder del asistente
      const placeholderId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        {
          id: placeholderId,
          role: "assistant",
          content: "Procesando audio...",
          type: "text",
          pending: true,
          timestamp: Date.now(),
        },
      ]);

      try {
        const reply = await apiSendAudio(blob);
        updateLastAssistant(placeholderId, {
          content: reply.message,
          pending: false,
        });
      } catch (err) {
        updateLastAssistant(placeholderId, {
          content: `❌ Error: ${(err as Error).message}`,
          pending: false,
        });
      }
    },
    [pushMessage, updateLastAssistant]
  );

  const addFileMessage = useCallback(
    async (file: File) => {
      // 1) mensaje del usuario (archivo)
      pushMessage({
        role: "user",
        content: file.name,
        type: "file",
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      });

      // 2) placeholder del asistente
      const placeholderId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        {
          id: placeholderId,
          role: "assistant",
          content: "Procesando archivo...",
          type: "text",
          pending: true,
          timestamp: Date.now(),
        },
      ]);

      try {
        // Por ahora, eco simple indicando el nombre del archivo
        const sizeKb = (file.size / 1024).toFixed(1);
        updateLastAssistant(placeholderId, {
          content: `📎 (mock) Archivo "${file.name}" recibido (${sizeKb} KB). Se procesará cuando el backend esté conectado.`,
          pending: false,
        });
      } catch (err) {
        updateLastAssistant(placeholderId, {
          content: `❌ Error: ${(err as Error).message}`,
          pending: false,
        });
      }
    },
    [pushMessage, updateLastAssistant]
  );

  const clearMessages = useCallback(() => setMessages([]), []);

  const value = useMemo<AssistantContextValue>(
    () => ({
      messages,
      isOpen,
      isRecording,
      open,
      close,
      toggle,
      sendMessage,
      addAudioMessage,
      addFileMessage,
      setRecordingState,
      clearMessages,
    }),
    [
      messages,
      isOpen,
      isRecording,
      open,
      close,
      toggle,
      sendMessage,
      addAudioMessage,
      addFileMessage,
      setRecordingState,
      clearMessages,
    ]
  );

  return (
    <AssistantContext.Provider value={value}>
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant(): AssistantContextValue {
  const ctx = useContext(AssistantContext);
  if (!ctx) {
    throw new Error("useAssistant debe usarse dentro de <AssistantProvider>");
  }
  return ctx;
}

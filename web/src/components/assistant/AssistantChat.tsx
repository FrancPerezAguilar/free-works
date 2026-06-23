import { useEffect, useRef, useState, type FormEvent, type ChangeEvent } from "react";
import {
  File as FileIcon,
  Paperclip,
  Send,
  User as UserIcon,
  Bot,
} from "lucide-react";
import { useAssistant, type Message } from "./AssistantContext";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const isAudio = message.type === "audio";
  const isFile = message.type === "file";

  const baseBubble = "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm break-words";
  const userBubble = "bg-blue-600 text-white rounded-br-md";
  const assistantBubble = "bg-gray-100 text-gray-900 rounded-bl-md";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} gap-2`}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <div className={`${baseBubble} ${isUser ? userBubble : assistantBubble}`}>
          {isAudio && (
            <div className="flex items-center gap-2">
              <span className="text-base" aria-hidden>🎤</span>
              <span className="text-xs font-medium uppercase tracking-wide opacity-90">
                Audio
              </span>
              {message.fileSize !== undefined && (
                <span className="text-xs opacity-75">
                  · {formatBytes(message.fileSize)}
                </span>
              )}
            </div>
          )}

          {isFile && (
            <div className="flex items-center gap-2">
              <FileIcon className="h-4 w-4" />
              <span className="text-sm font-medium underline">
                {message.fileName || "archivo"}
              </span>
              {message.fileSize !== undefined && (
                <span className="text-xs opacity-75">
                  · {formatBytes(message.fileSize)}
                </span>
              )}
            </div>
          )}

          {!isAudio && !isFile && (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}

          {message.pending && (
            <span className="mt-1 inline-flex items-center gap-1 text-xs opacity-70">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
            </span>
          )}
        </div>

        <span className={`text-[10px] text-gray-400 ${isUser ? "text-right" : "text-left"}`}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
          <UserIcon className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

export function AssistantChat() {
  const {
    messages,
    sendMessage,
    addFileMessage,
    isRecording,
  } = useAssistant();

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isSending) return;

    setInput("");
    setIsSending(true);
    try {
      await sendMessage(text);
    } finally {
      setIsSending(false);
    }
  }

  function handleAttachClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // permite re-seleccionar el mismo archivo
    await addFileMessage(file);
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Lista de mensajes */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
            <Bot className="mb-3 h-10 w-10 opacity-40" />
            <p className="text-sm font-medium">¡Hola! Soy tu asistente</p>
            <p className="mt-1 max-w-xs text-xs">
              Escribe un mensaje, adjunta un archivo o mantén pulsado el botón
              de micrófono para enviar un audio.
            </p>
          </div>
        ) : (
          messages.map((m) => <ChatBubble key={m.id} message={m} />)
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t bg-white px-3 py-3 flex items-center gap-2"
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          type="button"
          onClick={handleAttachClick}
          disabled={isRecording}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors disabled:opacity-40"
          aria-label="Adjuntar archivo"
          title="Adjuntar archivo"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isRecording ? "Grabando audio..." : "Escribe un mensaje..."}
          disabled={isRecording}
          className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm focus:border-blue-500 focus:bg-white focus:outline-none disabled:opacity-60"
        />

        <button
          type="submit"
          disabled={!input.trim() || isSending || isRecording}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition-all hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Enviar mensaje"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

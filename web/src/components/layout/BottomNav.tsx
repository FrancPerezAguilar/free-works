import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { MessageCircle, Mic, LayoutDashboard, Wrench, Users } from "lucide-react";
import { MOBILE_NAV_ITEMS } from "@/lib/constants";
import { useAssistant } from "@/components/assistant/AssistantContext";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Wrench,
  Users,
};

const LONG_PRESS_MS = 500;

export function BottomNav() {
  const { open, isRecording, setRecordingState, addAudioMessage } = useAssistant();
  const longPressTimer = useRef<number | null>(null);
  const pressStart = useRef<number | null>(null);
  const didLongPress = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  // Cleanup en unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current !== null) {
        window.clearTimeout(longPressTimer.current);
      }
      if (mediaRecorderRef.current &&
          mediaRecorderRef.current.state !== "inactive") {
        try { mediaRecorderRef.current.stop(); } catch { /* noop */ }
      }
    };
  }, []);

  function clearTimer() {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  async function startRecording() {
    // Si MediaRecorder no está disponible, simulamos igualmente
    if (typeof navigator === "undefined" ||
        !navigator.mediaDevices?.getUserMedia) {
      // No-op silencioso: marcamos recording de todos modos para feedback visual
      setRecordingState(true);
      return;
    }

    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      mr.onstop = () => {
        // Detener todas las pistas del stream
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, {
          type: mr.mimeType || "audio/webm",
        });
        const ext = (mr.mimeType || "audio/webm").split("/")[1]?.split(";")[0] || "webm";
        audioChunksRef.current = [];
        mediaRecorderRef.current = null;
        if (blob.size > 0) {
          void addAudioMessage(blob, `grabacion.${ext}`);
        }
      };

      mr.start();
      setRecordingState(true);
    } catch (err) {
      // Permiso denegado o error: feedback visual sin audio real
      console.warn("No se pudo iniciar la grabación:", err);
      setRecordingState(true);
    }
  }

  function stopRecording() {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      try { mr.stop(); } catch { /* noop */ }
    }
    setRecordingState(false);
  }

  // ── Handlers del FAB ────────────────────────────────────────────────
  function handlePressStart(e: React.MouseEvent | React.TouchEvent) {
    // Evitar que el click sintético dispare open() después
    e.preventDefault();
    didLongPress.current = false;
    pressStart.current = Date.now();

    longPressTimer.current = window.setTimeout(() => {
      didLongPress.current = true;
      void startRecording();
    }, LONG_PRESS_MS);
  }

  function handlePressEnd() {
    clearTimer();
    const wasLong = didLongPress.current;
    didLongPress.current = false;
    pressStart.current = null;

    if (wasLong) {
      // Terminó la grabación
      stopRecording();
    } else {
      // Tap corto → abrir modal
      open();
    }
  }

  function handlePressCancel() {
    clearTimer();
    if (didLongPress.current) {
      stopRecording();
    }
    didLongPress.current = false;
    pressStart.current = null;
    setRecordingState(false);
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t z-40 flex items-stretch"
      role="navigation"
    >
      {/* Items a la izquierda (flex-1 cada uno para distribuir) */}
      <div className="flex flex-1 items-stretch">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                  isActive
                    ? "text-blue-700 font-medium"
                    : "text-gray-500"
                }`
              }
            >
              {Icon && <Icon className="h-5 w-5" />}
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Slot del FAB: ocupa el espacio del 4º item para mantener alineación */}
      <div className="w-16 shrink-0" />

      {/* FAB elevado por encima del navbar */}
      <button
        type="button"
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressCancel}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onTouchCancel={handlePressCancel}
        onContextMenu={(e) => e.preventDefault()}
        aria-label={isRecording ? "Grabando audio... suelta para enviar" : "Abrir asistente (mantén pulsado para grabar audio)"}
        aria-pressed={isRecording}
        className={`fixed bottom-12 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-all duration-200 md:hidden ${
          isRecording
            ? "bg-red-600 scale-110 animate-pulse ring-4 ring-red-300/50"
            : "bg-blue-600 hover:bg-blue-700 active:scale-95"
        }`}
      >
        {isRecording ? (
          <Mic className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>
    </nav>
  );
}

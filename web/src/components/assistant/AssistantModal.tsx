import { useEffect, useState } from "react";
import { XCircle } from "lucide-react";
import { useAssistant } from "./AssistantContext";
import { AssistantChat } from "./AssistantChat";

/**
 * Modal full-screen que sube desde abajo con animación.
 * Se monta solo cuando isOpen === true para poder animar entrada/salida.
 */
export function AssistantModal() {
  const { isOpen, close } = useAssistant();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  // Controlar ciclo de montaje + animación
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      // pequeño delay para que la transición CSS se dispare
      const t = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(t);
    } else if (mounted) {
      setVisible(false);
      // esperar a que termine la animación de salida antes de desmontar
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen, mounted]);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ease-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      aria-modal="true"
      role="dialog"
    >
      {/* Fondo semitransparente */}
      <div
        onClick={close}
        className="absolute inset-0 bg-black/50"
        aria-hidden="true"
      />

      {/* Panel que sube desde abajo */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute inset-0 flex flex-col bg-white shadow-xl transition-transform duration-300 ease-out ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Header */}
        <header className="flex h-12 shrink-0 items-center justify-between border-b bg-white px-4">
          <h2 className="text-sm font-semibold text-gray-900">Asistente</h2>
          <button
            type="button"
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label="Cerrar asistente"
            title="Cerrar"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </header>

        {/* Contenido */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <AssistantChat />
        </div>
      </div>
    </div>
  );
}

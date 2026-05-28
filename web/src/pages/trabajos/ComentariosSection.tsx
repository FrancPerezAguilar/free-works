import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addComentario } from "@/api/trabajos";
import { Send, User } from "lucide-react";

interface Props {
  trabajoId: number;
  items?: Array<{
    id: number;
    autor: string;
    contenido: string;
    fecha_creacion: string;
  }>;
}

export function ComentariosSection({ trabajoId, items = [] }: Props) {
  const queryClient = useQueryClient();
  const [contenido, setContenido] = useState("");

  const mutation = useMutation({
    mutationFn: () => addComentario(trabajoId, { contenido }),
    onSuccess: () => {
      setContenido("");
      queryClient.invalidateQueries({ queryKey: ["trabajo", trabajoId] });
    },
  });

  return (
    <div>
      {/* Comment list */}
      {items.length === 0 ? (
        <p className="text-gray-500 text-sm py-4">Sin comentarios</p>
      ) : (
        <div className="space-y-3 mb-4">
          {[...items]
            .sort(
              (a, b) =>
                new Date(b.fecha_creacion).getTime() -
                new Date(a.fecha_creacion).getTime(),
            )
            .map((c) => (
              <div key={c.id} className="flex gap-3 p-3 border rounded-md bg-white">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{c.autor}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(c.fecha_creacion).toLocaleString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                    {c.contenido}
                  </p>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Add comment */}
      <div className="flex gap-2">
        <input
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Escribe un comentario..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && contenido.trim()) {
              e.preventDefault();
              mutation.mutate();
            }
          }}
        />
        <button
          onClick={() => mutation.mutate()}
          disabled={!contenido.trim() || mutation.isPending}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

import { useState, useRef } from "react";
import type { Adjunto } from "@/types/trabajo";
import {
  Paperclip,
  Image,
  FileText,
  Mic,
  File,
  X,
  Download,
  Calendar,
  User,
} from "lucide-react";

interface Props {
  adjuntos?: Adjunto[];
}

const TIPO_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  foto: Image,
  pdf: FileText,
  audio: Mic,
  documento: File,
};

const TIPO_LABEL: Record<string, string> = {
  foto: "Foto",
  pdf: "PDF",
  audio: "Nota de voz",
  documento: "Documento",
};

export function AdjuntosSection({ adjuntos = [] }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [descripcion, setDescripcion] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Por ahora mostramos el archivo como pendiente de subida
    // TODO: implementar upload real al backend
    const nuevo: Adjunto = {
      tipo: file.type.startsWith("image")
        ? "foto"
        : file.type === "application/pdf"
          ? "pdf"
          : file.type.startsWith("audio")
            ? "audio"
            : "documento",
      nombre: file.name,
      descripcion: descripcion || undefined,
      fecha: new Date().toISOString(),
      subido_por: "Franc",
    };
    // eslint-disable-next-line no-console
    console.log("Archivo seleccionado:", nuevo);
    setDescripcion("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">
          Archivos adjuntos
        </h3>
        <span className="text-xs text-gray-400">{adjuntos.length} archivos</span>
      </div>

      {/* Lista de adjuntos */}
      {adjuntos.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm italic">Sin archivos adjuntos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {adjuntos.map((adj, idx) => {
            const Icon = TIPO_ICON[adj.tipo] || File;
            return (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="p-2 bg-white rounded-md shadow-sm">
                  <Icon className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{adj.nombre}</p>
                  {adj.descripcion && (
                    <p className="text-xs text-gray-500 truncate">
                      {adj.descripcion}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {adj.fecha
                        ? new Date(adj.fecha).toLocaleDateString("es-ES")
                        : "-"}
                    </span>
                    {adj.subido_por && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {adj.subido_por}
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">
                      {TIPO_LABEL[adj.tipo] || adj.tipo}
                    </span>
                  </div>
                </div>
                {adj.url && (
                  <a
                    href={adj.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Descargar"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Subir archivo */}
      <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs text-gray-500 mb-1">
              Descripción (opcional)
            </label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Foto del cuadro antes de reparar"
              className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer flex items-center gap-2 border"
            >
              <Paperclip className="h-4 w-4" />
              Seleccionar archivo
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Formatos: imágenes, PDF, audio. Tamaño máx: 50MB
        </p>
      </div>
    </div>
  );
}

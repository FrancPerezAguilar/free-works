import { AlertCircle } from "lucide-react";

interface Props {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = "Error al cargar los datos", onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-red-600">Error</h3>
      <p className="text-sm text-gray-500 mt-1 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50 cursor-pointer"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

import { Inbox } from "lucide-react";

interface Props {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  title = "No hay datos",
  description = "No se encontraron registros.",
  action,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Inbox className="h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-gray-500 mt-1 mb-4">{description}</p>
      {action}
    </div>
  );
}

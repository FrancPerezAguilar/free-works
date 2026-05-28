import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  estado: string;
  mapping: Record<string, { label: string; color: string }>;
}

export function StatusBadge({ estado, mapping }: Props) {
  const info = mapping[estado];
  if (!info) return <Badge className="bg-gray-100 text-gray-800">{estado}</Badge>;

  return (
    <Badge className={cn("font-medium", info.color)}>
      {info.label}
    </Badge>
  );
}

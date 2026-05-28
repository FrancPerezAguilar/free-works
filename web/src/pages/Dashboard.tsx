import { useQuery } from "@tanstack/react-query";
import { getTrabajos } from "@/api/trabajos";
import { getClientes } from "@/api/clientes";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/LoadingState";
import { Wrench, Users, Receipt, Calendar } from "lucide-react";

export default function Dashboard() {
  const { data: trabajos, isLoading: loadingT } = useQuery({
    queryKey: ["trabajos", "pendientes"],
    queryFn: () => getTrabajos({ estado: "pendiente" }),
  });

  const { data: clientes, isLoading: loadingC } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => getClientes(),
  });

  const stats = [
    {
      label: "Trabajos pendientes",
      value: trabajos?.length ?? 0,
      icon: Wrench,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Clientes activos",
      value: clientes?.length ?? 0,
      icon: Users,
      color: "text-green-600 bg-green-50",
    },
    {
      label: "En curso",
      value: trabajos?.filter((t) => t.estado === "en_curso").length ?? 0,
      icon: Calendar,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Facturas pendientes",
      value: "-",
      icon: Receipt,
      color: "text-purple-600 bg-purple-50",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {loadingT || loadingC ? (
        <LoadingState rows={2} />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <Card key={s.label}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${s.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{s.value}</p>
                      <p className="text-xs text-gray-500">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Trabajos pendientes</h2>
            </CardHeader>
            <CardContent>
              {trabajos && trabajos.length > 0 ? (
                <div className="space-y-2">
                  {trabajos.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{t.titulo}</p>
                        <p className="text-sm text-gray-500">{t.cliente_nombre}</p>
                      </div>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        Pendiente
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No hay trabajos pendientes</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

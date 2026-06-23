export const ESTADOS_TRABAJO = {
  pendiente:  { label: "Pendiente",   color: "bg-yellow-100 text-yellow-800" },
  en_curso:   { label: "En curso",    color: "bg-blue-100 text-blue-800" },
  completado: { label: "Completado",  color: "bg-green-100 text-green-800" },
  cancelado:  { label: "Cancelado",   color: "bg-red-100 text-red-800" },
} as const;

export const ESTADOS_PAGO = {
  pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
  pagada:    { label: "Pagada",    color: "bg-green-100 text-green-800" },
  vencida:   { label: "Vencida",   color: "bg-red-100 text-red-800" },
  cobrada:   { label: "Cobrada",   color: "bg-gray-100 text-gray-800" },
} as const;

export const ESTADOS_PRESUPUESTO = {
  borrador:  { label: "Borrador",  color: "bg-gray-100 text-gray-800" },
  pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
  aceptado:  { label: "Aceptado",  color: "bg-green-100 text-green-800" },
  rechazado: { label: "Rechazado", color: "bg-red-100 text-red-800" },
  vencido:   { label: "Vencido",   color: "bg-orange-100 text-orange-800" },
} as const;

export const ESTADOS_OPORTUNIDAD = {
  abierta:          { label: "Abierta",          color: "bg-blue-100 text-blue-800" },
  en_negociacion:   { label: "En negociación",   color: "bg-purple-100 text-purple-800" },
  cerrada_ganada:   { label: "Ganada",           color: "bg-green-100 text-green-800" },
  cerrada_perdida:  { label: "Perdida",          color: "bg-red-100 text-red-800" },
} as const;

export type EstadoTrabajo = keyof typeof ESTADOS_TRABAJO;
export type EstadoPago = keyof typeof ESTADOS_PAGO;
export type EstadoPresupuesto = keyof typeof ESTADOS_PRESUPUESTO;
export type EstadoOportunidad = keyof typeof ESTADOS_OPORTUNIDAD;

export const SIDEBAR_ITEMS = [
  { icon: "LayoutDashboard", label: "Dashboard",   path: "/" },
  { icon: "Users",           label: "Clientes",    path: "/clientes" },
  { icon: "Wrench",          label: "Trabajos",    path: "/trabajos" },
  { icon: "FileText",        label: "Presupuestos",path: "/presupuestos" },
  { icon: "Receipt",         label: "Facturas",    path: "/facturas" },
  { icon: "Target",          label: "Oportunidades",path: "/oportunidades" },
  { icon: "Package",         label: "Materiales",  path: "/materiales" },
  { icon: "Calendar",        label: "Calendario",  path: "/calendario" },
] as const;

export const MOBILE_NAV_ITEMS = [
  { icon: "LayoutDashboard", label: "Inicio",   path: "/" },
  { icon: "Wrench",          label: "Trabajos", path: "/trabajos" },
  { icon: "Users",           label: "Clientes", path: "/clientes" },
] as const;

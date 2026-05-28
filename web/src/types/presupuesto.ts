export interface LineaPresupuesto {
  id: number;
  presupuesto_id: number;
  descripcion: string;
  cantidad: number;
  unidad: string;
  precio_unitario: number;
  importe: number;
}

export interface Presupuesto {
  id: number;
  titulo: string;
  descripcion: string | null;
  cliente_id: number | null;
  cliente_nombre: string | null;
  estado: "borrador" | "pendiente" | "aceptado" | "rechazado" | "vencido";
  validez_dias: number;
  base_imponible: number;
  iva: number;
  tipo_iva: number;
  retencion_irpf: number;
  total: number;
  condiciones_pago: string | null;
  notas: string | null;
  activo: boolean;
  fecha_creacion: string;
  fecha_modificacion: string | null;
  lineas?: LineaPresupuesto[];
}

export interface PresupuestoCreate {
  titulo: string;
  descripcion?: string;
  cliente_id?: number;
  cliente_nombre?: string;
  estado?: string;
  validez_dias?: number;
  base_imponible?: number;
  iva?: number;
  tipo_iva?: number;
  retencion_irpf?: number;
  total?: number;
  condiciones_pago?: string;
  notas?: string;
}

export interface LineaCreate {
  descripcion: string;
  cantidad?: number;
  unidad?: string;
  precio_unitario?: number;
  importe?: number;
}

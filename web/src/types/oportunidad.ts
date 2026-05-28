export interface Oportunidad {
  id: number;
  titulo: string;
  descripcion: string | null;
  cliente_id: number | null;
  cliente_nombre: string | null;
  estado: "abierta" | "en_negociacion" | "cerrada_ganada" | "cerrada_perdida";
  origen: string | null;
  probabilidad_cierre: number;
  presupuesto_estimado: number;
  fecha_contacto: string | null;
  fecha_cierre_estimada: string | null;
  notas_seguimiento: string | null;
  activo: boolean;
  fecha_creacion: string;
  fecha_modificacion?: string;
}

export interface OportunidadCreate {
  titulo: string;
  descripcion?: string;
  cliente_id?: number;
  cliente_nombre?: string;
  estado?: string;
  origen?: string;
  probabilidad_cierre?: number;
  presupuesto_estimado?: number;
  fecha_contacto?: string;
  fecha_cierre_estimada?: string;
  notas_seguimiento?: string;
}

export interface Trabajo {
  id: number;
  uuid?: string;
  codigo_trabajo?: string | null;
  titulo: string;
  descripcion: string | null;
  cliente_id: number | null;
  cliente_nombre: string | null;
  holded_cliente_id?: string | null;
  oportunidad_id?: number | null;
  presupuesto_id?: number | null;
  factura_id?: number | null;
  obra_calle?: string | null;
  obra_numero?: string | null;
  obra_piso_puerta?: string | null;
  obra_codigo_postal?: string | null;
  obra_municipio: string | null;
  obra_provincia: string | null;
  obra_notas_acceso?: string | null;
  fecha_inicio: string | null;
  fecha_fin_estimada: string | null;
  fecha_fin_real?: string | null;
  estado: "pendiente" | "en_curso" | "completado" | "cancelado";
  prioridad: string;
  total_horas?: number;
  coste_materiales?: number;
  coste_mano_obra?: number;
  coste_total?: number;
  activo: boolean;
  fecha_creacion: string;
  fecha_modificacion?: string;
  checklist?: ChecklistItem[];
  tiempos?: RegistroTiempo[];
  materiales?: MaterialUsado[];
  comentarios?: Comentario[];
  tecnicos_asignados?: TecnicoAsignado[];
  adjuntos?: Adjunto[];
}

export interface ChecklistItem {
  id: number;
  trabajo_id: number;
  uuid?: string;
  descripcion: string;
  completada: boolean;
  fecha_programada: string | null;
  hora_programada: string | null;
  fecha_completada?: string | null;
  notas?: string | null;
}

export interface RegistroTiempo {
  id: number;
  trabajo_id: number;
  uuid?: string;
  fecha: string;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  horas: number;
  descripcion: string | null;
  tecnico_nombre?: string | null;
}

export interface MaterialUsado {
  id: number;
  trabajo_id: number;
  material_id?: number | null;
  material_nombre?: string;
  cantidad: number;
  unidad?: string;
  precio_unitario?: number;
  subtotal?: number;
  notas?: string | null;
  holded_id?: string | null;
}

export interface Comentario {
  id: number;
  uuid?: string;
  entity_type?: string;
  entity_id?: number;
  trabajo_id?: number;
  autor: string;
  contenido: string;
  fecha_creacion: string;
}

export interface TecnicoAsignado {
  id?: number;
  nombre: string;
  horas: number;
  especialidad?: string;
}

export interface Adjunto {
  id?: number;
  tipo: "foto" | "pdf" | "audio" | "documento";
  nombre: string;
  ruta?: string;
  descripcion?: string;
  fecha?: string;
  subido_por?: string;
  url?: string;
}

export interface TrabajoCreate {
  titulo: string;
  descripcion?: string;
  cliente_id?: number;
  cliente_nombre?: string;
  estado?: string;
  prioridad?: string;
  obra_calle?: string;
  obra_numero?: string;
  obra_municipio?: string;
  obra_provincia?: string;
  fecha_inicio?: string;
  fecha_fin_estimada?: string;
  tecnicos_asignados?: { nombre: string; horas: number }[];
}

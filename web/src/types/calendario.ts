export interface EventoCalendario {
  id: number;
  titulo: string;
  descripcion: string | null;
  fecha_evento: string;
  hora_evento: string | null;
  hora_fin: string | null;
  duracion_min: number;
  entidad_tipo: string | null;
  entidad_nombre: string | null;
  entidad_id: number | null;
  cliente_nombre: string | null;
  cliente_id: number | null;
  ubicacion: string | null;
  estado: string;
  color: string;
  notas: string | null;
  fecha_creacion: string;
}

export interface EventoCreate {
  titulo: string;
  descripcion?: string;
  fecha_evento: string;
  hora_evento?: string;
  hora_fin?: string;
  duracion_min?: number;
  entidad_tipo?: string;
  entidad_nombre?: string;
  entidad_id?: number;
  cliente_nombre?: string;
  cliente_id?: number;
  ubicacion?: string;
  estado?: string;
  color?: string;
  notas?: string;
}

export interface Material {
  id: number;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  precio_unitario: number;
  unidad_medida: string;
  fabricante: string | null;
  activo: boolean;
  fecha_creacion: string;
  fecha_modificacion?: string;
}

export interface MaterialCreate {
  nombre: string;
  descripcion?: string;
  categoria?: string;
  precio_unitario?: number;
  unidad_medida?: string;
  fabricante?: string;
}

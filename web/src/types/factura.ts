export interface LineaFactura {
  id: number;
  factura_id: number;
  descripcion: string;
  cantidad: number;
  unidad: string;
  precio_unitario: number;
  importe: number;
}

export interface Factura {
  id: number;
  tipo: string;
  cliente_id: number | null;
  cliente_nombre: string | null;
  nif_cif_cliente: string | null;
  trabajo_id: number | null;
  presupuesto_id: number | null;
  fecha_emision: string | null;
  fecha_vencimiento: string | null;
  base_imponible: number;
  iva: number;
  tipo_iva: number;
  retencion_irpf: number;
  total: number;
  estado_pago: 'pendiente' | 'pagada' | 'vencida' | 'cobrada';
  forma_pago: string | null;
  datos_bancarios_iban: string | null;
  datos_bancarios_titular: string | null;
  regimen_iva: string | null;
  factura_direccion_calle: string | null;
  factura_direccion_numero: string | null;
  factura_direccion_codigo_postal: string | null;
  factura_direccion_municipio: string | null;
  factura_direccion_provincia: string | null;
  activo: boolean;
  fecha_creacion: string;
  lineas?: LineaFactura[];
}

export interface FacturaCreate {
  tipo?: string;
  cliente_id?: number;
  cliente_nombre?: string;
  nif_cif_cliente?: string;
  trabajo_id?: number;
  presupuesto_id?: number;
  fecha_emision?: string;
  fecha_vencimiento?: string;
  base_imponible?: number;
  iva?: number;
  tipo_iva?: number;
  retencion_irpf?: number;
  total?: number;
  estado_pago?: string;
  forma_pago?: string;
  datos_bancarios_iban?: string;
  datos_bancarios_titular?: string;
  regimen_iva?: string;
  factura_direccion_calle?: string;
  factura_direccion_numero?: string;
  factura_direccion_codigo_postal?: string;
  factura_direccion_municipio?: string;
  factura_direccion_provincia?: string;
}

export interface LineaFacturaCreate {
  descripcion: string;
  cantidad?: number;
  unidad?: string;
  precio_unitario?: number;
  importe?: number;
}

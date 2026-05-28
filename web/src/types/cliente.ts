export interface Cliente {
  id: number;
  uuid?: string;
  codigo_cliente?: string | null;
  tipo_cliente?: string;
  nombre: string;
  apellidos: string | null;
  nif_cif: string | null;
  documento_identidad?: string | null;
  telefono_principal: string | null;
  telefono_secundario?: string | null;
  email: string | null;
  whatsapp?: boolean;
  contacto_preferido?: string;
  horario_contacto?: string | null;
  direccion_calle: string | null;
  direccion_numero: string | null;
  direccion_piso_puerta?: string | null;
  direccion_codigo_postal: string | null;
  direccion_municipio: string | null;
  direccion_provincia: string | null;
  direccion_comunidad?: string | null;
  direccion_pais?: string;
  regimen_iva?: string;
  tipo_iva_aplicable?: number;
  retencion_irpf?: number;
  forma_pago_preferida?: string;
  datos_bancarios_iban?: string | null;
  condiciones_pago_plazo_dias?: number;
  notas_internas?: string | null;
  estado?: string;
  active: boolean;
  fecha_creacion: string;
  fecha_modificacion?: string;
}

export interface ClienteCreate {
  nombre: string;
  apellidos?: string;
  nif_cif?: string;
  tipo_cliente?: string;
  telefono_principal?: string;
  email?: string;
  direccion_calle?: string;
  direccion_numero?: string;
  direccion_municipio?: string;
  direccion_provincia?: string;
  direccion_codigo_postal?: string;
}

export interface ClienteUpdate extends Partial<ClienteCreate> {
  active?: boolean;
}

# Prompt para Definición de Entidad CLIENTE

## Instrucciones de Uso

Copia el bloque `## Prompt` y pégalo directamente a una IA generadora de esquemas de datos. El resultado esperado es una definición completa de la entidad `Cliente` en formato YAML, lista para integrar en una plataforma AI-first orientada a autónomos del sector servicios (electricistas, fontaneros, carpinteros) en España.

---

## Prompt

```
Eres un arquitecto de datos especializado en plataformas SaaS para autónomos del sector servicios en España. Tu tarea es generar la definición completa de la entidad CLIENTE en formato YAML, optimizada para PostgreSQL como base de datos y Hermes Agent + DeepSeek V4 como stack de IA.

## Contexto de la Plataforma

Plataforma AI-first para gestión integral de autónomos electricistas, fontaneros y carpinteros en España. La entidad Cliente es central: cada cliente puede tener múltiples trabajos, presupuestos, facturas y comunicaciones asociadas. La IA debe poder extraer, inferir y sugerir datos del cliente a partir de conversaciones naturales, documentos escaneados y formularios.

## Requisitos de la Entidad

### 1. Propósito

La entidad Cliente almacena toda la información necesaria para:
- Identificar unívocamente al cliente (persona física o jurídica).
- Cumplir con la normativa fiscal española (Ley 58/2003 General Tributaria, Real Decreto 1619/2012 de facturación).
- Facilitar la comunicación y el seguimiento de trabajos.
- Permitir la automatización de tareas por IA (generación de facturas, seguimiento de cobros, recordatorios).

### 2. Campos Obligatorios

Define cada campo con la siguiente estructura YAML:

```yaml
campo:
  tipo: string | integer | boolean | date | datetime | enum | array | object | decimal
  requerido: true | false
  unico: true | false
  descripcion: "..."
  validacion: "regex o regla de negocio"
  ejemplo: "..."
  notas: "..."
```

#### 2.1. Identificación

- `id`: UUID v4, clave primaria, generado automáticamente.
- `tipo_cliente`: enum (`persona_fisica`, `persona_juridica`). Determina qué campos son obligatorios.
- `nombre`: string, requerido. Nombre completo (persona física) o razón social (persona jurídica). Máx 200 caracteres.
- `apellidos`: string, requerido solo si `tipo_cliente = persona_fisica`. Máx 200 caracteres.
- `nif_cif`: string, requerido, único. NIF para personas físicas, CIF para jurídicas. Validación: formato español (8 dígitos + letra para NIF, letra + 7 dígitos + dígito de control para CIF). Debe incluir validación de dígito de control.
- `documento_identidad`: string, opcional. Tipo de documento alternativo para extranjeros (NIE, pasaporte, etc.).
- `foto_avatar`: string (URL), opcional. Imagen de perfil del cliente.

#### 2.2. Contacto

- `telefono_principal`: string, requerido. Formato español: 9 dígitos, puede incluir prefijo +34. Validación regex.
- `telefono_secundario`: string, opcional. Mismo formato.
- `email`: string, requerido, único. Validación de formato email estándar. Máx 254 caracteres (RFC 5321).
- `whatsapp`: boolean, default false. Indica si el teléfono principal tiene WhatsApp activo.
- `contacto_preferido`: enum (`telefono`, `email`, `whatsapp`, `sms`), default `telefono`.
- `horario_contacto`: string, opcional. Ejemplo: "L-V 9:00-14:00, 16:00-20:00". La IA debe poder parsear esto para sugerir horarios de llamada.

#### 2.3. Dirección

- `direccion`: object, requerido. Subcampos:
  - `calle`: string, requerido. Máx 300 caracteres.
  - `numero`: string, requerido. Incluye bis, puerta, escalera, etc.
  - `piso_puerta`: string, opcional. Ej: "3ºB", "Ático A".
  - `codigo_postal`: string, requerido. 5 dígitos españoles. Validación: 01000-52999.
  - `municipio`: string, requerido. Máx 150 caracteres.
  - `provincia`: string, requerido. Debe corresponderse con el código postal.
  - `comunidad_autonoma`: string, calculado a partir de la provincia. Útil para retenciones IRPF autonómicas.
  - `pais`: string, default "España".
  - `latitud`: decimal(10,8), opcional. Para geolocalización y optimización de rutas.
  - `longitud`: decimal(11,8), opcional.
  - `notas_direccion`: string, opcional. Ej: "Portero automático #4532", "Casa azul junto al supermercado".
- `direcciones_alternativas`: array de objects, opcional. Para clientes con múltiples ubicaciones de trabajo (oficinas, segundas residencias, etc.). Cada elemento repite la estructura de `direccion` más un campo `alias` (string) y `tipo` enum (`trabajo`, `domicilio`, `segunda_residencia`, `otro`).

#### 2.4. Datos Fiscales

- `regimen_iva`: enum (`general`, `recargo_equivalencia`, `exento`), default `general`. Determina cómo se aplica el IVA en facturas.
- `tipo_iva_aplicable`: decimal(4,2), default 21.00. Override manual si el cliente tiene condiciones especiales. Validación: valores permitidos 0, 4, 5, 10, 21 (tipos vigentes en España).
- `retencion_irpf`: decimal(4,2), default 15.00. Aplicable si el profesional emite factura con retención. Valores permitidos: 0, 7, 15, 19, 21, 24, 26 (según normativa vigente y circunstancias del profesional).
- `exento_iva_motivo`: string, opcional. Requerido si `regimen_iva = exento`. Referencia al artículo de la LIVA aplicable (ej: "Art. 20.Uno.3º LIVA - Servicios médicos").
- `forma_pago_preferida`: enum (`transferencia`, `domiciliacion`, `tarjeta`, `efectivo`, `bizum`, `paypal`, `otro`), default `transferencia`.
- `datos_bancarios`: object, opcional:
  - `iban`: string. Validación: formato IBAN español (ES + 22 dígitos) o europeo. Máscara en consultas (solo mostrar 4 últimos dígitos).
  - `swift_bic`: string, opcional. 8 u 11 caracteres alfanuméricos.
  - `titular`: string, opcional. Nombre del titular de la cuenta.
  - `mandato_sepa`: object, opcional. Para domiciliaciones:
    - `referencia_mandato`: string, formato ISO 11649.
    - `fecha_firma`: date.
    - `fecha_primera_cobro`: date, opcional.
    - `estado`: enum (`pendiente`, `firmado`, `rechazado`, `cancelado`).
- `condiciones_pago`: object:
  - `plazo_dias`: integer, default 30. Días de pago desde emisión de factura.
  - `descuento_pp`: decimal(4,2), default 0. Descuento por pronto pago (%).
  - `recargo_demora`: decimal(4,2), default 0. Interés de demora (% mensual). Base legal: Ley 3/2004 de lucha contra la morosidad.

#### 2.5. Relaciones Internas

- `trabajos_asociados`: array de references (UUID), calculado/relacionado. No se almacena directamente en la tabla cliente, se resuelve por foreign key desde la tabla `Trabajo`.
- `presupuestos_asociados`: array de references (UUID), calculado/relacionado. Igual que anterior.
- `facturas_asociadas`: array de references (UUID), calculado/relacionado.
- `total_facturado`: decimal(12,2), calculado. Suma de importes de facturas emitidas (campo materializado, actualizado por trigger o job).
- `total_pendiente_cobro`: decimal(12,2), calculado. Suma de importes de facturas no cobradas.
- `ultima_factura_fecha`: date, calculado.
- `ultimo_trabajo_fecha`: date, calculado.
- `frecuencia_contratacion`: string, calculado por IA. Ej: "Cada 6 meses", "Puntual". Inferido del historial.

#### 2.6. Historial y Comunicación

- `historial_comunicaciones`: tabla relacionada (1:N), no campo inline. Cada registro:
  - `id`: UUID.
  - `cliente_id`: UUID, FK.
  - `tipo`: enum (`llamada`, `email`, `whatsapp`, `sms`, `visita`, `nota_interna`).
  - `fecha`: datetime.
  - `resumen`: text. Generado por IA a partir del contenido.
  - `contenido_raw`: text, opcional. Transcripción o texto original.
  - `generado_por_ia`: boolean, default false.
  - `autor`: string. Nombre del autónomo o "sistema_ia".

- `notas_internas`: text, opcional. Notas privadas del autónomo sobre el cliente. Ej: "Prefiere cita por la mañana", "Tiene perro grande".
- `etiquetas`: array de strings, opcional. Tags para segmentación. Ej: ["recomendado", "villa", "urgente", "empresa"].
- `origen_cliente`: enum (`referido`, `google`, `redes_sociales`, `pagina_web`, `boca_a_boca`, `publicidad`, `feria`, `otro`, `desconocido`), default `desconocido`.
- `cliente_referido_por`: UUID, opcional. FK a otro cliente. Para programas de referidos.

#### 2.7. Metadatos de Plataforma

- `fecha_creacion`: datetime, auto. Timestamp de alta.
- `fecha_modificacion`: datetime, auto. Última actualización.
- `creado_por`: UUID, FK a usuario/autónomo.
- `modificado_por`: UUID, FK a usuario/autónomo.
- `estado`: enum (`activo`, `inactivo`, `bloqueado`, `pendiente_validacion`), default `activo`.
- `motivo_bloqueado`: string, opcional. Requerido si `estado = bloqueado`.
- `visibilidad`: enum (`privado`, `equipo`), default `privado`. Para plataformas multi-usuario.
- `consentimiento_rgpd`: object:
  - `aceptado`: boolean, requerido, default false. DEBE ser true antes de guardar datos personales.
  - `fecha_aceptacion`: datetime, requerido si `aceptado = true`.
  - `version_politica`: string. Versión de la política de privacidad aceptada.
  - `finalidades`: array de enum (`facturacion`, `comunicacion_comercial`, `analisis`, `cesion_terceros`).
  - `consentimiento_comunicaciones_comerciales`: boolean, default false. Separado del general (LSSI-CE).
- `fuentes_datos`: array de strings, opcional. Origen de cada dato: ["manual", "ocr_factura", "conversacion_ia", "importacion_csv"]. Útil para trazabilidad.
- `score_cliente`: integer (0-100), calculado por IA. Basado en: frecuencia de contratación, volumen de facturación, puntualidad de pagos, satisfacción (si disponible).
- `riesgo_impago`: enum (`bajo`, `medio`, `alto`), calculado por IA. Basado en historial de pagos.

### 3. Validaciones de Negocio

1. **NIF/CIF único**: No puede haber dos clientes con el mismo NIF/CIF en la misma cuenta de autónomo.
2. **Email único**: Idem para email.
3. **Coherencia CP-Provincia**: El código postal debe corresponderse con la provincia declarada. Validar contra tabla de referencia oficial.
4. **IBAN válido**: Si se proporciona, debe pasar validación de dígito de control (algoritmo MOD 97, ISO 7064).
5. **RGPD**: No se puede guardar ningún dato personal si `consentimiento_rgpd.aceptado = false`. La IA debe bloquear el guardado y solicitar consentimiento.
6. **Exento IVA**: Si `regimen_iva = exento`, el campo `exento_iva_motivo` es obligatorio.
7. **Datos bancarios enmascarados**: En respuestas de la API, el IBAN debe mostrarse parcialmente enmascarado (**** **** **** 1234) salvo para el propio autónomo en contexto de edición.
8. **Borrado lógico**: Nunca borrar físicamente un cliente con facturas o trabajos asociados. Usar `estado = inactivo` y marcar `fecha_borrado` (campo adicional opcional).

### 4. Ejemplo de Instancia Completa

```yaml
cliente:
  id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  tipo_cliente: "persona_fisica"
  nombre: "María"
  apellidos: "García López"
  nif_cif: "12345678Z"
  documento_identidad: null
  foto_avatar: "https://storage.plataforma.com/avatars/a1b2c3d4.jpg"
  
  telefono_principal: "+34612345678"
  telefono_secundario: "912345678"
  email: "maria.garcia@email.com"
  whatsapp: true
  contacto_preferido: "whatsapp"
  horario_contacto: "L-V 9:00-14:00"
  
  direccion:
    calle: "Calle Mayor"
    numero: "42"
    piso_puerta: "2ºD"
    codigo_postal: "28001"
    municipio: "Madrid"
    provincia: "Madrid"
    comunidad_autonoma: "Comunidad de Madrid"
    pais: "España"
    latitud: 40.41677540
    longitud: -3.70379020
    notas_direccion: "Portero automático: García López 2D, timbre azul"
  
  direcciones_alternativas:
    - alias: "Oficina"
      tipo: "trabajo"
      calle: "Avenida de América"
      numero: "15"
      piso_puerta: "3ª planta"
      codigo_postal: "28002"
      municipio: "Madrid"
      provincia: "Madrid"
  
  regimen_iva: "general"
  tipo_iva_aplicable: 21.00
  retencion_irpf: 15.00
  exento_iva_motivo: null
  forma_pago_preferida: "transferencia"
  datos_bancarios:
    iban: "ES9121000418450200051332"
    swift_bic: null
    titular: "María García López"
    mandato_sepa: null
  condiciones_pago:
    plazo_dias: 30
    descuento_pp: 2.00
    recargo_demora: 1.50
  
  total_facturado: 4850.00
  total_pendiente_cobro: 750.00
  ultima_factura_fecha: "2026-05-15"
  ultimo_trabajo_fecha: "2026-05-10"
  frecuencia_contratacion: "Trimestral"
  
  notas_internas: "Cliente muy satisfecha. Nos recomienda a sus vecinos del 2º. Tiene un perro labrador grande, avisa antes de llegar."
  etiquetas:
    - "recomendado"
    - "piso"
    - "mantenimiento"
  origen_cliente: "referido"
  cliente_referido_por: "f9e8d7c6-b5a4-3210-fedc-ba0987654321"
  
  fecha_creacion: "2024-03-10T09:30:00+01:00"
  fecha_modificacion: "2026-05-15T14:22:00+02:00"
  creado_por: "u-001-autonomo-principal"
  modificado_por: "u-001-autonomo-principal"
  estado: "activo"
  motivo_bloqueado: null
  visibilidad: "privado"
  
  consentimiento_rgpd:
    aceptado: true
    fecha_aceptacion: "2024-03-10T09:30:00+01:00"
    version_politica: "v2.1-2024"
    finalidades:
      - "facturacion"
      - "comunicacion_comercial"
    consentimiento_comunicaciones_comerciales: true
  
  fuentes_datos:
    - "manual"
    - "ocr_factura"
  
  score_cliente: 85
  riesgo_impago: "bajo"
```

### 5. Consideraciones Legales Obligatorias

#### RGPD (Reglamento UE 2016/679)
- **Base legitimadora**: Consentimiento explícito (Art. 6.1.a) y ejecución de contrato (Art. 6.1.b).
- **Derechos del titular**: La entidad debe soportar: acceso, rectificación, supresión ("derecho al olvido"), limitación del tratamiento, portabilidad y oposición.
- **Campo `consentimiento_rgpd`**: Obligatorio. Sin consentimiento aceptado, no se pueden guardar datos personales. La IA debe validar esto antes de crear o importar un cliente.
- **Registro de actividades de tratamiento**: Los campos `fuentes_datos` y `historial_comunicaciones` facilitan el cumplimiento del Art. 30.
- **Plazo de conservación**: Datos fiscales: 4 años (LGT). Datos de comunicación comercial: hasta retirada del consentimiento. La IA debe proponer limpieza automática de datos antiguos no vinculados a facturas.
- **Transferencias internacionales**: Si se usan servicios cloud fuera del EEE, verificar cláusulas contractuales estándar.

#### Facturación Española (RD 1619/2012)
- **Obligación de NIF/CIF**: Requerido en toda factura (Art. 6).
- **Retención IRPF**: Aplicable cuando el autónomo emite factura a otro profesional o empresa. El campo `retencion_irpf` debe reflejar el porcentaje vigente.
- **IVA**: Los campos `regimen_iva` y `tipo_iva_aplicable` deben alinearse con los tipos vigentes. La IA debe poder notificar cambios normativos.
- **Factura simplificada**: Si el importe < 400€ (o < 3.000€ para servicios a personas físicas), se puede emitir factura simplificada con menos datos del cliente.

#### Protección de Datos Bancarios
- Los datos bancarios (`iban`, `swift_bic`) son datos sensibles. Deben almacenarse cifrados en la base de datos (PostgreSQL pgcrypto o cifrado a nivel aplicación).
- En tránsito: TLS 1.3 obligatorio.
- Acceso restringido: Solo el autónomo propietario puede ver/completar datos bancarios.

### 6. Instrucciones Adicionales para la IA

1. Genera el esquema YAML completo con todos los campos descritos, incluyendo tipos, validaciones y valores por defecto.
2. Incluye los comentarios necesarios para que otro desarrollador entienda cada campo.
3. Define los índices recomendados en PostgreSQL: `nif_cif`, `email`, `estado`, `fecha_creacion`.
4. Sugiere las migraciones necesarias (estructura de tablas, foreign keys, constraints).
5. Incluye un bloque `api_contracts` que defina cómo se exponen estos datos vía REST (campos públicos vs privados, enmascaramiento de datos sensibles).
6. El resultado debe ser directamente usable como input para generación de modelos Django/SQLAlchemy/Prisma equivalente.

Genera ahora la definición completa.
```

# Prompt: Entidad OPORTUNIDAD (CRM) — Plataforma AI-first para Autónomos

## Instrucción principal

Eres un arquitecto de software especializado en plataformas AI-first para autónomos españoles. Tu tarea es diseñar la entidad **OPORTUNIDAD** completa, incluyendo su esquema YAML, migración PostgreSQL, validaciones, lógica de negocio y relaciones con otras entidades.

La entidad OPORTUNIDAD es el núcleo del CRM para un autónomo técnico español (electricista, fontanero, carpintero). Representa una relación comercial con un cliente potencial o existente, agrupa los presupuestos asociados y sirve como punto de control para el seguimiento de ventas.

---

## Contexto del Workflow

```
CLIENTE (obligatorio siempre)
    │
    ├──→ OPORTUNIDAD (CRM) → contiene PRESUPUESTO(S)
    │       │
    │       ├── [aceptada] → TRABAJO → FACTURA
    │       │
    │       └── [perdida/archivada] → fin del seguimiento
    │
    ├──→ TRABAJO (directo, sin oportunidad) → FACTURA
    │
    └──→ FACTURA (directo, servicio ya realizado)
```

La OPORTUNIDAD es el centro del flujo comercial. No es obligatoria para todos los flujos (se puede crear un trabajo o factura directamente), pero cuando se usa, organiza y da trazabilidad a todo el proceso de venta.

---

## Requisitos de la entidad OPORTUNIDAD

### 1. Identificación

- `id`: UUID v4, clave primaria, generado automáticamente.
- `codigo`: String, código legible secuencial. Formato: `OP-YYYY-NNNN` (ej: `OP-2026-0042`). Único por autónomo. Generado automáticamente al crear.
- `fecha_creacion`: Timestamp con zona horaria (`Europe/Madrid`). Se asigna automáticamente al crear.
- `fecha_actualizacion`: Timestamp. Se actualiza automáticamente en cada modificación.
- `fecha_cierre`: Timestamp, opcional. Se establece cuando la oportunidad pasa a estado `aceptada` o `perdida`.
- `version`: Integer. Por defecto 1. Se incrementa con cada modificación significativa.

### 2. Referencia al cliente

- `cliente_id`: UUID, clave foránea → entidad `CLIENTE`. **Obligatorio.**
- Se almacena además una **snapshot** de datos clave del cliente al momento de crear la oportunidad:
  - `cliente_snapshot`: JSONB con `{nombre, nif, direccion, email, telefono}`. Esto preserva los datos históricos aunque el cliente se modifique después.
- Si se crea la oportunidad desde un cliente existente, el snapshot se genera automáticamente.
- Si se crea la oportunidad para un cliente nuevo, se debe crear primero la entidad CLIENTE.

### 3. Estado y ciclo de vida

- `estado`: Enum. Valores permitidos:
  - `nueva` — Acabamos de contactar con el cliente o el cliente nos ha contactado. Sin presupuesto todavía.
  - `en_negociacion` — Estamos hablando con el cliente, valorando necesidades, pendiente de hacer presupuesto.
  - `presupuestada` — Se ha emitido al menos un presupuesto. Pendiente de respuesta del cliente.
  - `aceptada` — El cliente ha aceptado el presupuesto. Se debe crear un TRABAJO desde esta oportunidad.
  - `perdida` — El cliente ha rechazado o hemos perdido la oportunidad frente a un competidor.
  - `archivada` — Se archiva por inactividad prolongada o porque el cliente no responde.

**Transiciones permitidas:**
```
nueva ──────────→ en_negociacion
nueva ──────────→ archivada
en_negociacion ─→ presupuestada
en_negociacion ─→ perdida
en_negociacion ─→ archivada
presupuestada ──→ aceptada
presupuestada ──→ perdida
presupuestada ──→ en_negociacion (nueva revisión del presupuesto)
presupuestada ──→ archivada
aceptada ───────→ (fin del flujo, se crea TRABAJO)
perdida ────────→ en_negociacion (reactivar)
archivada ──────→ en_negociacion (reactivar)
```

### 4. Información comercial

- `fuente`: Enum. Cómo se originó el contacto:
  - `whatsapp` — Contacto por WhatsApp
  - `email` — Contacto por email
  - `llamada` — Llamada telefónica
  - `presencial` — Contacto en persona (obra, taller, etc.)
  - `web` — A través de la web o formulario
  - `recomendacion` — Recomendación de otro cliente
  - `repetido` — Cliente que ya ha trabajado antes con el autónomo
  - `otro` — Otra fuente no categorizada

- `valor_estimado`: Decimal(12,2). Importe estimado de la oportunidad. Basado en la conversación inicial o en la experiencia del autónomo. No es vinculante, es orientativo.

- `valor_presupuestado`: Decimal(12,2). Se actualiza automáticamente cuando se crea un presupuesto. Refleja el importe total del último presupuesto emitido.

- `probabilidad_cierre`: Integer (0-100). Estimación del autónomo sobre la probabilidad de cerrar la oportunidad. Por defecto: `50` (media). Se ajusta manualmente o por IA según el historial.

- `tipo_trabajo`: Enum. Tipo de trabajo que el cliente necesita:
  - `instalacion` — Instalación nueva
  - `reparacion` — Reparación / avería
  - `mantenimiento` — Mantenimiento periódico
  - `reforma` — Reforma / mejora
  - `certificado` — Boletín / certificado (ej: boletín eléctrico)
  - `presupuesto_general` — Sin determinar todavía
  - `otro` — Otro tipo no categorizado

### 5. Seguimiento y notas comerciales

- `descripcion_necesidad`: Text. Descripción de lo que el cliente necesita. En lenguaje natural, tal como lo cuenta el cliente. Ej: "Quiere cambiar todo el cuadro eléctrico de su casa y poner luces LED en el salón."

- `notas_internas`: Text. Notas del autónomo sobre la oportunidad que NO se muestran al cliente. Ej: "Cliente recommendado por María García. Tiene presupuesto ajustado."

- `fecha_contacto_siguiente`: Date, opcional. Próximo contacto planificado con el cliente. La IA debe recordar al autónomo si esta fecha está próxima o vencida.

- `motivo_perdida`: String, opcional. Solo si estado = `perdida`. Motivo por el que se perdió la oportunidad:
  - `precio` — El precio era demasiado alto
  - `competencia` — Eligió a otro profesional
  - `plazo` — No podíamos cumplir los plazos
  - `sin_respuesta` — El cliente dejó de responder
  - `no_interes` — El cliente perdió el interés
  - `otro` — Otro motivo

### 6. Presupuestos asociados

- `presupuestos`: Array de UUIDs. IDs de los presupuestos asociados a esta oportunidad.
  - Una oportunidad puede tener 0, 1 o múltiples presupuestos.
  - Múltiples presupuestos pueden darse por: versiones revisadas, variantes (material A vs material B), presupuestos para diferentes alcances.
  - El presupuesto más reciente es el "activo" por defecto.

- `presupuesto_activo_id`: UUID, opcional. ID del presupuesto que está actualmente en consideración. Se actualiza automáticamente al crear/actualizar presupuestos.

### 7. Trabajo derivado

- `trabajo_id`: UUID, opcional, nullable. ID del trabajo creado cuando la oportunidad se acepta. Relación 1:1 (una oportunidad aceptada genera un trabajo). Inicialmente null.

---

## Esquema YAML completo

```yaml
oportunidad:
  # ── Identificación ──
  id: <uuid>                             # UUID v4, clave primaria
  codigo: "OP-2026-0042"                 # Código legible secuencial
  fecha_creacion: <datetime>             # Asignado automáticamente
  fecha_actualizacion: <datetime>        # Actualizado automáticamente
  fecha_cierre: <datetime | null>        # Se establece al aceptar/perder
  version: 1                             # Control de cambios

  # ── Cliente ──
  cliente_id: <uuid>                     # FK → clientes.id (obligatorio)
  cliente_snapshot:                       # Instantánea al crear la oportunidad
    nombre: "María García López"
    nif: "12345678Z"
    direccion: "C/ Mayor 12, 28223 Pozuelo de Alarcón, Madrid"
    email: "maria@example.com"
    telefono: "+34 612 345 678"

  # ── Estado ──
  estado: "nueva"                        # nueva | en_negociacion | presupuestada | aceptada | perdida | archivada
  motivo_perdida: null                   # Solo si estado = perdida

  # ── Comercial ──
  fuente: "recomendacion"                # Origen del contacto
  tipo_trabajo: "reforma"                # Tipo de trabajo necesario
  descripcion_necesidad: "Quiere reformar la instalación eléctrica de su piso de 80m². Tres habitaciones, salón, cocina y baño. También quiere poner puntos de luz LED."
  valor_estimado: 3500.00                # Estimación inicial (sin presupuesto formal)
  valor_presupuestado: 3800.00           # Se actualiza al crear presupuesto
  probabilidad_cierre: 75                # 0-100

  # ── Seguimiento ──
  notas_internas: "Cliente recomendado por obra anterior. Parece decidida, solo quiere confirmar presupuesto."
  fecha_contacto_siguiente: "2026-06-05" # Próximo contacto planificado

  # ── Presupuestos ──
  presupuestos:                          # IDs de los presupuestos asociados
    - "b1a2c3d4-e5f6-7890-abcd-ef1234567890"
    - "c2b3a4d5-e6f7-8901-bcde-f12345678901"
  presupuesto_activo_id: "c2b3a4d5-e6f7-8901-bcde-f12345678901"

  # ── Trabajo derivado ──
  trabajo_id: null                       # Se asigna cuando estado → aceptada

  # ── Metadatos ──
  creado_por: "ia"                       # ia | usuario | api
  creado_en: <datetime>
  actualizado_en: <datetime>
```

---

## DDL PostgreSQL

```sql
-- Tabla principal: oportunidades
CREATE TABLE oportunidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) NOT NULL,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_cierre TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 1,

    -- Cliente
    cliente_id UUID NOT NULL REFERENCES clientes(id),
    cliente_snapshot JSONB,

    -- Estado
    estado VARCHAR(20) NOT NULL DEFAULT 'nueva'
        CHECK (estado IN ('nueva','en_negociacion','presupuestada','aceptada','perdida','archivada')),
    motivo_perdida VARCHAR(30),

    -- Comercial
    fuente VARCHAR(20) NOT NULL DEFAULT 'otro'
        CHECK (fuente IN ('whatsapp','email','llamada','presencial','web','recomendacion','repetido','otro')),
    tipo_trabajo VARCHAR(30) DEFAULT 'presupuesto_general'
        CHECK (tipo_trabajo IN ('instalacion','reparacion','mantenimiento','reforma','certificado','presupuesto_general','otro')),
    descripcion_necesidad TEXT,
    valor_estimado DECIMAL(12,2),
    valor_presupuestado DECIMAL(12,2),
    probabilidad_cierre INTEGER DEFAULT 50 CHECK (probabilidad_cierre >= 0 AND probabilidad_cierre <= 100),

    -- Seguimiento
    notas_internas TEXT,
    fecha_contacto_siguiente DATE,

    -- Presupuestos
    presupuesto_activo_id UUID,

    -- Trabajo derivado
    trabajo_id UUID,

    -- Metadatos
    creado_por VARCHAR(10) NOT NULL DEFAULT 'ia',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_oportunidades_cliente ON oportunidades(cliente_id);
CREATE INDEX idx_oportunidades_estado ON oportunidades(estado);
CREATE INDEX idx_oportunidades_fecha ON oportunidades(fecha_creacion DESC);
CREATE INDEX idx_oportunidades_codigo ON oportunidades(codigo);
CREATE INDEX idx_oportunidades_fuente ON oportunidades(fuente);
CREATE INDEX idx_oportunidades_probabilidad ON oportunidades(probabilidad_cierre);
CREATE INDEX idx_oportunidades_contacto ON oportunidades(fecha_contacto_siguiente)
    WHERE fecha_contacto_siguiente IS NOT NULL;

-- Trigger para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION update_oportunidades_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_oportunidades_updated_at
    BEFORE UPDATE ON oportunidades
    FOR EACH ROW
    EXECUTE FUNCTION update_oportunidades_timestamp();

-- Trigger para establecer fecha_cierre
CREATE OR REPLACE FUNCTION set_oportunidad_fecha_cierre()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado IN ('aceptada', 'perdida') AND OLD.estado NOT IN ('aceptada', 'perdida') THEN
        NEW.fecha_cierre = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_oportunidades_fecha_cierre
    BEFORE UPDATE ON oportunidades
    FOR EACH ROW
    WHEN (OLD.estado IS DISTINCT FROM NEW.estado)
    EXECUTE FUNCTION set_oportunidad_fecha_cierre();

-- Tabla de historial de cambios de estado
CREATE TABLE oportunidad_historial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    oportunidad_id UUID NOT NULL REFERENCES oportunidades(id),
    estado_anterior VARCHAR(20),
    estado_nuevo VARCHAR(20) NOT NULL,
    fecha_cambio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    motivo TEXT,
    realizado_por VARCHAR(10) NOT NULL DEFAULT 'ia'
);

CREATE INDEX idx_oportunidad_historial ON oportunidad_historial(oportunidad_id, fecha_cambio DESC);
```

---

## Reglas de Negocio

### Regla 1 — Cliente obligatorio
No se puede crear una oportunidad sin un cliente existente. Si el cliente no existe, se debe crear primero la entidad CLIENTE.

### Regla 2 — Código automático
El campo `codigo` se genera automáticamente con formato `OP-YYYY-NNNN`. El contador NNNN es secuencial por año. La IA no debe generar este código manualmente.

### Regla 3 — Snapshot del cliente
Al crear la oportunidad, se toma una instantánea de los datos del cliente. Si el cliente se modifica después, la oportunidad conserva los datos originales. Esto es importante para la trazabilidad histórica.

### Regla 4 — Valor presupuestado automático
Cuando se crea un presupuesto asociado a la oportunidad, el campo `valor_presupuestado` se actualiza automáticamente con el total del presupuesto. Si hay múltiples presupuestos, refleja el total del `presupuesto_activo_id`.

### Regla 5 — Aceptación → Trabajo
Cuando una oportunidad pasa a estado `aceptada`, se debe crear automáticamente un TRABAJO. La IA debe:
1. Cambiar estado de la oportunidad a `aceptada`
2. Crear un trabajo heredando: cliente, datos del presupuesto activo (líneas, materiales, importe)
3. Asignar `trabajo_id` en la oportunidad
4. Informar al autónomo de que el trabajo está creado

### Regla 6 — Oportunidades perdidas
Si una oportunidad pasa a `perdida`, se registra el motivo. La IA debe preguntar al autónomo por el motivo antes de cambiar el estado. Las oportunidades perdidas pueden reactivarse (volver a `en_negociacion`).

### Regla 7 — Alertas de seguimiento
Si `fecha_contacto_siguiente` está dentro de los próximos 3 días o ya ha pasado y la oportunidad no está en estado terminal (aceptada/perdida/archivada), la IA debe sugerir al autónomo retomar el contacto.

### Regla 8 — Oportunidades huérfanas
Una oportunidad en estado `presupuestada` sin actividad durante más de 30 días debe marcarse como candidata a `archivada`. La IA pregunta al autónomo antes de archivar.

### Regla 9 — Múltiples presupuestos
Dentro de una oportunidad pueden coexistir varios presupuestos. Esto cubre casos como:
- El cliente pide una variante más económica
- Se necesita revisar el presupuesto por cambios en el alcance
- El cliente quiere comparar materiales de distintas calidades
El `presupuesto_activo_id` indica cuál es el vigente.

---

## Comportamiento esperado de la IA

Cuando el autónomo interactúa por voz o texto, la IA debe:

### 1. Crear oportunidad desde conversación
> *"María García me ha llamado para que le haga un presupuesto para reformar la luz de su piso"*

→ La IA crea la OPORTUNIDAD en estado `nueva`:
- Busca o crea el cliente "María García"
- Extrae tipo_trabajo: `reforma`
- Descripción: "Reforma instalación eléctrica de un piso"
- fuente: `llamada`
- Deja valor_estimado pendiente (o pregunta)

### 2. Progresar estado
> *"He hablado con María, quiere que le hagamos el presupuesto"*

→ Cambia estado de `nueva` a `en_negociacion`

> *"He enviado el presupuesto a María"*

→ Cambia estado de `en_negociacion` a `presupuestada`
→ Actualiza `valor_presupuestado` con el total del presupuesto
→ Asigna `presupuesto_activo_id`

### 3. Cerrar oportunidad con éxito
> *"María ha aceptado el presupuesto. Empezamos la semana que viene"*

→ Cambia estado a `aceptada`
→ Crea automáticamente un TRABAJO con:
  - Cliente: María García
  - Datos heredados del presupuesto activo (líneas, materiales, importe)
  - Estado: `pendiente`
  - Como fecha de inicio estimada: la semana que viene
→ Asigna `trabajo_id` en la oportunidad

### 4. Cerrar oportunidad como perdida
> *"Al final María se ha ido con otro electricista, más barato"*

→ Pregunta motivo: `competencia`
→ Cambia estado a `perdida`
→ Registra `motivo_perdida: "competencia"`
→ Actualiza `fecha_cierre`

### 5. Consultar oportunidades
> *"¿Qué oportunidades tengo abiertas?"*

→ Filtra por estado != `aceptada`, `perdida`, `archivada`
→ Muestra resumen: código, cliente, estado, valor_estimado, fecha_creacion

> *"¿Qué oportunidades están a punto de perder?"*

→ Filtra por `fecha_contacto_siguiente` próxima o vencida, estado activo

### 6. Resumen comercial
> *"¿Cuánto he presupuestado este mes?"*

→ Suma `valor_presupuestado` de oportunidades en estado `presupuestada` o `aceptada` del mes actual

> *"¿Qué tasa de cierre tengo?"*

→ Calcula: aceptadas / (aceptadas + perdidas) del período

---

## Ejemplo YAML completo (Oportunidad real)

```yaml
oportunidad:
  id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  codigo: "OP-2026-0042"
  fecha_creacion: "2026-05-28T10:30:00+02:00"
  fecha_actualizacion: "2026-05-28T16:45:00+02:00"
  fecha_cierre: null
  version: 3

  cliente_id: "c4b3a2e1-d5f6-7890-abcd-ef1234567890"
  cliente_snapshot:
    nombre: "María García López"
    nif: "12345678Z"
    direccion: "C/ Mayor 12, 28223 Pozuelo de Alarcón, Madrid"
    email: "maria@example.com"
    telefono: "+34 612 345 678"

  estado: "presupuestada"
  motivo_perdida: null

  fuente: "llamada"
  tipo_trabajo: "reforma"
  descripcion_necesidad: >
    Reforma completa de instalación eléctrica en piso de 80m².
    Tres habitaciones, salón, cocina y baño. Quiere puntos de luz LED
    en toda la casa y un cuadro eléctrico nuevo con protecciones actualizadas.
  valor_estimado: 3500.00
  valor_presupuestado: 3825.50
  probabilidad_cierre: 80

  notas_internas: >
    Cliente parece tener claro lo que quiere. Recomendada por la reforma
    del baño de los López. Llamada inicial muy positiva.
  fecha_contacto_siguiente: "2026-06-02"

  presupuestos:
    - "b1a2c3d4-e5f6-7890-abcd-ef1234567890"
  presupuesto_activo_id: "b1a2c3d4-e5f6-7890-abcd-ef1234567890"

  trabajo_id: null

  creado_por: "ia"
  creado_en: "2026-05-28T10:30:00+02:00"
  actualizado_en: "2026-05-28T16:45:00+02:00"
```

---

## Endpoints de API

```yaml
api_endpoints:
  listar_oportunidades:
    method: GET
    path: /oportunidades
    params:
      - estado: filter
      - cliente_id: filter
      - fuente: filter
      - fecha_desde: date
      - fecha_hasta: date
      - page: integer
      - limit: integer (max 100)
    response: lista paginada de oportunidades

  crear_oportunidad:
    method: POST
    path: /oportunidades
    body: datos de la oportunidad (cliente_id obligatorio)
    response: 201 + oportunidad creada

  obtener_oportunidad:
    method: GET
    path: /oportunidades/{id}
    response: 200 + oportunidad completa

  actualizar_oportunidad:
    method: PATCH
    path: /oportunidades/{id}
    body: campos a actualizar
    response: 200 + oportunidad actualizada

  cambiar_estado:
    method: PATCH
    path: /oportunidades/{id}/estado
    body:
      - estado: string (requerido)
      - motivo: string (requerido si estado = perdida)
    response: 200 + oportunidad actualizada
    validacion: respeta transiciones permitidas

  obtener_historial:
    method: GET
    path: /oportunidades/{id}/historial
    response: 200 + array de cambios de estado
```

---

## Relaciones con otras entidades (resumen)

| Entidad | Relación | Descripción |
|---------|----------|-------------|
| CLIENTE | N:1 | Una oportunidad pertenece a un cliente. Un cliente puede tener muchas oportunidades. |
| PRESUPUESTO | 1:N | Una oportunidad puede tener múltiples presupuestos (versiones, variantes). |
| TRABAJO | 1:1 opcional | Una oportunidad aceptada genera un trabajo. Un trabajo pertenece a una oportunidad. |
| FACTURA | indirecta | Una oportunidad no se relaciona directamente con facturas. La factura se genera desde el trabajo derivado. |

---

## Consideraciones clave

1. **No es un mero contenedor**: La oportunidad tiene valor propio como herramienta de seguimiento comercial. El autónomo puede ver su pipeline de ventas, tasa de cierre, fuentes de captación más efectivas, etc.

2. **Simplicidad sobre ingeniería**: El autónomo no necesita un CRM complejo. La oportunidad debe ser ligera: pocos campos obligatorios, lenguaje natural en descripciones, sin jerarquías complicadas.

3. **La IA es la interfaz**: El autónomo no debería rellenar formularios. La IA crea y actualiza oportunidades a partir de la conversación natural.

4. **Presupuesto vivo**: Cuando se actualiza el presupuesto activo de una oportunidad, el sistema debe reflejarlo. Si el presupuesto cambia y la oportunidad está en estado `presupuestada`, se mantiene el estado (sigue pendiente de respuesta del cliente).

5. **Valor estimado vs. real**: El `valor_estimado` es la primera impresión comercial. El `valor_presupuestado` es el importe formal. Al crear el trabajo, el importe final puede diferir (materiales reales, horas reales). Esto permite análisis de precisión en las estimaciones.

# MCP Tools — AI-First Autónomos

> Servidor MCP que expone herramientas CRUD sobre PostgreSQL para que Hermes Agent interactúe con el ERP.

## Arquitectura

```
Hermes Agent (J.A.R.V.I.S.)
       │
       │ MCP protocol (stdio)
       ▼
┌──────────────────┐      HTTP POST/GET       ┌────────────┐
│  mcp_server.py   │ ─────────────────────►    │  api.py    │ ──► PostgreSQL
│  (tools MCP)     │ ◄─────────────────────    │  FastAPI   │
└──────────────────┘                           └────────────┘
```

El servidor MCP se comunica con la REST API (`api.py`) vía HTTP.

## Tools disponibles

### CLIENTES (4 tools)

| Tool | Descripción | Entrada principal |
|---|---|---|
| `listar_clientes` | Lista todos los clientes registrados | activo (bool, default true) |
| `obtener_cliente` | Detalles de un cliente por ID | cliente_id (int) |
| `crear_cliente` | Crea un nuevo cliente | nombre, teléfono, dirección... |
| `actualizar_cliente` | Actualiza datos de un cliente | cliente_id + campos |

### TRABAJOS (6 tools)

| Tool | Descripción | Entrada principal |
|---|---|---|
| `listar_trabajos` | Lista trabajos (obras/proyectos) | estado, activo |
| `obtener_trabajo` | Detalles completos + checklist, tiempos, materiales | trabajo_id |
| `crear_trabajo` | Crea nuevo trabajo | titulo, cliente, ubicación... |
| `actualizar_estado_trabajo` | Cambia estado (pendiente/en_curso/completado/cancelado) | trabajo_id, estado |
| `añadir_tarea_checklist` | Añade tarea al checklist | trabajo_id, descripción, fecha |
| `completar_tarea` | Marca tarea como completada | item_id |
| `registrar_tiempo` | Registra horas trabajadas | trabajo_id, horas, descripción |
| `tareas_por_fecha` | Obtiene tareas programadas para una fecha | fecha (YYYY-MM-DD) |

### MATERIALES (2 tools)

| Tool | Descripción |
|---|---|
| `listar_materiales` | Lista catálogo de materiales (filtro por categoría) |
| `crear_material` | Añade material al catálogo |

### OPORTUNIDADES (4 tools)

| Tool | Descripción |
|---|---|
| `listar_oportunidades` | Lista oportunidades comerciales (filtro por estado) |
| `obtener_oportunidad` | Detalles de una oportunidad |
| `crear_oportunidad` | Crea nueva oportunidad para un cliente |
| `actualizar_estado_oportunidad` | Cambia estado (abierta/cerrada_ganada/cerrada_perdida/en_negociacion) |

### PRESUPUESTOS (5 tools)

| Tool | Descripción |
|---|---|
| `listar_presupuestos` | Lista presupuestos (filtro por estado) |
| `obtener_presupuesto` | Detalles de un presupuesto |
| `crear_presupuesto` | Crea nuevo presupuesto para un cliente |
| `actualizar_estado_presupuesto` | Cambia estado (borrador/pendiente/aceptado/rechazado/vencido) |
| `listar_lineas_presupuesto` | Lista las líneas/partidas de un presupuesto |
| `añadir_linea_presupuesto` | Añade línea a un presupuesto |

### FACTURAS (5 tools)

| Tool | Descripción |
|---|---|
| `listar_facturas` | Lista facturas (filtro por estado de pago) |
| `obtener_factura` | Detalles + líneas de una factura |
| `crear_factura` | Crea nueva factura para un cliente |
| `actualizar_estado_pago_factura` | Cambia estado de pago (pendiente/pagada/vencida/cobrada) |
| `listar_lineas_factura` | Lista líneas de una factura |
| `añadir_linea_factura` | Añade línea a una factura |

### CALENDARIO (4 tools)

| Tool | Descripción |
|---|---|
| `crear_evento` | Crea evento (reunión/trabajo/tarea/personal) |
| `listar_eventos` | Lista eventos por fecha, tipo o estado |
| `eventos_por_rango` | Lista eventos en rango de fechas |
| `eliminar_evento` | Desactiva (soft delete) un evento |

### COMENTARIOS (4 tools)

| Tool | Descripción |
|---|---|
| `listar_comentarios_trabajo` | Comentarios de un trabajo específico |
| `añadir_comentario_trabajo` | Añade comentario a un trabajo |
| `listar_comentarios` | Comentarios de cualquier entidad |
| `añadir_comentario` | Añade comentario a cualquier entidad |

## Categorías de entidades

Las entidades soportadas para comentarios y eventos polimórficos son:

- `trabajo` — Obras y proyectos
- `cliente` — Clientes
- `presupuesto` — Presupuestos
- `factura` — Facturas
- `oportunidad` — Oportunidades comerciales
- `material` — Materiales del catálogo
- `gasto` — Gastos

## Convenciones

- **Soft delete:** Todos los DELETE son lógicos (activo = false). Nunca se pierden datos.
- **Estados por defecto:** Las entidades nuevas se crean activas.
- **Fechas:** Formato ISO 8601 (YYYY-MM-DD). Horas en HH:MM (24h).
- **Búsqueda:** Los listados excluyen entidades inactivas por defecto.

## Estados workflow

```
CLIENTE ──► OPORTUNIDAD ──► PRESUPUESTO ──► TRABAJO ──► FACTURA
             nueva           borrador         pendiente    pendiente
             abierta         pendiente        en_curso     pagada
             en_negociacion  aceptado         completado   vencida
             cerrada_ganada  rechazado        cancelado    cobrada
             cerrada_perdida vencido
```

## Implementación

- **Lenguaje:** Python
- **Framework MCP:** `mcp` (Python package)
- **Transporte:** stdio (pipe con Hermes Agent)
- **API base:** `http://localhost:8000/api` (configurable vía `AI_FIRST_API`)
- **Archivo:** `db/mcp_server.py`

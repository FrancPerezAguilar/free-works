# AI-First Autónomos 🧠⚡

> ERP minimalista para autónomos del sector eléctrico/instalaciones.
> Gestionado por IA vía voz o texto, con PostgreSQL como fuente de verdad.

---

## Stack

| Capa | Tecnología |
|---|---|
| **IA / Voz** | Hermes Agent + DeepSeek V4 |
| **API** | FastAPI (Python) |
| **Base de datos** | PostgreSQL 16 |
| **Almacenamiento YAML** | Fuente de verdad original (migrado a PG) |
| **CLI** | psql directo |

## Arquitectura

```
┌─────────────────────────────────────────────────────┐
│               Hermes Agent (J.A.R.V.I.S.)            │
│   voz / texto → MCP tools → API REST → PostgreSQL    │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   FastAPI :8000       │
              │   REST + OpenAPI      │
              └────────┬─────────────┘
                       │
              ┌────────▼─────────────┐
              │   PostgreSQL 16       │
              │   ~/pg-data/          │
              │   socket: pg-data/    │
              └──────────────────────┘
```

## Entidades y flujo de negocio

El sistema modela el ciclo completo de un trabajo de instalaciones:

```
CLIENTE → OPORTUNIDAD → PRESUPUESTO → TRABAJO → FACTURA
```

### Cliente
Datos fiscales, contacto, dirección, condiciones de pago, histórico.

### Oportunidad
Lead u oportunidad comercial: origen, presupuesto estimado, probabilidad de cierre.

### Presupuesto
Documento con líneas desglosadas (partidas), IVA, condiciones de pago.
Estados: `borrador → pendiente → aceptado/rechazado/vencido`.

### Trabajo
Ejecución con:
- **Checklist** de tareas programadas
- **Tiempos** registrados por día
- **Materiales** consumidos
- **Comentarios** para histórico (incidencias, notas)

Estados: `pendiente → en_curso → completado/cancelado`.

### Factura
Generada desde un trabajo, con líneas de materiales y mano de obra.
Estados de pago: `pendiente → pagada/vencida/cobrada`.

### Calendario
Eventos polimórficos vinculables a cualquier entidad (trabajo, tarea, reunión, personal).

### Materiales
Catálogo de productos con precios, proveedores, stock.

## Archivado (soft delete)

Ninguna entidad se borra físicamente. Todas tienen el campo `activo` (boolean, default `true`):

| Entidad | Campo |
|---|---|
| Clientes | `active` |
| Trabajos | `activo` |
| Materiales | `activo` |
| Presupuestos | `activo` |
| Facturas | `activo` |
| Oportunidades | `activo` |
| Calendario | `activo` |

Las APIs de listado filtran por `activo=true` por defecto.
Para archivar: `PATCH /api/{entidad}/{id} {"activo": false}`.

## Estructura del proyecto

```
ai-first-autonomos/
├── core/
│   ├── __init__.py
│   ├── models.py          # Modelos Pydantic (legado YAML)
│   └── yaml_store.py      # YAML Store original (legado)
├── data/
│   ├── templates/         # Plantillas YAML de cada entidad
│   │   ├── cliente.yaml
│   │   ├── factura.yaml
│   │   ├── material.yaml
│   │   ├── oportunidad.yaml
│   │   ├── presupuesto.yaml
│   │   └── trabajo.yaml
│   ├── clientes/          # Datos YAML (legado)
│   ├── trabajos/
│   └── materiales/
├── db/
│   ├── api.py             # FastAPI REST (PostgreSQL)
│   ├── mcp_server.py      # Servidor MCP para Hermes Agent
│   ├── migrate_data.py    # Migración YAML → PostgreSQL
│   ├── migrations/
│   │   ├── 001_schema.sql     # Schema completo
│   │   └── 002_calendario.sql # Calendario
│   └── start.sh           # Script de arranque
├── docs/
│   ├── arquitetura-api-yaml.md
│   ├── openapi.json
│   └── swagger.html
├── entidades/             # Prompts de diseño de entidades
├── skills/                # Skills de Hermes Agent
├── requirements.txt
└── README.md
```

## Inicio rápido

### 1. Arrancar PostgreSQL

```bash
~/pg-dist/usr/lib/postgresql/16/bin/pg_ctl -D ~/pg-data -l ~/pg-data/logfile start
```

### 2. Arrancar la API

```bash
cd ~/ai-first-autonomos && python db/api.py
```

La API sirve en `http://localhost:8000`.
Swagger UI: `http://localhost:8000/docs`.
OpenAPI: `http://localhost:8000/openapi.json`.

### 3. Parar

```bash
~/pg-dist/usr/lib/postgresql/16/bin/pg_ctl -D ~/pg-data stop
```

O usar `start.sh` que gestiona ambos servicios:

```bash
bash ~/ai-first-autonomos/db/start.sh
```

## API REST (endpoints principales)

### Clientes
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/clientes` | Listar (filtro `activo`) |
| GET | `/api/clientes/{id}` | Obtener |
| POST | `/api/clientes` | Crear |
| PATCH | `/api/clientes/{id}` | Actualizar |

### Trabajos
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/trabajos` | Listar (filtro `activo`, `estado`) |
| GET | `/api/trabajos/{id}` | Obtener (con checklist, tiempos, materiales) |
| POST | `/api/trabajos` | Crear |
| PATCH | `/api/trabajos/{id}` | Actualizar |
| POST | `/api/trabajos/{id}/checklist` | Añadir tarea |
| POST | `/api/trabajos/{id}/tiempos` | Registrar horas |
| PATCH | `/api/checklist/{id}` | Completar tarea |
| GET | `/api/tareas/fecha/{fecha}` | Tareas por fecha |

### Presupuestos y Facturas
| Método | Ruta |
|---|---|
| GET/POST/PATCH | `/api/presupuestos[/{id}]` |
| GET/POST/PATCH | `/api/facturas[/{id}]` |
| GET/POST | `/api/presupuesto_lineas` |
| GET/POST | `/api/factura_lineas` |

### Calendario
| Método | Ruta |
|---|---|
| GET | `/api/calendario` |
| GET | `/api/calendario/rango?desde=&hasta=` |
| POST | `/api/calendario` |
| PATCH | `/api/calendario/{id}` |
| DELETE | `/api/calendario/{id}` (soft delete) |

### Oportunidades y Materiales
| Método | Ruta |
|---|---|
| GET/POST/PATCH | `/api/oportunidades[/{id}]` |
| GET/POST | `/api/materiales` |

### Comentarios (histórico)
| Método | Ruta |
|---|---|
| GET | `/api/comentarios/{entity_type}/{entity_id}` |
| POST | `/api/comentarios/{entity_type}/{entity_id}` |

## MCP Tools (para Hermes Agent)

El servidor MCP (`db/mcp_server.py`) expone tools para cada operación CRUD. Se integran con Hermes Agent permitiendo:

- Gestión completa de clientes, trabajos, presupuestos, facturas
- Registro de tiempos y materiales
- Calendario de eventos
- Histórico de comentarios
- Actualización de estados (trabajo, pago, presupuesto)

## Base de datos

- **Motor:** PostgreSQL 16 local
- **Puerto:** 5432 (socket Unix en `~/pg-data/sockets/`)
- **Base de datos:** `ai_first_autonomos`
- **Usuario:** `ai_first`

### Esquema

- `clientes` — 30+ campos (fiscales, contacto, dirección, scoring)
- `trabajos` — con tablas hijas: `trabajo_checklist`, `trabajo_tiempos`, `trabajo_materiales`, `trabajo_comentarios`
- `presupuestos` — con `presupuesto_lineas`
- `facturas` — con `factura_lineas`
- `oportunidades` — pipeline comercial
- `materiales` — catálogo con stock y precios
- `calendario` — eventos polimórficos
- `comentarios` — comentarios genéricos polimórficos

## Desarrollo

### Requisitos

```bash
pip install -r db/requirements-api.txt
# psycopg2-binary, fastapi, uvicorn, pydantic
```

### Migraciones

Los schemas SQL están en `db/migrations/`. Se ejecutan con psql:

```bash
~/pg-dist/usr/lib/postgresql/16/bin/psql -h ~/pg-data/sockets -U ai_first -d ai_first_autonomos -f db/migrations/001_schema.sql
```

---

> *"Hecho para un electricista, por una IA, con PostgreSQL."*

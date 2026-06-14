# Free Works — Contexto Completo para IA

> **Repositorio:** https://github.com/FrancPerezAguilar/free-works
> **Propietario:** Franc Pérez (autónomo electricista)
> **Propósito:** Gestor inteligente de trabajos para técnicos autónomos, conectado a Holded para facturación/contabilidad.

---

## 📋 Resumen ejecutivo

Free Works es un **gestor de trabajos con IA** (NO un ERP completo). La filosofía: Free Works gestiona el día a día (trabajos, técnicos, tiempos, materiales, checklist) y Holded actúa como backend financiero (facturación, contabilidad, Verifactu). La IA (JARVIS + subagente MiniMax M3) automatiza tareas, genera contenido y asiste al usuario por voz.

---

## 🏗️ Arquitectura general

```
                    ┌──────────────────────────┐
                    │      USUARIO (Franc)      │
                    │   Telegram / Voz / Web    │
                    └────────┬─────────────────┘
                             │
              ┌──────────────┼──────────────────┐
              ▼              ▼                   ▼
     ┌──────────────┐ ┌──────────┐ ┌──────────────────┐
     │ Hermes Agent  │ │ Web UI   │ │ MCP Holded       │
     │ (JARVIS IA)   │ │ React    │ │ (@energio/       │
     │ DeepSeek V4   │ │ :5173    │ │ holded-mcp)      │
     │ Pri: razonar  │ │          │ │ :PENDIENTE       │
     │ Sub: MiniMax  │ │          │ │                  │
     │ M3 (código)   │ │          │ │                  │
     └──────────────┘ └──────────┘ └──────────────────┘
              │              │               │
              └──────┬───────┘               │
                     ▼                        ▼
           ┌──────────────────┐   ┌──────────────────┐
           │  FastAPI Server   │   │   Holded API      │
           │  PostgreSQL 16    │   │   (externa)        │
           │  localhost:8000   │   │                    │
           └──────────────────┘   └──────────────────┘
```

### Stack tecnológico

| Capa | Tecnología | Detalle |
|------|-----------|---------|
| **Frontend** | React 19 + TypeScript 6.0 + Vite 8 | Tailwind CSS 4, Lucide icons |
| **Backend API** | Python 3.11 + FastAPI | PostgreSQL 16 local (puerto 8000) |
| **BD relacional** | PostgreSQL 16 | En `~/pg-dist/`, DB `ai_first_autonomos` |
| **IA principal** | DeepSeek V4 Flash (via OpenCode Go) | Agente Hermes que razona y coordina |
| **IA código** | MiniMax M3 (subagente delegado) | Generación de código, debugging |
| **Voz** | Supertonic TTS (español) | Notas de voz Ogg Opus |
| **ERP externo** | Holded (vía MCP) | Facturación, contabilidad, Verifactu |

### Frameworks y librerías clave

| Librería | Versión | Para qué |
|----------|---------|----------|
| react-hook-form | 7.76 | Formularios |
| @tanstack/react-query | 5.100 | Data fetching + caché |
| react-router-dom | 7.15 | Routing |
| fetch (nativo) | — | HTTP client en `web/src/api/client.ts` |
| zod | 4.4 | Validación esquemas |
| tailwind-merge + clsx | — | Utilidades CSS |
| Pydantic | 2.10 | Modelos Python (request/response) |
| psycopg2-binary | 2.9 | Conexión PostgreSQL |
| python-dotenv | 1.0+ | Carga de variables de entorno |
| python-multipart | 0.0.9 | Subida de archivos (adjuntos) |

---

## 📁 Estructura del repositorio

```
free-works/
├── web/                   # Frontend React
│   ├── src/
│   │   ├── api/           #   Llamadas a la API (clientes, trabajos, etc.)
│   │   ├── components/
│   │   │   ├── layout/    #   AppLayout, Sidebar, TopBar, MobileNav
│   │   │   ├── shared/    #   LoadingState, ErrorState, StatusBadge
│   │   │   └── ui/        #   Card, Badge, Skeleton
│   │   ├── pages/
│   │   │   ├── trabajos/  #   TrabajoList, TrabajoDetail + secciones
│   │   │   ├── clientes/  #   ClienteList, ClienteDetail, FormModal
│   │   │   ├── presupuestos/ # PresupuestoList, Detail, Form, Lineas
│   │   │   ├── facturas/  #   FacturaList, Detail, Form, Lineas
│   │   │   ├── oportunidades/ # OportunidadList, Detail, Form
│   │   │   ├── materiales/ #   MaterialList, Form
│   │   │   ├── calendario/ #   CalendarioPage
│   │   │   └── Dashboard.tsx
│   │   ├── types/         #   Tipos TypeScript (todas las entidades)
│   │   └── lib/           #   Constantes, utilidades
│   ├── index.html
│   ├── vite.config.ts     #   Vite + proxy /api → :8000
│   └── package.json
│
├── db/                    # Backend API + migraciones
│   ├── api.py             #   FastAPI server (todos los endpoints CRUD)
│   ├── mcp_server.py      #   MCP server (tools para Hermes)
│   ├── migrations/
│   │   ├── 001_schema.sql          #   Schema completo PostgreSQL
│   │   ├── 002_calendario.sql      #   Tabla de eventos
│   │   ├── 003_normalize_activo.sql #   clientes.active → clientes.activo
│   │   └── 004_tecnicos_adjuntos.sql #   Técnicos + adjuntos
│   ├── start.sh
│   └── logs/              #   Logs del API server
│
├── sync/holded/           # Capa de sincronización con Holded
│   ├── __init__.py
│   └── sync.py            #   Clase HoldedSync (pendiente implementar)
│
├── mcp/                   # Configuración MCP
│   ├── __init__.py
│   └── README.md
│
├── tecnicos/              # Módulo de gestión de técnicos (documentación)
│   ├── __init__.py
│   └── README.md
│
├── adjuntos/              # Módulo de archivos multimedia
│   └── __init__.py
│
├── data/
│   └── uploads/           #   Archivos subidos (gitignored)
│
├── archive/               # Código legacy del ERP anterior (no tocar)
├── docs/                  # OpenAPI spec, Swagger UI, planes
├── ARQUITECTURA.md        # Documento de arquitectura
├── AGENTS.md              # ← ESTE DOCUMENTO
├── README.md
├── .env.example           # Plantilla de variables de entorno
├── .gitignore
└── requirements.txt       # Dependencias Python unificadas
```

---

## 🧠 Entidades del sistema

### 1. TRABAJO — Entidad principal

El trabajo es el centro de todo. Representa una obra/proyecto de instalación eléctrica.

**Flujo de estado:** `pendiente → en_curso → completado → (facturado en Holded)`

**Campos principales (PostgreSQL — `trabajos`):**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL PK | ID numérico |
| `codigo_trabajo` | VARCHAR(20) | Código legible (TRB-2026-NNNN) |
| `titulo` | VARCHAR(255) | Título del trabajo |
| `descripcion` | TEXT | Descripción detallada |
| `cliente_id` | FK → clientes | Cliente asociado |
| `cliente_nombre` | VARCHAR | Nombre denormalizado |
| `estado` | VARCHAR | pendiente, en_curso, completado, cancelado |
| `prioridad` | VARCHAR | baja, media, alta, urgente |
| `fecha_inicio` / `fecha_fin_estimada` / `fecha_fin_real` | DATE | Fechas |
| `obra_calle`, `obra_numero`, `obra_municipio`, `obra_provincia` | VARCHAR | Dirección de obra |
| `total_horas`, `coste_materiales`, `coste_mano_obra`, `coste_total` | NUMERIC | Costes calculados |

**Sub-entidades del trabajo:**

- **Checklist** (`trabajo_checklist`): Tareas con descripción, fecha, completada/NO
- **Tiempos** (`trabajo_tiempos`): Registro de horas trabajadas por fecha
- **Materiales** (`trabajo_materiales`): Materiales usados (cantidad, precio, FK a materiales)
- **Comentarios** (`comentarios`): Comentarios polimórficos (entity_type='trabajo')
- **Técnicos asignados** (`trabajo_tecnicos`): N:M con técnicos del catálogo + horas dedicadas
- **Adjuntos** (`adjuntos`): archivos subidos (foto, pdf, audio, documento) con ruta en disco y metadatos

**Campos adicionales (en BD):**

- `holded_cliente_id`: ID del cliente en Holded (para sincronización futura)

### 2. CLIENTE

Clientes de Franc. Sincronizados bidireccionalmente con Holded (pendiente de implementar).

**Campos:** nombre, apellidos, nif_cif, teléfono, email, dirección completa, forma de pago, IBAN, notas, etc.

### 3. MATERIAL (catálogo)

Catálogo de productos eléctricos. Sincronizado con catálogo de Holded.

**Campos:** nombre, descripción, categoría (cables, proteccion_electrica, etc.), precio, unidad_medida (ud, m, kg), stock, fabricante.

### 4. PRESUPUESTO

Documento comercial generado desde un trabajo o directamente. **Las líneas** (`presupuesto_lineas`) son el detalle con descripción, cantidad, precio_unitario, importe.

### 5. FACTURA

Documento fiscal. **Las líneas** (`factura_lineas`) son el detalle. Estados: pendiente, pagada, vencida, cobrada.

### 6. OPORTUNIDAD

Seguimiento comercial: clientes potenciales, presupuesto estimado, probabilidad de cierre.

### 7. EVENTO (calendario)

Eventos vinculados a trabajos, reuniones o tareas personales. Con color, ubicación, duración.

---

## 🌐 API REST (FastAPI :8000)

Todas las rutas bajo `/api/`. Proxy desde Vite en desarrollo.

### Endpoints principales

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/clientes` | GET/POST | Listar / Crear clientes |
| `/api/clientes/{id}` | GET/PATCH | Obtener / Actualizar cliente |
| `/api/trabajos` | GET/POST | Listar (filtro estado) / Crear trabajo |
| `/api/trabajos/{id}` | GET/PATCH | Obtener (con sub-entidades) / Actualizar |
| `/api/trabajos/{id}/checklist` | GET/POST | Checklist del trabajo |
| `/api/trabajos/{id}/tiempos` | POST | Registrar horas |
| `/api/trabajos/{id}/materiales` | POST | Añadir material usado |
| `/api/trabajos/{id}/adjuntos` | POST | Subir adjunto (multipart) |
| `/api/trabajos/{id}/comentarios` | GET/POST | Comentarios del trabajo |
| `/api/checklist/{id}` | PATCH | Completar tarea |
| `/api/presupuestos` | GET/POST | Presupuestos |
| `/api/presupuestos/{id}` | GET/PATCH | Detalle / Actualizar |
| `/api/presupuestos/{id}/lineas` | GET/POST | Líneas de presupuesto |
| `/api/facturas` | GET/POST | Facturas |
| `/api/facturas/{id}` | GET/PATCH | Detalle / Actualizar |
| `/api/facturas/{id}/lineas` | GET/POST | Líneas de factura |
| `/api/oportunidades` | GET/POST | Oportunidades |
| `/api/oportunidades/{id}` | GET/PATCH | Detalle / Actualizar |
| `/api/materiales` | GET/POST | Catálogo de materiales |
| `/api/tecnicos` | GET/POST | Catálogo de técnicos |
| `/api/tecnicos/{id}` | GET/PATCH/DELETE | Detalle / actualizar / eliminar |
| `/api/trabajos/{id}/tecnicos` | GET/POST | Técnicos asignados al trabajo |
| `/api/trabajos/{id}/tecnicos/{tid}` | DELETE | Desasignar técnico |
| `/api/trabajos/{id}/adjuntos` | GET/POST | Listar / subir adjuntos |
| `/api/adjuntos/{id}/download` | GET | Descargar archivo |
| `/api/adjuntos/{id}` | DELETE | Eliminar adjunto |
| `/api/calendario/eventos` | GET/POST | Eventos |
| `/api/calendario/eventos/{id}` | PATCH/DELETE | Actualizar / Eliminar evento |
| `/api/docs` | GET | Swagger UI |

### Formato de respuesta

```json
// Listado
[{ "id": 1, "nombre": "María García", ... }]

// Detalle de trabajo (con sub-entidades)
{
  "id": 1,
  "titulo": "Instalación eléctrica cocina",
  "estado": "pendiente",
  "cliente_nombre": "María García",
  "checklist": [{ "id": 1, "descripcion": "...", "completada": false }],
  "tiempos": [{ "fecha": "2026-06-01", "horas": 3.0, "descripcion": "..." }],
  "materiales": [{ "nombre": "Cable 2.5mm²", "cantidad": 20, "precio_unitario": 3.50 }],
  "comentarios": [{ "autor": "Franc", "contenido": "...", "fecha_creacion": "..." }],
  "tecnicos_asignados": [{ "nombre": "Franc", "horas": 4 }],
  "adjuntos": [{ "tipo": "foto", "nombre": "cuadro.jpg", "ruta": "..." }]
}
```

### Códigos de estado

- `200 OK`: Respuesta exitosa
- `201 Created`: Recurso creado
- `400 Bad Request`: Datos inválidos
- `404 Not Found`: Recurso no encontrado
- `422 Unprocessable`: Error de validación Pydantic

---

## 💾 Almacenamiento

El sistema usa **PostgreSQL 16** como única fuente de verdad:

- Base de datos: `ai_first_autonomos`
- Socket: `~/pg-data/sockets`
- API: `localhost:8000` (FastAPI)
- Migraciones en `db/migrations/` (aplicar en orden numérico)
- Credenciales y paths en `.env` (ver `.env.example`)
- Archivos subidos (adjuntos) en `data/uploads/{trabajo_id}/` (gitignored)

---

## 🎨 Frontend React (web/)

### Rutas

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/` | Dashboard | Resumen general |
| `/clientes` | ClienteList | Lista + modal crear/editar |
| `/clientes/:id` | ClienteDetail | Detalle del cliente |
| `/trabajos` | TrabajoList | Lista de trabajos |
| `/trabajos/:id` | TrabajoDetail | Detalle con pestañas |
| `/presupuestos` | PresupuestoList | Lista + modal |
| `/presupuestos/:id` | PresupuestoDetail | Detalle con líneas |
| `/facturas` | FacturaList | Lista + modal |
| `/facturas/:id` | FacturaDetail | Detalle con líneas |
| `/oportunidades` | OportunidadList | Lista + modal |
| `/oportunidades/:id` | OportunidadDetail | Detalle |
| `/materiales` | MaterialList | Catálogo |
| `/calendario` | CalendarioPage | Calendario |

### Componentes principales del detalle de trabajo

```
TrabajoDetail
├── Info (tab por defecto)
├── Checklist (ChecklistSection)
│   ├── Añadir tarea
│   ├── Marcar completada
│   └── Lista con checkboxes
├── Técnicos (TecnicosSection) ← NUEVO
│   ├── Añadir técnico + horas
│   ├── Lista con avatar, especialidad
│   └── Quitar técnico
├── Tiempos (TiemposSection)
│   ├── Registrar horas
│   └── Historial por fecha
├── Materiales (MaterialesSection)
│   ├── Añadir material del catálogo
│   └── Lista con cantidades y precios
├── Adjuntos (AdjuntosSection) ← NUEVO
│   ├── Subir foto/PDF/audio
│   ├── Vista previa por tipo
│   └── Metadatos (fecha, subido por)
└── Comentarios (ComentariosSection)
    ├── Escribir comentario
    └── Timeline de comentarios
```

### API calls (frontend → backend)

Todas pasan por `web/src/api/client.ts` que usa `fetch` nativo (con soporte para `FormData`).
Las rutas de API están prefijadas con `/api/` y el proxy de Vite redirige a `localhost:8000`.

### Convenciones del frontend

- **Estados**: definidos en `web/src/lib/constants.ts` con label + color
- **Tipos**: en `web/src/types/` — archivos separados por entidad
- **Componentes compartidos**: en `components/shared/` (Loading, Error, Empty, PageHeader, StatusBadge)
- **Layout**: AppLayout con Sidebar (desktop) y MobileNav (móvil)
- **Iconos**: Lucide React
- **Estilos**: Tailwind CSS 4 + tailwind-merge para composición
- **Data fetching**: React Query (TanStack Query) con staleTime 30s
- **Formularios**: react-hook-form + zod
- **Colores sidebar**: `bg-white border-r` con active state `bg-blue-50` (tema claro)

---

## 🔌 MCP Holded (integración externa)

### Estado: ⏳ Pendiente de API key

**Servidor MCP:** `@energio/holded-mcp` v1.5.0
**Entorno:** Node.js 22.22.0
**Herramientas disponibles:** +140 tools para facturación, contabilidad, inventario

### Módulos Holded habilitados

- `invoicing`: Clientes, productos, documentos (facturas, presupuestos, albaranes)
- `accounting`: Plan contable, asientos, informes

### Auditoría de seguridad (completada)

Veredicto: 🟡 USAR CON MODIFICACIONES
- 4 críticos (soft-delete, confirmaciones, módulos restringidos)
- 4 altos (logs, rate limiting, validaciones)
- Pendiente aplicar mitigaciones

### Flujo de datos Free Works ↔ Holded (diseñado)

```
1. Usuario crea trabajo con cliente "María García"
2. Sync layer busca en Holded por nombre
3a. Si existe → vincula holded_id al trabajo
3b. Si no existe → crea cliente en Holded primero
4. Usuario completa trabajo
5. Opción: generar factura en Holded desde el trabajo
6. Holded gestiona Verifactu, contabilidad, etc.
```

### Capa de sincronización: `sync/holded/sync.py`

Clase `HoldedSync` con métodos:
- `find_client(name, phone)` → buscar cliente en Holded
- `sync_client(data)` → crear/actualizar
- `sync_product(data)` → sincronizar material
- `create_estimate(data)` → crear presupuesto
- `create_invoice(data)` → crear factura

Actualmente son placeholders. Pendiente implementar llamadas MCP reales.

---

## 🤖 Integración con IA (Hermes Agent / JARVIS)

### Arquitectura de agentes

```
Usuario (Telegram/Voz)
       │
       ▼
┌──────────────────┐
│  JARVIS (Agente   │
│  principal)       │
│  DeepSeek V4 Flash│
│  Rol: razonar,    │
│  coordinar, hablar│
│  con el usuario   │
└────────┬─────────┘
         │ delegate_task
         ▼
┌──────────────────┐
│  Subagente        │
│  MiniMax M3       │
│  Rol: código,     │
│  debugging,       │
│  implementación   │
│  técnica           │
└──────────────────┘
```

### Capacidades de JARVIS

- **Voz**: STT (transcripción) → razonamiento → TTS (Supertonic, español)
- **Gestión del sistema**: CRUD de trabajos, clientes, presupuestos, facturas
- **Automatización**: crones, recordatorios, pipeline de contenido
- **Subagente de código**: MiniMax M3 para tareas técnicas (delegado vía `delegate_task`)

### Configuración de delegación

```yaml
delegation:
  provider: minimax
  model: MiniMax-M3
```

---

## 🗺️ Roadmap y estado actual

| Fase | Descripción | Estado | Detalle |
|------|-------------|--------|---------|
| **1** | Core: trabajos, checklist, tiempos, materiales, técnicos, adjuntos, clientes | ✅ Completado | CRUD completo, sub-entidades, frontend con técnicos y adjuntos |
| **2** | Conector Holded MCP | ⏳ Bloqueado | Pendiente API key de Holded |
| **3** | Presupuestos + facturación → Holded | ⏳ | Diseñado, no implementado |
| **4** | Asistente IA por voz completo | ⏳ | JARVIS operativo, mejorar integración |
| **5** | Dashboard y reporting | ⏳ | No iniciado |

### Pendientes inmediatos

1. **API key de Holded** — Configurar MCP `@energio/holded-mcp` con la clave
2. **Aplicar mitigaciones de seguridad** — Soft-delete, confirmaciones, módulos restringidos
3. **Implementar `sync/holded/sync.py`** — Llamadas reales al MCP
4. **Implementar página dedicada de Técnicos** (ahora se gestionan desde el detalle del trabajo)

---

## ⚙️ Cómo ejecutar

### Backend (API + PostgreSQL)

```bash
# 1. Copia .env.example a .env y rellena credenciales
cp .env.example .env

# 2. Instala dependencias
pip install -r requirements.txt

# 3. Aplica migraciones (en orden numérico)
psql -h $(grep DB_HOST .env | cut -d= -f2) -U $(grep DB_USER .env | cut -d= -f2) \
  -d $(grep DB_NAME .env | cut -d= -f2) \
  -f db/migrations/00{1,2,3,4}_*.sql

# 4. Inicia el stack
./db/start.sh
# API en http://localhost:8000/docs
```

### Frontend

```bash
cd web
npm install
npm run dev
# UI en http://localhost:5173 (con proxy /api → :8000)
```

### MCP Holded (cuando tengas API key)

```bash
hermes mcp add holded --command "npx -y @energio/holded-mcp" \
  --env "HOLDED_API_KEY=tu-api-key" \
  --env "HOLDED_MODULES=invoicing,accounting"
```

---

## 🚨 Convenciones y reglas importantes

### Para cualquier IA que trabaje en este proyecto

1. **No inventar datos.** Si algo no existe o no se puede verificar, decirlo.
2. **Preferir JSON para datos estructurados e intercambio** (no usamos YAML).
3. **Soft-delete siempre** (activo=false). Nunca DELETE real a menos que se pida explícitamente.
4. **Confirmación humana** para operaciones destructivas en Holded (delete, pay, send).
5. **Time zone: CEST (UTC+2)** — Todos los horarios en hora local española.
6. **Idioma: español** — Código en inglés/spanglish, comentarios y UI en español.
7. **El frontend React usa `@/` alias** que resuelve a `web/src/`.
8. **Proxy de Vite**: `/api` → `localhost:8000`. No cambiar en desarrollo.
9. **No modificar `archive/`** — Es código legacy congelado.
10. **Estados de trabajo**: solo `pendiente → en_curso → completado → cancelado`.
11. **Los adjuntos son archivos locales** (fotos, PDFs, audios) con ruta en `data/uploads/`.
12. **Los técnicos** se gestionan desde el catálogo (`/api/tecnicos`) y se asignan a trabajos vía `trabajo_tecnicos`.
13. **Comentarios**: tabla polimórfica `comentarios` (entity_type + entity_id) para cualquier entidad.
14. **Git**: subir cambios con `git add -A && git commit -m "..." && git push origin main`.

### Para el subagente MiniMax M3

- Se le delegan tareas de código vía `delegate_task`
- No tiene acceso a memoria persistente ni a la conversación actual
- Debe recibir contexto completo en cada delegación
- Trabaja sobre archivos del repositorio y ejecuta en terminal

---

## 🔗 Referencias rápidas

| Recurso | Ruta |
|---------|------|
| Schema BD completo | `db/migrations/001_schema.sql` |
| Modelos Pydantic (request/response) | `db/api.py` (sección "Pydantic Models") |
| API endpoints | `db/api.py` |
| MCP tools | `db/mcp_server.py` |
| Sync Holded (placeholder) | `sync/holded/sync.py` |
| Frontend types | `web/src/types/` |
| Frontend constants | `web/src/lib/constants.ts` |
| Frontend layout | `web/src/components/layout/` |
| Frontend API client | `web/src/api/` |
| Arquitectura | `ARQUITECTURA.md` |
| Uploads (adjuntos) | `data/uploads/` |
| Plantilla env | `.env.example` |
| Auditoría MCP | `/home/ai/HOLDED_MCP_SECURITY_AUDIT.md` |

---

> *"Free Works no es un ERP. Es un asistente inteligente para el día a día que usa Holded como backend financiero."*

# 🛠️ Free Works

**Gestor de trabajos con IA + Holded ERP**

Free Works es un asistente inteligente para autónomos técnicos (electricistas, fontaneros, carpinteros...) que gestiona el día a día de los trabajos y se conecta con Holded para la facturación y contabilidad.

> No es un ERP. Es un gestor de trabajos con IA que usa Holded como backend financiero.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + TypeScript 6 + Vite 8 + Tailwind 4 |
| Backend | Python 3.11+ (FastAPI) + PostgreSQL 16 |
| IA | Hermes Agent (DeepSeek V4) + subagente MiniMax M3 |
| ERP externo | Holded (vía MCP `@energio/holded-mcp`) |
| Voz | Supertonic TTS (español) |

---

## Estructura

```
free-works/
├── web/            # Frontend React (trabajos, checklist, etc.)
├── db/             # PostgreSQL migrations + FastAPI server + MCP server
├── sync/holded/    # Capa de sincronización con Holded (placeholder)
├── mcp/            # Documentación MCP de Holded
├── adjuntos/       # Módulo de archivos multimedia (uploads)
├── tecnicos/       # Documentación de gestión de técnicos
├── data/uploads/   # Archivos subidos (gitignored)
├── docs/           # OpenAPI, Swagger UI, planes
├── archive/        # Código legacy del ERP anterior
├── AGENTS.md       # Contexto completo para IAs
├── ARQUITECTURA.md # Documento de arquitectura
└── README.md
```

---

## Core: Gestión de Trabajos

La entidad principal es el **Trabajo**. Cada trabajo tiene:

- **Cliente** (sincronizado desde Holded)
- **Checklist** de tareas
- **Técnicos** asignados (catálogo de técnicos + horas dedicadas)
- **Materiales** instalados (vinculados al catálogo)
- **Horas** registradas por fecha
- **Comentarios**
- **Adjuntos** (fotos, PDFs, notas de voz) — subidos al servidor
- **Estado** (`pendiente → en_curso → completado → cancelado`)

---

## Conexión con Holded

Free Works se conecta a Holded mediante el MCP server `@energio/holded-mcp`.

| Función | Free Works | Holded |
|---------|-----------|--------|
| Clientes | Selector + visualización | Fuente de datos |
| Productos/Materiales | Selección en obra | Catálogo oficial |
| Presupuestos | Creación rápida con IA | Documento legal |
| Facturas | Generación desde trabajo | Factura + Verifactu |
| Contabilidad | Consulta de estado | Libros oficiales |
| Verifactu | — | ✅ Holded lo cumple |

> **Estado**: pendiente de API key de Holded. `sync/holded/sync.py` es un placeholder con la firma prevista.

---

## Estado del proyecto

| Fase | Descripción | Estado |
|------|-------------|--------|
| 1 | Core: trabajos, checklist, tiempos, materiales, técnicos, adjuntos | ✅ Completado |
| 2 | Conector Holded MCP | ⏳ Pendiente API key |
| 3 | Presupuestos y facturación → Holded | ⏳ |
| 4 | Asistente IA por voz (JARVIS) | ⏳ |
| 5 | Dashboard y reporting | ⏳ |

---

## Configuración inicial

```bash
# 1. Copia el .env.example a .env y rellena credenciales
cp .env.example .env

# 2. Instala dependencias Python
pip install -r requirements.txt

# 3. Aplica migraciones de BD (asume PostgreSQL corriendo)
psql -h /home/ai/pg-data/sockets -U ai_first -d ai_first_autonomos \
  -f db/migrations/001_schema.sql
psql -h /home/ai/pg-data/sockets -U ai_first -d ai_first_autonomos \
  -f db/migrations/002_calendario.sql
psql -h /home/ai/pg-data/sockets -U ai_first -d ai_first_autonomos \
  -f db/migrations/003_normalize_activo.sql
psql -h /home/ai/pg-data/sockets -U ai_first -d ai_first_autonomos \
  -f db/migrations/004_tecnicos_adjuntos.sql

# 4. Inicia el stack
./db/start.sh
```

---

## Desarrollo

```bash
# Backend
cd db && python api.py
# API en http://localhost:8000/docs

# Frontend
cd web && npm install && npm run dev
# UI en http://localhost:5173 (con proxy /api → :8000)

# MCP Holded (cuando tengas API key)
hermes mcp add holded --command "npx -y @energio/holded-mcp" \
  --env "HOLDED_API_KEY=tu-api-key" \
  --env "HOLDED_MODULES=invoicing,accounting"
```

---

## Licencia

MIT — Franc Pérez

# 🛠️ Free Works

**Gestor de trabajos con IA + Holded ERP**

Free Works es un asistente inteligente para autónomos técnicos (electricistas, fontaneros, carpinteros...) que gestiona el día a día de los trabajos y se conecta con Holded para la facturación y contabilidad.

> No es un ERP. Es un gestor de trabajos con IA que usa Holded como backend financiero.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React + TypeScript + Vite |
| Backend | Python (FastAPI) + PostgreSQL |
| Datos locales | YAML (fuente de verdad ligera) |
| ERP externo | Holded (vía MCP) |
| IA | Hermes Agent + DeepSeek V4 + MiniMax M3 |
| Voz | Supertonic TTS (español) |

---

## Estructura

```
free-works/
├── core/           # Lógica de negocio (trabajos, modelos)
├── web/            # Frontend React (trabajos, checklist, etc.)
├── db/             # PostgreSQL schema + API server
├── sync/holded/    # Capa de sincronización con Holded
├── mcp/            # Configuración del MCP de Holded
├── tecnicos/       # Gestión de técnicos
├── adjuntos/       # Gestión de archivos multimedia
├── skills/         # Skills para Hermes Agent
├── archive/        # Código legacy del ERP anterior
├── ARQUITECTURA.md # Documento de arquitectura
└── README.md
```

---

## Core: Gestión de Trabajos

La entidad principal es el **Trabajo**. Cada trabajo tiene:

- **Cliente** (sincronizado desde Holded)
- **Checklist** de tareas
- **Técnicos** asignados (quién y cuántas horas)
- **Materiales** instalados (vinculados al catálogo de Holded)
- **Horas** registradas (por técnico)
- **Comentarios**
- **Adjuntos** (fotos, PDFs, notas de voz)
- **Estado** (pendiente → en_curso → completado → facturado)

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

---

## Estado del proyecto

| Fase | Descripción | Estado |
|------|-------------|--------|
| 1 | Core trabajos + checklist + tiempos + técnicos | 🔄 Adaptando |
| 2 | Conector Holded MCP | ⏳ Pendiente API key |
| 3 | Presupuestos y facturación | ⏳ |
| 4 | Asistente IA por voz | ⏳ |
| 5 | Dashboard y reporting | ⏳ |

---

## Desarrollo

```bash
# Backend
cd db && pip install -r requirements-api.txt && ./start.sh

# Frontend
cd web && npm install && npm run dev

# MCP Holded
hermes mcp add holded --command "npx -y @energio/holded-mcp" \
  --env "HOLDED_API_KEY=tu-api-key" \
  --env "HOLDED_MODULES=invoicing,accounting"
```

---

## Licencia

MIT — Franc Pérez

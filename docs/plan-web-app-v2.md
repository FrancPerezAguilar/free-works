# Plan de Desarrollo v2 — Web App React · AI-First Autónomos

> Versión refinada del plan original. Más pragmático, concreto, y orientado a un electricista autónomo real.
> Reemplaza a `plan-web-app.md`.

---

## 1. Stack tecnológico (sin cambios, confirmado)

| Capa | Tecnología | Nota |
|---|---|---|
| **Framework** | React 19 + TypeScript | Tipos compartibles con futura RN |
| **Build** | Vite 6 | Rápido, proxy dev, PWA plugin |
| **Routing** | React Router v7 | Nested routes, layouts |
| **Estado servidor** | TanStack Query v5 | Caching, mutations, misma API en RN |
| **HTTP** | ky | Liviano, tipado, funciona en RN con polyfill |
| **UI** | Tailwind CSS v4 + shadcn/ui | Componentes accesibles, tema CSS |
| **Formularios** | React Hook Form + Zod | Validación tipada |
| **PWA** | vite-plugin-pwa | SW, manifest, instalable |
| **Iconos** | Lucide React | Ligeros, tree-shakeables |

---

## 2. Arquitectura UI (refinada)

### 2.1 Desktop (≥768px)

```
┌──────────────────────────────────────────────────────┐
│  <AppLayout>                                          │
│  ┌────────┬─────────────────────────────────────────┐ │
│  │        │  <TopBar>: breadcrumb + buscador        │ │
│  │Sidebar │  ────────────────────────────────────── │ │
│  │ 240px  │  <Outlet /> (contenido)                 │ │
│  │        │                                          │ │
│  └────────┴─────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### 2.2 Mobile (<768px)

```
┌──────────────────────┐
│  <TopBar>: título    │  ← sin breadcrumb, solo título
│  ──────────────────  │
│                      │
│  <Outlet />          │
│  (contenido)         │
│                      │
│  ──────────────────  │
│  [🏠] [📋] [📅] [⚙] │  ← bottom nav (4-5 ítems)
└──────────────────────┘
```

**Reglas de layout responsive:**
- Sidebar → `hidden md:flex` (lateral fijo) / `fixed bottom-0 md:hidden` (bottom nav)
- Breadcrumb → `hidden md:flex`
- Tablas → `hidden md:table` / cards en móvil (`md:hidden`)

### 2.3 Sidebar ítems

```
📊 Dashboard      → /
👥 Clientes       → /clientes
📋 Trabajos       → /trabajos
💰 Presupuestos   → /presupuestos
📄 Facturas       → /facturas
🎯 Oportunidades  → /oportunidades
📦 Materiales     → /materiales
📅 Calendario     → /calendario
```

Móvil: solo los 4-5 más usados (Dashboard, Trabajos, Clientes, Calendario, Facturas).

---

## 3. Rutas (simplificadas: crear/editar → modales)

```
/                          → Dashboard
/clientes                  → ClienteList (crear/editar vía modal, no ruta separada)
/clientes/:id              → ClienteDetail (ficha + trabajos del cliente)

/trabajos                  → TrabajoList (crear vía modal rápido)
/trabajos/:id              → TrabajoDetail (tabs: checklist, tiempos, comentarios)
/trabajos/:id/editar       → TrabajoForm (página aparte — es complejo)

/presupuestos              → PresupuestoList
/presupuestos/:id          → PresupuestoDetail (vista imprimible + modal editar)
/presupuestos/nuevo        → PresupuestoForm (página — editor de líneas complejo)

/facturas                  → FacturaList
/facturas/:id              → FacturaDetail (vista imprimible)
/facturas/nueva            → FacturaForm (página — líneas)

/oportunidades             → OportunidadList (columnas por estado, sin drag)
/oportunidades/:id         → OportunidadDetail (modal o drawer)

/materiales                → MaterialList (añadir vía modal)
/calendario                → Calendario (vista semana/mes)
```

**Principio**: si el formulario tiene ≤5 campos → modal. Si es complejo (líneas de presupuesto, checklist) → página propia.

---

## 4. Endpoints ↔ Componentes (mapeo completo corregido)

### Clientes
| Endpoint | Uso | Query/Mutation |
|---|---|---|
| `GET /api/clientes?activo=true` | ClienteList | useQuery |
| `GET /api/clientes/{id}` | ClienteDetail | useQuery |
| `POST /api/clientes` | ClienteList → modal crear | useMutation |
| `PATCH /api/clientes/{id}` | ClienteDetail → modal editar | useMutation |

### Trabajos
| Endpoint | Uso |
|---|---|
| `GET /api/trabajos?estado=&activo=true` | TrabajoList |
| `GET /api/trabajos/{id}` | TrabajoDetail (incluye checklist, tiempos) |
| `POST /api/trabajos` | TrabajoList → modal rápido |
| `PATCH /api/trabajos/{id}` | TrabajoForm, cambio estado, soft delete |
| `GET /api/trabajos/{id}/checklist` | TrabajoDetail → ChecklistTab |
| `POST /api/trabajos/{id}/checklist` | ChecklistTab → añadir tarea |
| `PATCH /api/checklist/{id}` | ChecklistTab → marcar completada ✅ |
| `POST /api/trabajos/{id}/tiempos` | TrabajoDetail → TiemposTab |
| `GET /api/trabajos/{id}/comentarios` | TrabajoDetail → ComentariosTab |
| `POST /api/trabajos/{id}/comentarios` | ComentariosTab → enviar |

### Presupuestos
| Endpoint | Uso |
|---|---|
| `GET /api/presupuestos?estado=` | PresupuestoList |
| `GET /api/presupuestos/{id}` | PresupuestoDetail |
| `POST /api/presupuestos` | PresupuestoForm |
| `PATCH /api/presupuestos/{id}` | Editar / cambiar estado |
| `DELETE /api/presupuestos/{id}` | Soft delete |
| `GET /api/presupuestos/{id}/lineas` | PresupuestoForm/Detail → lineas |
| `POST /api/presupuestos/{id}/lineas` | Editor de líneas |

### Facturas
| Endpoint | Uso |
|---|---|
| `GET /api/facturas?estado_pago=` | FacturaList |
| `GET /api/facturas/{id}` | FacturaDetail |
| `POST /api/facturas` | FacturaForm |
| `PATCH /api/facturas/{id}` | Editar / cambiar estado pago |
| `DELETE /api/facturas/{id}` | Soft delete |
| `GET /api/facturas/{id}/lineas` | lineas |
| `POST /api/facturas/{id}/lineas` | Editor de líneas |

### Oportunidades
| Endpoint | Uso |
|---|---|
| `GET /api/oportunidades?estado=` | OportunidadList |
| `GET /api/oportunidades/{id}` | OportunidadDetail |
| `POST /api/oportunidades` | Modal crear |
| `PATCH /api/oportunidades/{id}` | Cambiar estado / editar |
| `DELETE /api/oportunidades/{id}` | Soft delete |

### Materiales
| Endpoint | Uso |
|---|---|
| `GET /api/materiales?categoria=` | MaterialList |
| `POST /api/materiales` | Modal añadir |

### Calendario
| Endpoint | Uso |
|---|---|
| `GET /api/calendario?fecha=` | Calendario → día |
| `GET /api/calendario/rango?desde=&hasta=` | Calendario → semana/mes |
| `POST /api/calendario` | Modal crear evento |
| `PATCH /api/calendario/{id}` | Editar evento |
| `DELETE /api/calendario/{id}` | Soft delete |

### Dashboard
| Endpoint | Uso |
|---|---|
| `GET /api/tareas/fecha/{fecha}` | Dashboard → Tareas de hoy |
| `GET /api/trabajos?estado=pendiente` | Dashboard → Trabajos pendientes |
| `GET /api/facturas?estado_pago=pendiente` | Dashboard → Facturas por cobrar |
| `GET /api/calendario/rango` (hoy+7d) | Dashboard → Próximos eventos |

---

## 5. Estructura del proyecto (refinada)

```
web/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tailwind.config.ts          # v4 — @tailwind base en CSS
├── public/
│   ├── manifest.json
│   ├── icon-192.png
│   └── icon-512.png
└── src/
    ├── main.tsx                 # ReactDOM + QueryClientProvider + RouterProvider
    ├── App.tsx                  # Router + layout wrapper
    ├── index.css                # Tailwind imports + tema CSS
    │
    ├── api/
    │   ├── client.ts            # ky.create({ prefixUrl: '/api' })
    │   ├── clientes.ts
    │   ├── trabajos.ts
    │   ├── presupuestos.ts
    │   ├── facturas.ts
    │   ├── oportunidades.ts
    │   ├── materiales.ts
    │   ├── calendario.ts
    │   └── comentarios.ts
    │
    ├── types/
    │   ├── cliente.ts
    │   ├── trabajo.ts
    │   ├── presupuesto.ts
    │   ├── factura.ts
    │   ├── oportunidad.ts
    │   ├── material.ts
    │   ├── calendario.ts
    │   └── common.ts            # ApiResponse<T>, Pagination, etc.
    │
    ├── lib/
    │   ├── constants.ts         # Estados, colores, labels en español
    │   ├── utils.ts             # formatCurrency, formatDate, cn()
    │   └── validations.ts       # Schemas Zod compartidos
    │
    ├── components/
    │   ├── ui/                  # shadcn/ui (button, input, card, dialog, badge...)
    │   ├── layout/
    │   │   ├── AppLayout.tsx    # Sidebar + TopBar + Outlet
    │   │   ├── Sidebar.tsx      # Desktop sidebar + mobile bottom nav
    │   │   ├── TopBar.tsx       # Breadcrumb (desktop) / título (mobile)
    │   │   └── MobileNav.tsx    # Bottom navigation bar
    │   └── shared/
    │       ├── StatusBadge.tsx      # Badge coloreado por estado
    │       ├── DataTable.tsx        # Tabla (desktop) + cards (mobile)
    │       ├── PageHeader.tsx       # Título + botón crear
    │       ├── ConfirmDialog.tsx    # Confirmación destructiva
    │       ├── EmptyState.tsx       # "No hay datos" con icono
    │       ├── LoadingState.tsx     # Skeleton
    │       ├── ErrorState.tsx       # Error con botón retry
    │       └── SearchInput.tsx      # Input de búsqueda con debounce
    │
    ├── pages/
    │   ├── Dashboard.tsx
    │   ├── clientes/
    │   │   ├── ClienteList.tsx
    │   │   ├── ClienteDetail.tsx
    │   │   └── ClienteFormModal.tsx    # Modal crear/editar
    │   ├── trabajos/
    │   │   ├── TrabajoList.tsx
    │   │   ├── TrabajoDetail.tsx       # Tabs container
    │   │   ├── TrabajoForm.tsx         # Página crear/editar
    │   │   ├── TrabajoCreateModal.tsx  # Modal rápido
    │   │   ├── ChecklistTab.tsx
    │   │   ├── TiemposTab.tsx
    │   │   └── ComentariosTab.tsx
    │   ├── presupuestos/
    │   │   ├── PresupuestoList.tsx
    │   │   ├── PresupuestoDetail.tsx
    │   │   ├── PresupuestoForm.tsx
    │   │   └── LineasEditor.tsx        # Componente reutilizable (presupuesto + factura)
    │   ├── facturas/
    │   │   ├── FacturaList.tsx
    │   │   ├── FacturaDetail.tsx
    │   │   └── FacturaForm.tsx
    │   ├── oportunidades/
    │   │   ├── OportunidadList.tsx     # Columnas por estado
    │   │   └── OportunidadFormModal.tsx
    │   ├── materiales/
    │   │   └── MaterialList.tsx        # + modal añadir inline
    │   └── calendario/
    │       ├── CalendarioPage.tsx
    │       └── EventoFormModal.tsx
    │
    └── hooks/
        └── use-debounce.ts         # si hace falta
```

---

## 6. Plan de fases (recalculado — 4 fases, ~8 sesiones)

### Fase 1 — Esqueleto funcional (1 sesión) 🔴 PRIORITARIA
Scaffold + layout + routing + API client + primera página real (clientes).

**Entregable**: app que arranca, muestra layout con sidebar, y lista clientes desde la API real.

### Fase 2 — Trabajos + Materiales (2 sesiones)
Entidad central del ERP. TrabajoDetail con tabs. Catálogo de materiales.

### Fase 3 — Presupuestos + Facturas (2 sesiones)
Documentos con editor de líneas. Flujo negocio completo.

### Fase 4 — Oportunidades + Calendario + Dashboard + PWA (2-3 sesiones)
Pipeline comercial, agenda, métricas, polish responsive y PWA.

---

## 7. Fase 1 — Plan CONCRETO (archivos, orden, comandos)

### Paso 0: Prerrequisitos

```bash
# Verificar Node.js
node --version   # ≥ 20

# Posicionarse en el proyecto
cd ~/ai-first-autonomos
mkdir -p web
cd web
```

### Paso 1: Scaffold Vite + React + TS

```bash
npm create vite@latest . -- --template react-ts
npm install
```

### Paso 2: Instalar dependencias

```bash
# UI + estilos
npm install tailwindcss @tailwindcss/vite
npm install lucide-react

# Routing
npm install react-router-dom

# Estado servidor
npm install @tanstack/react-query

# HTTP client
npm install ky

# Formularios
npm install react-hook-form @hookform/resolvers zod

# PWA
npm install vite-plugin-pwa -D

# Utilidades
npm install clsx tailwind-merge
```

### Paso 3: Inicializar Tailwind v4

Tailwind v4 usa CSS-first config. Crear `src/index.css`:

```css
@import "tailwindcss";
```

Y en `vite.config.ts`, añadir el plugin de Tailwind.

### Paso 4: Inicializar shadcn/ui

```bash
npx shadcn@latest init
# Elegir: TypeScript, Tailwind v4, CSS variables, base color Slate
```

Esto crea `components.json` y `src/lib/utils.ts` con la función `cn()`.

### Paso 5: Añadir componentes shadcn/ui necesarios

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add dialog
npx shadcn@latest add badge
npx shadcn@latest add table
npx shadcn@latest add tabs
npx shadcn@latest add skeleton
npx shadcn@latest add select
npx shadcn@latest add textarea
```

### Paso 6: Crear archivos — ORDEN EXACTO

#### 6.1 `src/index.css` (sobrescribir)

```css
@import "tailwindcss";

/* Tema CSS para shadcn/ui */
@theme {
  --color-primary: #2563eb;        /* Azul eléctrico */
  --color-primary-foreground: #ffffff;
  --color-muted: #f3f4f6;
  --color-muted-foreground: #6b7280;
  --color-accent: #f59e0b;         /* Ámbar — warnings, presupuestos */
  --color-success: #10b981;        /* Verde — completado, pagado */
  --color-danger: #ef4444;         /* Rojo — vencido, cancelado */
  --radius: 0.5rem;
}

/* Layout */
html, body, #root {
  height: 100%;
  margin: 0;
}
```

#### 6.2 `src/lib/utils.ts` (shadcn lo crea, verificar)

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

#### 6.3 `src/lib/constants.ts`

```ts
// Estados de trabajo
export const ESTADOS_TRABAJO = {
  pendiente:  { label: "Pendiente",   color: "bg-yellow-100 text-yellow-800" },
  en_curso:   { label: "En curso",    color: "bg-blue-100 text-blue-800" },
  completado: { label: "Completado",  color: "bg-green-100 text-green-800" },
  cancelado:  { label: "Cancelado",   color: "bg-red-100 text-red-800" },
} as const;

// Estados de factura
export const ESTADOS_PAGO = {
  pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
  pagada:    { label: "Pagada",    color: "bg-green-100 text-green-800" },
  vencida:   { label: "Vencida",   color: "bg-red-100 text-red-800" },
  cobrada:   { label: "Cobrada",   color: "bg-gray-100 text-gray-800" },
} as const;

// Estados de presupuesto
export const ESTADOS_PRESUPUESTO = {
  borrador:  { label: "Borrador",  color: "bg-gray-100 text-gray-800" },
  pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
  aceptado:  { label: "Aceptado",  color: "bg-green-100 text-green-800" },
  rechazado: { label: "Rechazado", color: "bg-red-100 text-red-800" },
  vencido:   { label: "Vencido",   color: "bg-orange-100 text-orange-800" },
} as const;

// Estados de oportunidad
export const ESTADOS_OPORTUNIDAD = {
  abierta:          { label: "Abierta",          color: "bg-blue-100 text-blue-800" },
  en_negociacion:   { label: "En negociación",   color: "bg-purple-100 text-purple-800" },
  cerrada_ganada:   { label: "Cerrada (ganada)", color: "bg-green-100 text-green-800" },
  cerrada_perdida:  { label: "Cerrada (perdida)", color: "bg-red-100 text-red-800" },
} as const;

export type EstadoTrabajo = keyof typeof ESTADOS_TRABAJO;
export type EstadoPago = keyof typeof ESTADOS_PAGO;
export type EstadoPresupuesto = keyof typeof ESTADOS_PRESUPUESTO;
export type EstadoOportunidad = keyof typeof ESTADOS_OPORTUNIDAD;
```

#### 6.4 `src/lib/utils.ts` — añadir helpers

```ts
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateLong(date: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}
```

#### 6.5 `src/types/common.ts`

```ts
export interface ApiResponse<T> {
  data: T;
  total?: number;
}

export interface ApiError {
  detail: string;
}
```

#### 6.6 `src/types/cliente.ts`

```ts
export interface Cliente {
  id: number;
  nombre: string;
  apellidos: string | null;
  nif_cif: string | null;
  tipo_cliente: string;
  telefono_principal: string | null;
  email: string | null;
  direccion_calle: string | null;
  direccion_numero: string | null;
  direccion_municipio: string | null;
  direccion_provincia: string | null;
  direccion_codigo_postal: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClienteCreate {
  nombre: string;
  apellidos?: string;
  nif_cif?: string;
  telefono_principal?: string;
  email?: string;
  direccion_calle?: string;
  direccion_numero?: string;
  direccion_municipio?: string;
  direccion_provincia?: string;
  direccion_codigo_postal?: string;
}

export interface ClienteUpdate extends Partial<ClienteCreate> {}
```

#### 6.7 `src/types/trabajo.ts`

```ts
import type { Cliente } from "./cliente";

export interface Trabajo {
  id: number;
  titulo: string;
  descripcion: string | null;
  cliente_id: number | null;
  cliente_nombre: string | null;
  estado: "pendiente" | "en_curso" | "completado" | "cancelado";
  prioridad: "baja" | "media" | "alta" | "urgente";
  obra_municipio: string | null;
  obra_provincia: string | null;
  fecha_inicio: string | null;
  fecha_fin_estimada: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  // Sub-entidades (solo en GET /{id})
  checklist?: ChecklistItem[];
  tiempos?: RegistroTiempo[];
  cliente?: Cliente | null;
}

export interface ChecklistItem {
  id: number;
  trabajo_id: number;
  descripcion: string;
  completado: boolean;
  fecha_programada: string | null;
  hora_programada: string | null;
}

export interface RegistroTiempo {
  id: number;
  trabajo_id: number;
  horas: number;
  descripcion: string | null;
  fecha: string;
}

export interface TrabajoCreate {
  titulo: string;
  descripcion?: string;
  cliente_id?: number;
  cliente_nombre?: string;
  estado?: string;
  prioridad?: string;
  obra_municipio?: string;
}
```

#### 6.8 `src/api/client.ts`

```ts
import ky from "ky";

export const api = ky.create({
  prefixUrl: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  hooks: {
    beforeError: [
      async (error) => {
        const { response } = error;
        if (response?.body) {
          const body = await response.json();
          error.message = (body as { detail?: string }).detail || response.statusText;
        }
        return error;
      },
    ],
  },
});
```

#### 6.9 `src/api/clientes.ts`

```ts
import { api } from "./client";
import type { Cliente, ClienteCreate, ClienteUpdate } from "../types/cliente";

export function getClientes(activo = true) {
  return api.get("clientes", { searchParams: { activo } }).json<Cliente[]>();
}

export function getCliente(id: number) {
  return api.get(`clientes/${id}`).json<Cliente>();
}

export function createCliente(data: ClienteCreate) {
  return api.post("clientes", { json: data }).json<Cliente>();
}

export function updateCliente(id: number, data: ClienteUpdate) {
  return api.patch(`clientes/${id}`, { json: data }).json<Cliente>();
}
```

#### 6.10 `src/api/trabajos.ts`

```ts
import { api } from "./client";
import type { Trabajo, TrabajoCreate, ChecklistItem, RegistroTiempo } from "../types/trabajo";

export function getTrabajos(params?: { estado?: string; activo?: boolean }) {
  return api.get("trabajos", { searchParams: params }).json<Trabajo[]>();
}

export function getTrabajo(id: number) {
  return api.get(`trabajos/${id}`).json<Trabajo>();
}

export function createTrabajo(data: TrabajoCreate) {
  return api.post("trabajos", { json: data }).json<Trabajo>();
}

export function updateTrabajo(id: number, data: Partial<TrabajoCreate> & { estado?: string }) {
  return api.patch(`trabajos/${id}`, { json: data }).json<Trabajo>();
}

export function getChecklist(trabajoId: number) {
  return api.get(`trabajos/${trabajoId}/checklist`).json<ChecklistItem[]>();
}

export function addTareaChecklist(trabajoId: number, data: { descripcion: string; fecha_programada?: string }) {
  return api.post(`trabajos/${trabajoId}/checklist`, { json: data }).json<ChecklistItem>();
}

export function completarTarea(itemId: number) {
  return api.patch(`checklist/${itemId}`).json<ChecklistItem>();
}

export function registrarTiempo(trabajoId: number, data: { horas: number; descripcion?: string; fecha?: string }) {
  return api.post(`trabajos/${trabajoId}/tiempos`, { json: data }).json<RegistroTiempo>();
}

export function getComentarios(trabajoId: number) {
  return api.get(`trabajos/${trabajoId}/comentarios`).json<{ id: number; contenido: string; autor: string; created_at: string }[]>();
}

export function addComentario(trabajoId: number, data: { contenido: string; autor?: string }) {
  return api.post(`trabajos/${trabajoId}/comentarios`, { json: data }).json<{ id: number }>();
}

export function getTareasPorFecha(fecha: string) {
  return api.get(`tareas/fecha/${fecha}`).json<ChecklistItem[]>();
}
```

#### 6.11 `src/components/shared/StatusBadge.tsx`

```tsx
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  estado: string;
  mapping: Record<string, { label: string; color: string }>;
}

export function StatusBadge({ estado, mapping }: Props) {
  const info = mapping[estado];
  if (!info) return <Badge variant="secondary">{estado}</Badge>;

  return (
    <Badge className={cn("font-medium", info.color)} variant="secondary">
      {info.label}
    </Badge>
  );
}
```

#### 6.12 `src/components/shared/LoadingState.tsx`

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
```

#### 6.13 `src/components/shared/EmptyState.tsx`

```tsx
import { Inbox } from "lucide-react";

interface Props {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  title = "No hay datos",
  description = "No se encontraron registros.",
  action,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-4">{description}</p>
      {action}
    </div>
  );
}
```

#### 6.14 `src/components/shared/ErrorState.tsx`

```tsx
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = "Error al cargar los datos", onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h3 className="text-lg font-semibold text-destructive">Error</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Reintentar
        </Button>
      )}
    </div>
  );
}
```

#### 6.15 `src/components/shared/PageHeader.tsx`

```tsx
interface Props {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: Props) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
```

#### 6.16 `src/components/layout/Sidebar.tsx`

```tsx
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Wrench,
  FileText,
  Receipt,
  Target,
  Package,
  Calendar,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/clientes", icon: Users, label: "Clientes" },
  { to: "/trabajos", icon: Wrench, label: "Trabajos" },
  { to: "/presupuestos", icon: FileText, label: "Presupuestos" },
  { to: "/facturas", icon: Receipt, label: "Facturas" },
  { to: "/oportunidades", icon: Target, label: "Oportunidades" },
  { to: "/materiales", icon: Package, label: "Materiales" },
  { to: "/calendario", icon: Calendar, label: "Calendario" },
];

const MOBILE_ITEMS = NAV_ITEMS.filter((item) =>
  ["/", "/trabajos", "/clientes", "/calendario", "/facturas"].includes(item.to)
);

export function Sidebar() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-60 md:fixed md:inset-y-0 bg-card border-r">
        <div className="flex items-center gap-2 px-4 py-4 border-b">
          <Zap className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">ERP Eléctrico</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-50 flex justify-around py-2">
        {MOBILE_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
```

#### 6.17 `src/components/layout/TopBar.tsx`

```tsx
import { useLocation, Link } from "react-router-dom";

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return [{ label: "Dashboard", to: "/" }];

  const crumbs = [{ label: "Inicio", to: "/" }];
  let current = "";

  const labelMap: Record<string, string> = {
    clientes: "Clientes",
    trabajos: "Trabajos",
    presupuestos: "Presupuestos",
    facturas: "Facturas",
    oportunidades: "Oportunidades",
    materiales: "Materiales",
    calendario: "Calendario",
    nuevo: "Nuevo",
    nueva: "Nueva",
    editar: "Editar",
  };

  for (const seg of segments) {
    current += `/${seg}`;
    const label = labelMap[seg] || seg;
    crumbs.push({ label, to: current });
  }

  return crumbs;
}

export function TopBar() {
  const { pathname } = useLocation();
  const breadcrumbs = getBreadcrumbs(pathname);
  const currentTitle = breadcrumbs[breadcrumbs.length - 1]?.label || "Dashboard";

  return (
    <header className="h-14 border-b bg-card flex items-center px-4 gap-4">
      {/* Desktop breadcrumb */}
      <nav className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.to} className="flex items-center gap-1">
            {i > 0 && <span className="mx-1">/</span>}
            {i === breadcrumbs.length - 1 ? (
              <span className="text-foreground font-medium">{crumb.label}</span>
            ) : (
              <Link to={crumb.to} className="hover:text-foreground transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Mobile: just title */}
      <h1 className="md:hidden text-lg font-bold">{currentTitle}</h1>
    </header>
  );
}
```

#### 6.18 `src/components/layout/AppLayout.tsx`

```tsx
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:pl-60">
        <TopBar />
        <main className="p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

#### 6.19 `src/pages/Dashboard.tsx`

```tsx
import { useQuery } from "@tanstack/react-query";
import { getTareasPorFecha } from "@/api/trabajos";
import { getTrabajos } from "@/api/trabajos";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { useMemo } from "react";

export function Dashboard() {
  const hoy = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const tareasQuery = useQuery({
    queryKey: ["tareas", hoy],
    queryFn: () => getTareasPorFecha(hoy),
  });

  const trabajosQuery = useQuery({
    queryKey: ["trabajos", "pendiente"],
    queryFn: () => getTrabajos({ estado: "pendiente" }),
  });

  return (
    <div>
      <PageHeader title="Dashboard" description="Resumen de tu actividad" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Tareas de hoy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">📋 Tareas de hoy</CardTitle>
          </CardHeader>
          <CardContent>
            {tareasQuery.isLoading && <LoadingState rows={3} />}
            {tareasQuery.isError && (
              <ErrorState message="Error al cargar tareas" onRetry={() => tareasQuery.refetch()} />
            )}
            {tareasQuery.data && tareasQuery.data.length === 0 && (
              <p className="text-sm text-muted-foreground">No hay tareas para hoy.</p>
            )}
            {tareasQuery.data?.map((tarea) => (
              <div key={tarea.id} className="flex items-center gap-2 py-1 text-sm">
                <span>{tarea.completado ? "✅" : "⬜"}</span>
                <span className={tarea.completado ? "line-through text-muted-foreground" : ""}>
                  {tarea.descripcion}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Trabajos pendientes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">🔧 Trabajos pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            {trabajosQuery.isLoading && <LoadingState rows={3} />}
            {trabajosQuery.isError && (
              <ErrorState onRetry={() => trabajosQuery.refetch()} />
            )}
            {trabajosQuery.data && trabajosQuery.data.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin trabajos pendientes 🎉</p>
            )}
            {trabajosQuery.data?.map((t) => (
              <div key={t.id} className="py-1 text-sm">
                <span className="font-medium">{t.titulo}</span>
                {t.cliente_nombre && (
                  <span className="text-muted-foreground"> — {t.cliente_nombre}</span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

#### 6.20 `src/pages/clientes/ClienteList.tsx`

```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getClientes, createCliente } from "@/api/clientes";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Phone, Mail, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import type { Cliente } from "@/types/cliente";
import { ClienteFormModal } from "./ClienteFormModal";

export function ClienteList() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: clientes, isLoading, isError, refetch } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => getClientes(),
  });

  const createMutation = useMutation({
    mutationFn: createCliente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      setShowCreate(false);
    },
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div>
      <PageHeader
        title="Clientes"
        description={`${clientes?.length || 0} clientes activos`}
        action={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo cliente
          </Button>
        }
      />

      {clientes && clientes.length === 0 ? (
        <EmptyState
          title="Sin clientes"
          description="Crea tu primer cliente para empezar."
          action={
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear cliente
            </Button>
          }
        />
      ) : (
        /* Mobile: cards; Desktop (md+): table — aquí simplificado a cards para ambos */
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {clientes?.map((cliente) => (
            <Link key={cliente.id} to={`/clientes/${cliente.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg">{cliente.nombre}</h3>
                  {cliente.apellidos && (
                    <p className="text-sm text-muted-foreground">{cliente.apellidos}</p>
                  )}
                  <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                    {cliente.telefono_principal && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5" /> {cliente.telefono_principal}
                      </div>
                    )}
                    {cliente.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5" /> {cliente.email}
                      </div>
                    )}
                    {cliente.direccion_municipio && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5" /> {cliente.direccion_municipio}
                        {cliente.direccion_provincia && `, ${cliente.direccion_provincia}`}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Modal crear cliente */}
      <ClienteFormModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
```

#### 6.21 `src/pages/clientes/ClienteFormModal.tsx`

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ClienteCreate } from "@/types/cliente";

const schema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  apellidos: z.string().optional(),
  telefono_principal: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  direccion_municipio: z.string().optional(),
  direccion_provincia: z.string().optional(),
});

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ClienteCreate) => void;
  isSubmitting: boolean;
}

export function ClienteFormModal({ open, onClose, onSubmit, isSubmitting }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClienteCreate>({
    resolver: zodResolver(schema),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo cliente</DialogTitle>
          <DialogDescription>
            Añade un nuevo cliente a tu cartera.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="nombre">Nombre *</Label>
            <Input id="nombre" {...register("nombre")} placeholder="Nombre o empresa" />
            {errors.nombre && (
              <p className="text-sm text-destructive mt-1">{errors.nombre.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="apellidos">Apellidos</Label>
            <Input id="apellidos" {...register("apellidos")} placeholder="Apellidos (si persona física)" />
          </div>

          <div>
            <Label htmlFor="telefono_principal">Teléfono</Label>
            <Input id="telefono_principal" {...register("telefono_principal")} placeholder="+34 6XX XXX XXX" />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" {...register("email")} placeholder="correo@ejemplo.com" type="email" />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="direccion_municipio">Municipio</Label>
              <Input id="direccion_municipio" {...register("direccion_municipio")} placeholder="Ej: Gironella" />
            </div>
            <div>
              <Label htmlFor="direccion_provincia">Provincia</Label>
              <Input id="direccion_provincia" {...register("direccion_provincia")} placeholder="Ej: Barcelona" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creando..." : "Crear cliente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

#### 6.22 `src/pages/clientes/ClienteDetail.tsx`

```tsx
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCliente } from "@/api/clientes";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, ArrowLeft } from "lucide-react";

export function ClienteDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: cliente, isLoading, isError, refetch } = useQuery({
    queryKey: ["cliente", id],
    queryFn: () => getCliente(Number(id)),
    enabled: !!id,
  });

  if (isLoading) return <LoadingState />;
  if (isError || !cliente) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div>
      <PageHeader
        title={cliente.nombre}
        description={cliente.apellidos || "Cliente"}
        action={
          <Link to="/clientes">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold">Información de contacto</h3>
            {cliente.telefono_principal && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${cliente.telefono_principal}`} className="text-primary hover:underline">
                  {cliente.telefono_principal}
                </a>
              </div>
            )}
            {cliente.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${cliente.email}`} className="text-primary hover:underline">
                  {cliente.email}
                </a>
              </div>
            )}
            {(cliente.direccion_municipio || cliente.direccion_provincia) && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  {[
                    cliente.direccion_calle,
                    cliente.direccion_numero,
                    cliente.direccion_municipio,
                    cliente.direccion_provincia,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold">Datos fiscales</h3>
            {cliente.nif_cif && (
              <p className="text-sm">
                <span className="text-muted-foreground">NIF/CIF:</span> {cliente.nif_cif}
              </p>
            )}
            <p className="text-sm">
              <span className="text-muted-foreground">Tipo:</span>{" "}
              {cliente.tipo_cliente === "persona_fisica" ? "Persona física" : "Empresa"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

#### 6.23 `src/App.tsx`

```tsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Dashboard } from "@/pages/Dashboard";
import { ClienteList } from "@/pages/clientes/ClienteList";
import { ClienteDetail } from "@/pages/clientes/ClienteDetail";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,      // 30s antes de considerar datos "viejos"
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/clientes", element: <ClienteList /> },
      { path: "/clientes/:id", element: <ClienteDetail /> },
      // Placeholders para el resto — Fases 2-4
      { path: "/trabajos", element: <div className="p-8 text-muted-foreground">Trabajos — Fase 2</div> },
      { path: "/trabajos/:id", element: <div className="p-8 text-muted-foreground">Detalle trabajo — Fase 2</div> },
      { path: "/presupuestos", element: <div className="p-8 text-muted-foreground">Presupuestos — Fase 3</div> },
      { path: "/facturas", element: <div className="p-8 text-muted-foreground">Facturas — Fase 3</div> },
      { path: "/oportunidades", element: <div className="p-8 text-muted-foreground">Oportunidades — Fase 4</div> },
      { path: "/materiales", element: <div className="p-8 text-muted-foreground">Materiales — Fase 2</div> },
      { path: "/calendario", element: <div className="p-8 text-muted-foreground">Calendario — Fase 4</div> },
    ],
  },
]);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
```

#### 6.24 `src/main.tsx`

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

#### 6.25 `vite.config.ts`

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "ERP AI-First Autónomos",
        short_name: "ERP Autónomo",
        description: "ERP para electricistas autónomos",
        theme_color: "#2563eb",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:8000",
      "/health": "http://localhost:8000",
    },
  },
});
```

#### 6.26 `tsconfig.app.json` — verificar paths

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    // resto igual que el default de Vite
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

### Paso 7: Verificar build

```bash
npm run build
# Debe compilar sin errores
```

### Paso 8: Probar en desarrollo

```bash
npm run dev
# Abrir http://localhost:5173
# Verificar que:
#  - Sidebar navega entre páginas
#  - Clientes carga lista real desde /api/clientes
#  - Se puede crear un cliente nuevo
#  - El dashboard muestra tareas del día
```

---

## 8. Fase 2 (siguiente) — Trabajos + Materiales

Tras Fase 1 completada:

- Crear `src/types/trabajo.ts` (ya adelantado) y `src/types/material.ts`
- Completar `src/api/trabajos.ts` (ya escrito en Fase 1)
- Crear `src/api/materiales.ts`
- `TrabajoList.tsx` con filtro de estado + modal crear rápido
- `TrabajoDetail.tsx` con Tabs: ChecklistTab, TiemposTab, ComentariosTab
- `MaterialList.tsx` con modal añadir
- Placeholder de otras páginas → real

---

## 9. Notas de producción

### Servir desde FastAPI

En `db/api.py`, al final del archivo:

```python
from fastapi.staticfiles import StaticFiles

# La app React se monta DESPUÉS de todas las rutas /api/*
app.mount("/", StaticFiles(directory="web/dist", html=True), name="web")
```

### Build para producción

```bash
cd ~/ai-first-autonomos/web
npm run build
# Reiniciar FastAPI para que lea el nuevo dist/
```

### Sin autenticación

- No hay login ni guards (fase actual)
- La API no requiere tokens
- En el futuro: sesión simple con middleware FastAPI

---

## Resumen de cambios vs plan original

| Aspecto | Plan original | Plan v2 |
|---|---|---|
| Crear/editar | Rutas separadas (`/nuevo`, `/editar`) | Modales para casos simples (<5 campos) |
| Mobile layout | Sidebar → bottom nav (bien) + breadcrumb | Solo título en móvil, sin breadcrumb |
| Fases | 6 fases | 4 fases (consolidadas) |
| Endpoints | 34 mapeados (faltaban algunos) | ~43 mapeados completos |
| Fase 1 entregable | Scaffold + layout vacío | Layout + Clientes listo contra API real |
| DataTable | Componente único | Tabla en desktop, cards en móvil |
| Oportunidades | Kanban con drag | Columnas estáticas (sin biblioteca extra) |
| PWA offline | En fase 6 | Diferido post-Fase 4 (no prioritario) |

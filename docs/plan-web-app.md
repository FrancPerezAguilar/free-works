# Plan de Desarrollo — Web App React · AI-First Autónomos

> Documento de planificación. Sin código todavía.

---

## 1. Stack tecnológico

| Capa | Tecnología | Por qué |
|---|---|---|
| **Framework** | React 19 + TypeScript | Universal (web → RN → PWA) |
| **Build** | Vite 6 | Rápido, PWA-ready, tree-shaking |
| **Routing** | React Router v7 | Estándar, nested routes, layouts |
| **Estado servidor** | TanStack Query (React Query) | Caching, refetch, mutations |
| **HTTP** | ky (fetch-based) | Liviano, tipado, base URL central |
| **UI** | Tailwind CSS v4 + shadcn/ui | Componentes accesibles, tema consistente, extraíbles a RN |
| **Formularios** | React Hook Form + Zod | Validación tipada, misma lógica que RN |
| **PWA** | vite-plugin-pwa | Service worker, offline, manifest |
| **Iconos** | Lucide React | Ligeros, consistentes |

---

## 2. Distribución de la interfaz (arquitectura UI)

```
┌─────────────────────────────────────────────────────┐
│  <AppLayout>                                         │
│  ┌──────────┬──────────────────────────────────────┐ │
│  │          │  <TopBar>                             │ │
│  │ Sidebar  │  ┌────────────── ───────┐            │ │
│  │          │  │ Breadcrumb    ──┤ Buscar          │ │
│  │  ┌──────┐│  └────────────────────────┘            │ │
│  │  │📋    ││  ┌──────────────────────────────────┐  │ │
│  │  │Obras ││  │                                  │  │ │
│  │  │👥    ││  │        <Outlet />                │  │ │
│  │  │Clien.││  │        (contenido)               │  │ │
│  │  │💰    ││  │                                  │  │ │
│  │  │Ppto. ││  │                                  │  │ │
│  │  │📄    ││  │                                  │  │ │
│  │  │Fact. ││  └──────────────────────────────────┘  │ │
│  │  │📅    ││                                         │ │
│  │  │Cal.  ││                                         │ │
│  │  └──────┘│                                         │ │
│  └──────────┴──────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 2.1 Layout estructura

**Sidebar** (240px fijo, colapsable en móvil):
- Icono + nombre entidad
- Sección "Resumen" (dashboard con métricas)
- Sección "Pipeline" (oportunidades activas)
- Cada ítem → ruta `/entidad`
- Indicador visual de entidad activa

**TopBar**:
- Breadcrumb dinámico (`Clientes > María García > Editar`)
- Buscador global (por cliente, trabajo, factura)

**Content Area**:
- Router outlet — cada ruta renderiza su página

### 2.2 Mobile-first

- Sidebar se convierte en bottom navigation en móvil
- Layout responsive con CSS Grid + Tailwind breakpoints
- Misma API, mismo código — solo cambia la disposición

### 2.3 PWA

- `vite-plugin-pwa` genera service worker
- Caché de assets estáticos
- Manifest con iconos, tema color, splash
- Instalable en homescreen (Add to Home Screen)
- Futuro: offline con datos cacheados

### 2.4 Futura migración React Native

- **API layer compartida**: `src/api/` — funciones tipadas con ky. Mismas funciones en RN con fetch.
- **Tipos compartidos**: `src/types/` — interfaces Zod. RN importa los mismos tipos.
- **React Native solo cambia**: Layout (navegación native) + componentes de plataforma.
- La lógica de negocio y datos viaja intacta entre web y RN.

---

## 3. Mapa de rutas y páginas

```
/                          Dashboard (resumen)
/clientes                  Listado de clientes
/clientes/nuevo            Formulario crear cliente
/clientes/:id              Ficha cliente + sus trabajos
/clientes/:id/editar       Editar cliente

/oportunidades             Pipeline de oportunidades
/oportunidades/nueva       Crear oportunidad
/oportunidades/:id         Detalle oportunidad

/presupuestos              Listado presupuestos
/presupuestos/nuevo        Crear presupuesto + líneas
/presupuestos/:id          Vista (PDF-like) del presupuesto
/presupuestos/:id/editar   Editar presupuesto

/trabajos                  Listado trabajos
/trabajos/nuevo            Crear trabajo (modal rápido)
/trabajos/:id              Detalle: checklist + tiempos + materiales + comentarios
/trabajos/:id/editar       Editar trabajo

/facturas                  Listado facturas
/facturas/nueva            Crear factura desde trabajo
/facturas/:id              Vista factura
/facturas/:id/editar       Editar factura

/calendario                Calendario (vista semana/día)
/calendario/nuevo          Crear evento

/materiales                Catálogo de materiales
/materiales/nuevo          Añadir material
```

---

## 4. Componentes compartidos

Todos bajo `src/components/ui/` (shadcn/ui):

| Componente | Uso |
|---|---|
| `Button` | Acciones |
| `Input`, `Select`, `Textarea` | Formularios |
| `Table` | Listados de entidades |
| `Card` | Fichas de detalle |
| `Dialog` | Modales (crear rápido, confirmar) |
| `Badge` | Estados (pendiente, completado, etc.) |
| `StatusBadge` | Badge coloreado por estado |
| `Breadcrumb` | Navegación |
| `SearchBar` | Búsqueda global |
| `DatePicker` | Selección de fechas |
| `Tabs` | Secciones dentro de detalle (ej: trabajo) |
| `Sidebar` | Navegación lateral |
| `TopBar` | Barra superior |
| `PageHeader` | Título + acciones de página |
| `ConfirmDialog` | Confirmación de acciones destructivas |
| `EmptyState` | Estado vacío con icono |
| `LoadingState` | Skeleton loader |
| `ErrorState` | Error con retry |

---

## 5. Estructura del proyecto

```
web/
├── index.html
├── vite.config.ts          # Proxy API, PWA plugin
├── tsconfig.json
├── tailwind.config.ts
├── public/
│   ├── manifest.json
│   ├── icon-192.png
│   └── icon-512.png
└── src/
    ├── main.tsx
    ├── App.tsx              # Router principal
    ├── api/
    │   ├── client.ts        # ky instance (base: /api)
    │   ├── clientes.ts      # ~/api/clientes/*
    │   ├── trabajos.ts
    │   ├── presupuestos.ts
    │   ├── facturas.ts
    │   ├── oportunidades.ts
    │   ├── materiales.ts
    │   ├── calendario.ts
    │   └── comentarios.ts
    ├── types/
    │   ├── cliente.ts
    │   ├── trabajo.ts
    │   ├── presupuesto.ts
    │   ├── factura.ts
    │   ├── oportunidad.ts
    │   ├── material.ts
    │   ├── calendario.ts
    │   └── common.ts        # API response genérica
    ├── components/
    │   ├── ui/              # shadcn/ui components
    │   ├── layout/
    │   │   ├── AppLayout.tsx
    │   │   ├── Sidebar.tsx
    │   │   ├── TopBar.tsx
    │   │   └── BreadcrumbNav.tsx
    │   ├── entities/        # Componentes por entidad
    │   │   ├── cliente/
    │   │   ├── trabajo/
    │   │   ├── presupuesto/
    │   │   └── ...
    │   └── shared/
    │       ├── StatusBadge.tsx
    │       ├── DataTable.tsx
    │       ├── ConfirmDialog.tsx
    │       └── ...
    ├── pages/
    │   ├── Dashboard.tsx
    │   ├── clientes/
    │   │   ├── ClienteList.tsx
    │   │   ├── ClienteDetail.tsx
    │   │   └── ClienteForm.tsx
    │   ├── trabajos/
    │   ├── presupuestos/
    │   ├── facturas/
    │   ├── oportunidades/
    │   ├── materiales/
    │   └── calendario/
    ├── hooks/               # Custom hooks (si hace falta)
    └── lib/
        ├── constants.ts     # Estados, colores, etiquetas
        └── utils.ts         # Formateo, fechas, moneda
```

---

## 6. Endpoints ↔ Páginas

| Endpoint API | Página/Componente | Método |
|---|---|---|
| `GET /api/clientes` | ClienteList → DataTable | TanStack useQuery |
| `GET /api/clientes/:id` | ClienteDetail | TanStack useQuery |
| `POST /api/clientes` | ClienteForm (crear) | TanStack useMutation |
| `PATCH /api/clientes/:id` | ClienteForm (editar) | TanStack useMutation |
| `GET /api/trabajos` | TrabajoList → DataTable | useQuery |
| `GET /api/trabajos/:id` | TrabajoDetail (Tabs: checklist, tiempos, mats) | useQuery |
| `POST /api/trabajos` | TrabajoForm | useMutation |
| `PATCH /api/trabajos/:id` | TrabajoForm edit | useMutation |
| `GET/POST .../checklist` | TrabajoDetail → ChecklistSection | useQuery/Mutation |
| `GET/POST .../tiempos` | TrabajoDetail → TiemposSection | useQuery/Mutation |
| `GET/POST /api/comentarios/...` | TrabajoDetail → ComentariosSection | useQuery/Mutation |
| `GET/POST /api/presupuestos` | PresupuestoList / PresupuestoForm | useQuery/Mutation |
| `GET/POST /api/presupuesto_lineas` | PresupuestoForm → LineasEditor | useQuery/Mutation |
| `GET/POST /api/facturas` | FacturaList / FacturaForm | useQuery/Mutation |
| `GET/POST /api/factura_lineas` | FacturaForm → LineasEditor | useQuery/Mutation |
| `GET/POST /api/oportunidades` | OportunidadList (Kanban) / OportunidadForm | useQuery/Mutation |
| `GET/POST /api/materiales` | MaterialList / MaterialForm | useQuery/Mutation |
| `GET /api/calendario/rango` | Calendario (Grid semana) | useQuery |
| `POST /api/calendario` | Calendario → EventCreate | useMutation |
| `DELETE /api/calendario/:id` | Calendario → EventDelete | useMutation |
| `GET /api/tareas/fecha/:fecha` | Dashboard → TareasHoy | useQuery |

---

## 7. Flujo de navegación del usuario

```
Dashboard
├── Tareas de hoy (checklist del día)
├── Próximos eventos (calendario próximo)
├── Últimas facturas (pendientes de cobro)
├── Resumen de horas esta semana
│
├── Clientes → Ver ficha → Ver sus trabajos → TrabajoDetail
├── Oportunidades → Crear presupuesto → PresupuestoForm
├── Presupuestos → Aceptar → Crear trabajo → TrabajoForm
├── Trabajos → Completar → Crear factura → FacturaForm
├── Facturas → Cobrar → Actualizar estado pago
├── Calendario → Día → Eventos
└── Materiales → Catálogo
```

---

## 8. Plan de implementación (fases)

### Fase 1 — Esqueleto (1 sesión)
- [ ] Scaffold Vite + React + TS + Tailwind
- [ ] Configurar shadcn/ui
- [ ] AppLayout: Sidebar + TopBar + Outlet
- [ ] React Router con rutas placeholder
- [ ] Cliente API base (ky instance)
- [ ] PWA manifest + service worker
- [ ] Subir a GitHub + verificar build

### Fase 2 — Clientes + Materiales (1 sesión)
- [ ] Tipos de datos (src/types/)
- [ ] API layer: clientes.ts, materiales.ts
- [ ] ClienteList (DataTable + búsqueda)
- [ ] ClienteDetail + ClienteForm
- [ ] MaterialList + MaterialForm
- [ ] Enlace README → documentación

### Fase 3 — Trabajos completo (2 sesiones)
- [ ] API: trabajos.ts
- [ ] TrabajoList con filtro de estado
- [ ] TrabajoDetail con tabs:
  - [ ] Info general
  - [ ] Checklist (añadir/tachar tareas)
  - [ ] Tiempos (registrar horas)
  - [ ] Materiales consumidos
  - [ ] Comentarios (histórico estilo chat)
- [ ] TrabajoForm

### Fase 4 — Presupuestos + Facturas (2 sesiones)
- [ ] API: presupuestos.ts, facturas.ts
- [ ] PresupuestoList + PresupuestoDetail (vista PDF-like)
- [ ] PresupuestoForm con editor de líneas
- [ ] FacturaList + FacturaDetail
- [ ] FacturaForm con editor de líneas
- [ ] Flujo: Presupuesto → Aceptar → Trabajo → Facturar

### Fase 5 — Oportunidades + Calendario (1 sesión)
- [ ] API: oportunidades.ts, calendario.ts
- [ ] OportunidadList (vista kanban/tarjetas con drag)
- [ ] OportunidadForm
- [ ] Calendario vista semana (grid horario)
- [ ] Crear/eliminar eventos

### Fase 6 — Dashboard + Polish (1 sesión)
- [ ] Dashboard con métricas
- [ ] Estado loading/empty/error en todas las páginas
- [ ] Búsqueda global
- [ ] Responsive (móvil)
- [ ] Optimización PWA (offline page)

---

## 9. Notas técnicas

### Proxy API en desarrollo
```ts
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
    }
  }
})
```

### Convención de commits
```
feat(web): añadir listado de clientes con tabla
feat(web): formulario crear presupuesto con líneas
fix(web): error al registrar tiempo sin descripción
```

### Sin autenticación (fase actual)
- No hay login, no hay guards
- La API no valida tokens
- En el futuro: sesión simple + middleware en FastAPI

### Rutas amigables
- Sin hash routing — HTML5 History API
- Servir SPA desde FastAPI con catch-all route

---

## 10. Plan de distribución (serving)

**Opción recomendada: FastAPI sirve el build estático**

```
FastAPI :8000
├── /api/*              → REST API
├── /docs               → Swagger UI dinámico
├── /docs/swagger-ui    → Swagger HTML estático
├── / (catch-all)       → index.html build React
└── /assets/*           → JS/CSS chunks cacheados
```

El `vite build` genera `dist/`. FastAPI lo sirve así:

```python
from fastapi.staticfiles import StaticFiles

# Montar build de React en raíz (catch-all después de rutas API)
app.mount("/", StaticFiles(directory="web/dist", html=True), name="web")
```

**Alternativa futura:** Vercel / Netlify para el frontend separado, apuntando a la API como backend.

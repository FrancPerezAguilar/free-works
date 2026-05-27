# Arquitectura API + YAML Store

> Registro de decisión: 27 de mayo de 2026

## Principio Fundamental

**YAML es la fuente de verdad.** No hay base de datos intermedia ni capa de caché entre el almacenamiento y la API.

## Flujo de Datos

```
Hermes Agent (voz/texto/IA)
       │
       ▼
┌──────────────────┐     📁 data/clientes/cliente-001.yaml
│   YAML Store     │────▶ 📁 data/trabajos/trabajo-001.yaml
│ (fuente verdad)  │────▶ 📁 data/presupuestos/presupuesto-001.yaml
└────────┬─────────┘     ...
         │
         ▼
┌──────────────────┐
│   API REST       │  FastAPI / Flask
│  lee YAML → JSON │  GET /clientes, GET /trabajos/:id, etc.
└────────┬─────────┘
         │
         ▼
┌─────────────┐
│    UI       │  Web / App móvil
└─────────────┘
```

## Reglas de Arquitectura

1. **YAML → JSON unidireccional**: Las escrituras van a YAML (vía Hermes, edición manual o webhook). La API solo lee de YAML y sirve JSON.
2. **Sin caché**: `YamlStore.obtener()` lee el archivo del disco en cada petición. Un YAML de 2 KB se parsea en microsegundos — no hay necesidad de Redis ni capas intermedias.
3. **Actualización automática**: Cualquier cambio en los archivos YAML (por Hermes, por CLI, por edición directa) se refleja instantáneamente en la API en la siguiente petición.
4. **Webhook-ready**: Se puede recibir un POST externo que modifique un YAML, y la API lo servirá como JSON inmediatamente después.

## Stack Propuesto

| Capa | Tecnología |
|---|---|
| CLI / Voz | Hermes Agent + DeepSeek V4 |
| Almacenamiento | YAML (fuente de verdad) |
| API | FastAPI (Python) |
| UI | Por definir (web / app móvil) |

## Próximos Pasos (pendientes)

- [ ] Montar FastAPI básico con endpoints:
  - `GET /clientes` — listar
  - `GET /clientes/:id` — detalle
  - `GET /trabajos` — listar
  - `GET /trabajos/:id` — detalle
  - `POST /webhook/:entidad` — actualizar YAML desde externo
- [ ] Evaluar Server-Sent Events para UI en tiempo real (opcional)
- [ ] Definir formato de respuesta JSON estándar

## Notas

- El tráfico de un autónomo es bajo. Leer YAML de disco en cada request es perfectamente viable.
- Si en el futuro escala, se puede añadir una capa de caché con invalidación por file watcher, pero no antes de que sea necesario.
- Hermes modifica los YAML directamente usando `YamlStore.actualizar()`.

---

## Sistema de Plantillas YAML

*Añadido: 27 de mayo de 2026*

Para garantizar que todos los registros de una entidad tengan exactamente los mismos campos
(evitando esquemas inconsistentes que rompan la API), se implementó un sistema de plantillas.

### Mecanismo

1. Cada entidad tiene un archivo plantilla en `data/templates/{entidad}.yaml`
2. La plantilla define **todos los campos**, con valores por defecto o vacíos
3. Al crear un registro, se copia la plantilla completa y se hace merge profundo con los datos proporcionados
4. Los campos no especificados se quedan con su valor por defecto de la plantilla

### Método

```python
store.crear_desde_plantilla("cliente", {
    "nombre": "María García",
    "telefono_principal": "+34 612 345 678"
})
# Resultado: plantilla completa + merge de datos → 42 campos siempre presentes
```

### Merge Profundo (`_deep_merge`)

- Si ambas claves son diccionarios → merge recursivo
- Si el valor proporcionado es `None` o `""` → se conserva el valor de la plantilla
- Si el valor proporcionado tiene contenido → sobreescribe

### Plantillas Disponibles

| Archivo | Campos | Entidad |
|---|---|---|
| `data/templates/cliente.yaml` | 42 | Clientes (persona física/jurídica) |
| `data/templates/trabajo.yaml` | 30 | Trabajos / obras |
| `data/templates/presupuesto.yaml` | 28 | Presupuestos |
| `data/templates/factura.yaml` | 30 | Facturas |
| `data/templates/oportunidad.yaml` | 20 | Oportunidades CRM |
| `data/templates/material.yaml` | 25 | Catálogo de materiales |

### Regla

> **Siempre crear entidades con `crear_desde_plantilla()`**, nunca con `crear()`.
> El método `crear()` queda solo para compatibilidad con registros legacy.

---

## Catálogo de Materiales

*Añadido: 27 de mayo de 2026*

Los materiales se gestionan como entidad independiente (catálogo), no como datos inline dentro de los trabajos.

### Flujo

1. El material se crea en el catálogo: `store.crear_desde_plantilla("material", {...})`
2. Obtiene un ID único: `material-001`, `material-002`, etc.
3. Al asociarlo a un trabajo, se referencia por ID:

```yaml
# En trabajo.yaml, array materiales:
materiales:
  - material_id: "material-001"          # FK al catálogo
    material_nombre: "Cable AFU-MEX..."  # Denormalizado para lectura rápida
    cantidad_usada: 30
    unidad: "metros"
    precio_unitario: 0.00
```

### Ventajas

- **Un único sitio** donde se define cada material
- **Reutilización**: mismo material en múltiples trabajos
- **Consistencia**: nombre, precio, fabricante siempre iguales
- **Stock**: el catálogo permite gestionar inventario
- **Historial de precios**: cada cambio queda registrado

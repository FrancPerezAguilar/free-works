# Free Works — Plan de Arquitectura

> Gestor de trabajos con IA + Holded ERP
> Repo: https://github.com/FrancPerezAguilar/free-works

---

## Filosofía

Free Works **no es un ERP**. Es un **asistente inteligente para la gestión del día a día** que usa Holded como backend financiero. Holded factura, contabiliza y cumple Verifactu. Free Works gestiona los trabajos, los técnicos, los tiempos y los materiales.

---

## Arquitectura

```
Free Works (Gestor + IA)
   │
   ├── Core: Gestión de Trabajos
   │   ├── Crear/editar trabajos
   │   ├── Checklist de tareas
   │   ├── Técnicos asignados
   │   ├── Registro de horas (por técnico)
   │   ├── Materiales instalados
   │   ├── Fotos, PDFs, notas de voz
   │   ├── Comentarios
   │   └── Estados
   │
   ├── Asistente IA (JARVIS)
   │   ├── Voz (STT → LLM → TTS)
   │   ├── Subagente MiniMax M3
   │   └── Automatización inteligente
   │
   ├── Técnicos (gestión local)
   │   └── Altas, perfiles, asignación
   │
   └── Conector Holded (MCP)
       ├── Clientes ← sincronizar
       ├── Productos/Materiales ← catálogo
       ├── Presupuestos → Holded
       ├── Facturas → Holded (Verifactu)
       └── Contabilidad ← consulta

Holded → Facturación, Contabilidad, Verifactu, Inventario
```

---

## Entidad: Trabajo (core)

```yaml
trabajo:
  id: "TRB-2026-0001"
  titulo: "Reparación cuadro eléctrico"
  descripcion: "Revisión y reparación del cuadro general de la vivienda"
  cliente:
    holded_id: "cont_abc123"
    nombre: "Pedro Martínez"
    telefono: "600123456"
    direccion: "C/ Mayor 12, Barcelona"
  estado: pendiente | en_curso | completado | cancelado
  prioridad: baja | media | alta | urgente
  fechas:
    creado: 2026-06-14
    inicio: null
    fin: null
  tecnicos_asignados:
    - nombre: "Franc"
    - nombre: "Manolo"
  checklist:
    - id: 1
      descripcion: "Revisar diferencial"
      completada: true
      completada_por: "Franc"
      fecha: 2026-06-14
    - id: 2
      descripcion: "Comprar materiales"
      completada: false
  horas:
    - tecnico: "Franc"
      horas: 4.0
      fecha: 2026-06-14
      descripcion: "Diagnóstico y reparación"
    - tecnico: "Manolo"
      horas: 2.0
      fecha: 2026-06-14
      descripcion: "Instalación"
  materiales:
    - nombre: "Interruptor diferencial 40A"
      holded_id: "prod_xyz"
      cantidad: 2
      precio: 42.50
  comentarios:
    - autor: "Franc"
      texto: "Cliente quiere presupuesto para el resto de la casa"
      fecha: 2026-06-14T10:30
  adjuntos:
    - tipo: foto | pdf | audio
      nombre: "cuarto_antes.jpg"
```

---

## Fases

| Fase | Qué incluye | Estado |
|------|-------------|--------|
| 1 | Core trabajos, checklist, horas, técnicos, comentarios, adjuntos | 🔄 Adaptar |
| 2 | Conector Holded MCP (clientes, productos) | ⏳ Pendiente API key |
| 3 | Presupuestos y facturación → Holded | ⏳ |
| 4 | Asistente IA por voz | ⏳ |
| 5 | Dashboard y reporting | ⏳ |

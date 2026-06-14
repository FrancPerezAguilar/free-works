# Técnicos — Free Works

Módulo de gestión de técnicos (miembros del equipo).

## Entidad

```yaml
tecnico:
  id: "TEC-001"
  nombre: "Franc Pérez"
  telefono: "+34 600 000 000"
  email: "franc@example.com"
  especialidad: "Electricista"
  activo: true
  fecha_alta: 2026-06-14
```

## API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /api/tecnicos | Listar técnicos activos |
| POST | /api/tecnicos | Crear técnico |
| GET | /api/tecnicos/:id | Obtener técnico |
| PUT | /api/tecnicos/:id | Actualizar técnico |
| PATCH | /api/tecnicos/:id/desactivar | Soft-delete (desactivar) |

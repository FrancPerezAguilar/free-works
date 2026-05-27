"""
AI-First Autónomos — MCP Server
Exposes tools to interact with the AI-First Autónomos PostgreSQL database.
Connects via the FastAPI REST API.
"""
import os, json, httpx
from datetime import date, datetime
from typing import Optional

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

API_BASE = os.environ.get("AI_FIRST_API", "http://localhost:8000/api")
server = Server("ai-first-autonomos")


# ── Tool Definitions ─────────────────────────────────

TOOLS = [
    Tool(
        name="listar_clientes",
        description="Lista todos los clientes registrados",
        inputSchema={
            "type": "object",
            "properties": {
                "activo": {
                    "type": "boolean",
                    "description": "Solo clientes activos (default: true)",
                    "default": True
                }
            }
        }
    ),
    Tool(
        name="obtener_cliente",
        description="Obtiene los detalles de un cliente por ID",
        inputSchema={
            "type": "object",
            "properties": {
                "cliente_id": {"type": "integer", "description": "ID del cliente"}
            },
            "required": ["cliente_id"]
        }
    ),
    Tool(
        name="crear_cliente",
        description="Crea un nuevo cliente",
        inputSchema={
            "type": "object",
            "properties": {
                "nombre": {"type": "string", "description": "Nombre del cliente"},
                "telefono": {"type": "string", "description": "Teléfono principal"},
                "municipio": {"type": "string", "description": "Municipio"},
                "provincia": {"type": "string", "description": "Provincia"}
            },
            "required": ["nombre"]
        }
    ),
    Tool(
        name="listar_trabajos",
        description="Lista todos los trabajos (obras/proyectos)",
        inputSchema={
            "type": "object",
            "properties": {
                "estado": {
                    "type": "string",
                    "description": "Filtrar por estado (pendiente, en_curso, completado)",
                    "enum": ["pendiente", "en_curso", "completado", None]
                }
            }
        }
    ),
    Tool(
        name="obtener_trabajo",
        description="Obtiene los detalles completos de un trabajo, incluyendo checklist, tiempos y materiales",
        inputSchema={
            "type": "object",
            "properties": {
                "trabajo_id": {"type": "integer", "description": "ID del trabajo"}
            },
            "required": ["trabajo_id"]
        }
    ),
    Tool(
        name="crear_trabajo",
        description="Crea un nuevo trabajo (obra/proyecto)",
        inputSchema={
            "type": "object",
            "properties": {
                "titulo": {"type": "string", "description": "Título del trabajo"},
                "descripcion": {"type": "string", "description": "Descripción"},
                "cliente_id": {"type": "integer", "description": "ID del cliente"},
                "cliente_nombre": {"type": "string", "description": "Nombre del cliente"},
                "estado": {"type": "string", "description": "Estado inicial", "default": "pendiente"},
                "prioridad": {"type": "string", "description": "Prioridad", "default": "media"},
                "obra_municipio": {"type": "string", "description": "Municipio de la obra"}
            },
            "required": ["titulo"]
        }
    ),
    Tool(
        name="tareas_por_fecha",
        description="Obtiene todas las tareas (checklist) programadas para una fecha específica",
        inputSchema={
            "type": "object",
            "properties": {
                "fecha": {
                    "type": "string",
                    "description": "Fecha en formato YYYY-MM-DD (ej: 2026-05-29)"
                }
            },
            "required": ["fecha"]
        }
    ),
    Tool(
        name="añadir_tarea_checklist",
        description="Añade una tarea al checklist de un trabajo",
        inputSchema={
            "type": "object",
            "properties": {
                "trabajo_id": {"type": "integer", "description": "ID del trabajo"},
                "descripcion": {"type": "string", "description": "Descripción de la tarea"},
                "fecha_programada": {"type": "string", "description": "Fecha programada (YYYY-MM-DD)"},
                "hora_programada": {"type": "string", "description": "Hora programada (HH:MM)"}
            },
            "required": ["trabajo_id", "descripcion"]
        }
    ),
    Tool(
        name="completar_tarea",
        description="Marca una tarea del checklist como completada",
        inputSchema={
            "type": "object",
            "properties": {
                "item_id": {"type": "integer", "description": "ID del item del checklist"}
            },
            "required": ["item_id"]
        }
    ),
    Tool(
        name="registrar_tiempo",
        description="Registra horas trabajadas en un trabajo",
        inputSchema={
            "type": "object",
            "properties": {
                "trabajo_id": {"type": "integer", "description": "ID del trabajo"},
                "horas": {"type": "number", "description": "Horas trabajadas (ej: 2.5)"},
                "descripcion": {"type": "string", "description": "Descripción del trabajo realizado"},
                "fecha": {"type": "string", "description": "Fecha (YYYY-MM-DD, default: hoy)"}
            },
            "required": ["trabajo_id", "horas"]
        }
    ),
    Tool(
        name="listar_materiales",
        description="Lista el catálogo de materiales",
        inputSchema={
            "type": "object",
            "properties": {
                "categoria": {
                    "type": "string",
                    "description": "Filtrar por categoría (ej: cables, proteccion_electrica)"
                }
            }
        }
    ),
    Tool(
        name="crear_material",
        description="Añade un material al catálogo",
        inputSchema={
            "type": "object",
            "properties": {
                "nombre": {"type": "string", "description": "Nombre del material"},
                "categoria": {"type": "string", "description": "Categoría"},
                "precio_unitario": {"type": "number", "description": "Precio unitario"},
                "unidad_medida": {"type": "string", "description": "Unidad de medida (ud, m, kg...)"},
                "fabricante": {"type": "string", "description": "Fabricante"}
            },
            "required": ["nombre"]
        }
    ),
    Tool(
        name="actualizar_estado_trabajo",
        description="Cambia el estado de un trabajo",
        inputSchema={
            "type": "object",
            "properties": {
                "trabajo_id": {"type": "integer", "description": "ID del trabajo"},
                "estado": {
                    "type": "string",
                    "description": "Nuevo estado",
                    "enum": ["pendiente", "en_curso", "completado", "cancelado"]
                }
            },
            "required": ["trabajo_id", "estado"]
        }
    ),
    Tool(
        name="actualizar_cliente",
        description="Actualiza datos de un cliente",
        inputSchema={
            "type": "object",
            "properties": {
                "cliente_id": {"type": "integer", "description": "ID del cliente"},
                "telefono_principal": {"type": "string", "description": "Teléfono principal"},
                "email": {"type": "string", "description": "Email"},
                "direccion_calle": {"type": "string", "description": "Calle"},
                "direccion_numero": {"type": "string", "description": "Número"},
                "direccion_municipio": {"type": "string", "description": "Municipio"},
                "direccion_provincia": {"type": "string", "description": "Provincia"}
            },
            "required": ["cliente_id"]
        }
    ),
    Tool(
        name="listar_comentarios_trabajo",
        description="Lista los comentarios de un trabajo",
        inputSchema={
            "type": "object",
            "properties": {
                "trabajo_id": {"type": "integer", "description": "ID del trabajo"}
            },
            "required": ["trabajo_id"]
        }
    ),
    Tool(
        name="añadir_comentario_trabajo",
        description="Añade un comentario al histórico de un trabajo",
        inputSchema={
            "type": "object",
            "properties": {
                "trabajo_id": {"type": "integer", "description": "ID del trabajo"},
                "contenido": {"type": "string", "description": "Contenido del comentario"},
                "autor": {"type": "string", "description": "Autor del comentario (default: Usuario)"}
            },
            "required": ["trabajo_id", "contenido"]
        }
    ),
    Tool(
        name="listar_comentarios",
        description="Lista los comentarios de cualquier entidad (trabajo, cliente, presupuesto, factura, oportunidad, material, gasto)",
        inputSchema={
            "type": "object",
            "properties": {
                "entity_type": {
                    "type": "string",
                    "description": "Tipo de entidad (trabajo, cliente, presupuesto, factura, oportunidad, material, gasto)"
                },
                "entity_id": {"type": "integer", "description": "ID de la entidad"}
            },
            "required": ["entity_type", "entity_id"]
        }
    ),
    Tool(
        name="añadir_comentario",
        description="Añade un comentario a cualquier entidad (trabajo, cliente, presupuesto, factura, oportunidad, material, gasto)",
        inputSchema={
            "type": "object",
            "properties": {
                "entity_type": {
                    "type": "string",
                    "description": "Tipo de entidad (trabajo, cliente, presupuesto, factura, oportunidad, material, gasto)"
                },
                "entity_id": {"type": "integer", "description": "ID de la entidad"},
                "contenido": {"type": "string", "description": "Contenido del comentario"},
                "autor": {"type": "string", "description": "Autor del comentario (default: Usuario)"}
            },
            "required": ["entity_type", "entity_id", "contenido"]
        }
    ),
    # ── Calendario ─────────────────────────────────────
    Tool(
        name="crear_evento",
        description="Crea un evento en el calendario (reunión, trabajo, tarea, personal)",
        inputSchema={
            "type": "object",
            "properties": {
                "titulo": {"type": "string", "description": "Título del evento"},
                "fecha_evento": {"type": "string", "description": "Fecha del evento (YYYY-MM-DD)"},
                "hora_evento": {"type": "string", "description": "Hora del evento (HH:MM)"},
                "duracion_min": {"type": "integer", "description": "Duración estimada en minutos", "default": 60},
                "descripcion": {"type": "string", "description": "Descripción del evento"},
                "entidad_tipo": {"type": "string", "description": "Tipo de entidad vinculada (trabajo, tarea, reunion)"},
                "entidad_nombre": {"type": "string", "description": "Nombre de la entidad vinculada"},
                "cliente_nombre": {"type": "string", "description": "Nombre del cliente asociado"},
                "ubicacion": {"type": "string", "description": "Ubicación del evento"},
                "color": {"type": "string", "description": "Color del evento en hex (ej: #3B82F6)", "default": "#3B82F6"},
                "estado": {"type": "string", "description": "Estado del evento", "default": "pendiente"}
            },
            "required": ["titulo", "fecha_evento"]
        }
    ),
    Tool(
        name="listar_eventos",
        description="Lista eventos del calendario por fecha o tipo",
        inputSchema={
            "type": "object",
            "properties": {
                "fecha": {"type": "string", "description": "Filtro por fecha (YYYY-MM-DD)"},
                "entidad_tipo": {"type": "string", "description": "Filtro por tipo (trabajo, tarea, reunion)"},
                "estado": {"type": "string", "description": "Filtro por estado"}
            }
        }
    ),
    Tool(
        name="eventos_por_rango",
        description="Lista eventos del calendario en un rango de fechas",
        inputSchema={
            "type": "object",
            "properties": {
                "desde": {"type": "string", "description": "Fecha inicial (YYYY-MM-DD)"},
                "hasta": {"type": "string", "description": "Fecha final (YYYY-MM-DD)"}
            },
            "required": ["desde", "hasta"]
        }
    ),
    Tool(
        name="eliminar_evento",
        description="Elimina (desactiva) un evento del calendario",
        inputSchema={
            "type": "object",
            "properties": {
                "evento_id": {"type": "integer", "description": "ID del evento"}
            },
            "required": ["evento_id"]
        }
    ),
    # ── Presupuestos ──────────────────────────────────
    Tool(
        name="listar_presupuestos",
        description="Lista todos los presupuestos",
        inputSchema={
            "type": "object",
            "properties": {
                "estado": {"type": "string", "description": "Filtrar por estado (borrador, pendiente, aceptado, rechazado, vencido)"}
            }
        }
    ),
    Tool(
        name="obtener_presupuesto",
        description="Obtiene los detalles de un presupuesto por ID",
        inputSchema={
            "type": "object",
            "properties": {
                "presupuesto_id": {"type": "integer", "description": "ID del presupuesto"}
            },
            "required": ["presupuesto_id"]
        }
    ),
    Tool(
        name="crear_presupuesto",
        description="Crea un nuevo presupuesto para un cliente",
        inputSchema={
            "type": "object",
            "properties": {
                "titulo": {"type": "string", "description": "Título del presupuesto"},
                "descripcion": {"type": "string", "description": "Descripción"},
                "cliente_id": {"type": "integer", "description": "ID del cliente"},
                "cliente_nombre": {"type": "string", "description": "Nombre del cliente"},
                "base_imponible": {"type": "number", "description": "Base imponible"},
                "iva": {"type": "number", "description": "IVA"},
                "total": {"type": "number", "description": "Total"},
                "estado": {"type": "string", "description": "Estado (borrador, pendiente, aceptado)", "default": "borrador"},
                "validez_dias": {"type": "integer", "description": "Validez del presupuesto en días (default: 30)"},
                "condiciones_pago": {"type": "string", "description": "Condiciones de pago (ej: Al contado, Transferencia 30 días)"},
                "notas": {"type": "string", "description": "Notas adicionales"}
            },
            "required": ["titulo"]
        }
    ),
    Tool(
        name="actualizar_estado_presupuesto",
        description="Cambia el estado de un presupuesto",
        inputSchema={
            "type": "object",
            "properties": {
                "presupuesto_id": {"type": "integer", "description": "ID del presupuesto"},
                "estado": {"type": "string", "description": "Nuevo estado (borrador, pendiente, aceptado, rechazado, vencido)"}
            },
            "required": ["presupuesto_id", "estado"]
        }
    ),
    Tool(
        name="listar_lineas_presupuesto",
        description="Lista las líneas de un presupuesto",
        inputSchema={
            "type": "object",
            "properties": {
                "presupuesto_id": {"type": "integer", "description": "ID del presupuesto"}
            },
            "required": ["presupuesto_id"]
        }
    ),
    Tool(
        name="añadir_linea_presupuesto",
        description="Añade una línea (partida) a un presupuesto",
        inputSchema={
            "type": "object",
            "properties": {
                "presupuesto_id": {"type": "integer", "description": "ID del presupuesto"},
                "descripcion": {"type": "string", "description": "Descripción de la línea"},
                "cantidad": {"type": "number", "description": "Cantidad (default: 1)"},
                "unidad": {"type": "string", "description": "Unidad de medida (default: ud)"},
                "precio_unitario": {"type": "number", "description": "Precio unitario"},
                "importe": {"type": "number", "description": "Importe total de la línea"}
            },
            "required": ["presupuesto_id", "descripcion"]
        }
    ),
]


# ── Tool Handlers ────────────────────────────────────

async def call_api(method: str, path: str, **kwargs):
    """Make an HTTP request to the FastAPI backend."""
    url = f"{API_BASE}{path}"
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            if method == "GET":
                resp = await client.get(url, params=kwargs.get("params"))
            elif method == "POST":
                resp = await client.post(url, json=kwargs.get("json"))
            elif method == "PATCH":
                resp = await client.patch(url, json=kwargs.get("json"))
            else:
                return {"error": f"Método no soportado: {method}"}
            
            if resp.status_code >= 400:
                return {"error": f"Error {resp.status_code}: {resp.text}"}
            return resp.json()
        except httpx.RequestError as e:
            return {"error": f"Error de conexión con la API: {str(e)}"}


@server.list_tools()
async def list_tools():
    return TOOLS


@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "listar_clientes":
        activo = arguments.get("activo", True)
        result = await call_api("GET", "/clientes", params={"activo": str(activo).lower()})
    
    elif name == "obtener_cliente":
        result = await call_api("GET", f"/clientes/{arguments['cliente_id']}")
    
    elif name == "crear_cliente":
        result = await call_api("POST", "/clientes", json={
            "nombre": arguments["nombre"],
            "telefono_principal": arguments.get("telefono"),
            "direccion_municipio": arguments.get("municipio"),
            "direccion_provincia": arguments.get("provincia")
        })
    
    elif name == "listar_trabajos":
        params = {}
        if arguments.get("estado"):
            params["estado"] = arguments["estado"]
        result = await call_api("GET", "/trabajos", params=params)
    
    elif name == "obtener_trabajo":
        result = await call_api("GET", f"/trabajos/{arguments['trabajo_id']}")
    
    elif name == "crear_trabajo":
        body = {
            "titulo": arguments["titulo"],
            "descripcion": arguments.get("descripcion"),
            "cliente_id": arguments.get("cliente_id"),
            "cliente_nombre": arguments.get("cliente_nombre"),
            "estado": arguments.get("estado", "pendiente"),
            "prioridad": arguments.get("prioridad", "media"),
            "obra_municipio": arguments.get("obra_municipio")
        }
        result = await call_api("POST", "/trabajos", json=body)
    
    elif name == "tareas_por_fecha":
        result = await call_api("GET", f"/tareas/fecha/{arguments['fecha']}")
    
    elif name == "añadir_tarea_checklist":
        body = {
            "descripcion": arguments["descripcion"],
            "fecha_programada": arguments.get("fecha_programada"),
            "hora_programada": arguments.get("hora_programada")
        }
        result = await call_api("POST", f"/trabajos/{arguments['trabajo_id']}/checklist", json=body)
    
    elif name == "completar_tarea":
        result = await call_api("PATCH", f"/checklist/{arguments['item_id']}", json={"completada": True})
    
    elif name == "registrar_tiempo":
        from datetime import date
        body = {
            "fecha": arguments.get("fecha", date.today().isoformat()),
            "horas": arguments["horas"],
            "descripcion": arguments.get("descripcion")
        }
        result = await call_api("POST", f"/trabajos/{arguments['trabajo_id']}/tiempos", json=body)
    
    elif name == "listar_materiales":
        params = {}
        if arguments.get("categoria"):
            params["categoria"] = arguments["categoria"]
        result = await call_api("GET", "/materiales", params=params)
    
    elif name == "crear_material":
        result = await call_api("POST", "/materiales", json={
            "nombre": arguments["nombre"],
            "categoria": arguments.get("categoria"),
            "precio_unitario": arguments.get("precio_unitario", 0),
            "unidad_medida": arguments.get("unidad_medida", "ud"),
            "fabricante": arguments.get("fabricante")
        })
    
    elif name == "actualizar_estado_trabajo":
        result = await call_api("PATCH", f"/trabajos/{arguments['trabajo_id']}", json={
            "estado": arguments["estado"]
        })
    
    elif name == "actualizar_cliente":
        body = {k: v for k, v in arguments.items() if k != "cliente_id" and v is not None}
        result = await call_api("PATCH", f"/clientes/{arguments['cliente_id']}", json=body)

    # ── Comentarios handlers ──────────────────────────
    elif name == "listar_comentarios_trabajo":
        result = await call_api("GET", f"/trabajos/{arguments['trabajo_id']}/comentarios")

    elif name == "añadir_comentario_trabajo":
        body = {
            "contenido": arguments["contenido"],
            "autor": arguments.get("autor", "Usuario")
        }
        result = await call_api("POST", f"/trabajos/{arguments['trabajo_id']}/comentarios", json=body)

    elif name == "listar_comentarios":
        result = await call_api("GET", f"/comentarios/{arguments['entity_type']}/{arguments['entity_id']}")

    elif name == "añadir_comentario":
        body = {
            "contenido": arguments["contenido"],
            "autor": arguments.get("autor", "Usuario")
        }
        result = await call_api("POST", f"/comentarios/{arguments['entity_type']}/{arguments['entity_id']}", json=body)

    # ── Calendario handlers ───────────────────────────
    elif name == "crear_evento":
        body = {
            "titulo": arguments["titulo"],
            "descripcion": arguments.get("descripcion"),
            "fecha_evento": arguments["fecha_evento"],
            "hora_evento": arguments.get("hora_evento"),
            "duracion_min": arguments.get("duracion_min", 60),
            "entidad_tipo": arguments.get("entidad_tipo"),
            "entidad_nombre": arguments.get("entidad_nombre"),
            "cliente_nombre": arguments.get("cliente_nombre"),
            "ubicacion": arguments.get("ubicacion"),
            "color": arguments.get("color", "#3B82F6"),
            "estado": arguments.get("estado", "pendiente")
        }
        result = await call_api("POST", "/calendario", json=body)
    
    elif name == "listar_eventos":
        params = {}
        if arguments.get("fecha"):
            params["fecha"] = arguments["fecha"]
        if arguments.get("entidad_tipo"):
            params["entidad_tipo"] = arguments["entidad_tipo"]
        if arguments.get("estado"):
            params["estado"] = arguments["estado"]
        result = await call_api("GET", "/calendario", params=params)
    
    elif name == "eventos_por_rango":
        result = await call_api("GET", "/calendario/rango", params={
            "desde": arguments["desde"],
            "hasta": arguments["hasta"]
        })
    
    elif name == "eliminar_evento":
        result = await call_api("DELETE", f"/calendario/{arguments['evento_id']}")
    
    # ── Presupuestos handlers ─────────────────────────
    elif name == "listar_presupuestos":
        params = {}
        if arguments.get("estado"):
            params["estado"] = arguments["estado"]
        result = await call_api("GET", "/presupuestos", params=params)
    
    elif name == "obtener_presupuesto":
        result = await call_api("GET", f"/presupuestos/{arguments['presupuesto_id']}")
    
    elif name == "crear_presupuesto":
        body = {
            "titulo": arguments["titulo"],
            "descripcion": arguments.get("descripcion"),
            "cliente_id": arguments.get("cliente_id"),
            "cliente_nombre": arguments.get("cliente_nombre"),
            "base_imponible": arguments.get("base_imponible", 0),
            "iva": arguments.get("iva", 0),
            "total": arguments.get("total", 0),
            "estado": arguments.get("estado", "borrador"),
            "validez_dias": arguments.get("validez_dias", 30),
            "condiciones_pago": arguments.get("condiciones_pago"),
            "notas": arguments.get("notas")
        }
        result = await call_api("POST", "/presupuestos", json=body)
    
    elif name == "actualizar_estado_presupuesto":
        result = await call_api("PATCH", f"/presupuestos/{arguments['presupuesto_id']}", json={
            "estado": arguments["estado"]
        })

    elif name == "listar_lineas_presupuesto":
        result = await call_api("GET", f"/presupuestos/{arguments['presupuesto_id']}/lineas")

    elif name == "añadir_linea_presupuesto":
        body = {
            "descripcion": arguments["descripcion"],
            "cantidad": arguments.get("cantidad", 1),
            "unidad": arguments.get("unidad", "ud"),
            "precio_unitario": arguments.get("precio_unitario", 0),
            "importe": arguments.get("importe", 0)
        }
        result = await call_api("POST", f"/presupuestos/{arguments['presupuesto_id']}/lineas", json=body)
    
    else:
        result = {"error": f"Tool '{name}' no encontrado"}
    
    text = json.dumps(result, indent=2, ensure_ascii=False)
    return [TextContent(type="text", text=text)]


# ── Main ─────────────────────────────────────────────

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())

"""
AI-First Autónomos — FastAPI REST API
Provides CRUD operations over PostgreSQL for all entities.
"""
import os, json
from datetime import date, datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import psycopg2
import psycopg2.extras

os.environ["LD_LIBRARY_PATH"] = "/home/ai/pg-dist/usr/lib/x86_64-linux-gnu:/home/ai/pg-dist/usr/lib/postgresql/16/lib"
DB_DSN = "host=/home/ai/pg-data/sockets dbname=ai_first_autonomos user=ai_first password=ai_first_2026"

app = FastAPI(
    title="AI-First Autónomos API",
    description="ERP API para autónomos del sector eléctrico/instalaciones",
    version="1.0.0",
    docs_url="/docs",
)

SWAGGER_PATH = os.path.join(os.path.dirname(__file__), "..", "docs", "swagger.html")


@app.get("/docs/swagger-ui")
async def swagger_ui():
    return FileResponse(SWAGGER_PATH)


# ── Database helpers ──────────────────────────────────

def get_db():
    return psycopg2.connect(DB_DSN)

def serialize(val):
    """Convert datetimes to ISO strings for JSON serialization."""
    if isinstance(val, (datetime, date)):
        return val.isoformat()
    return val


# ── Pydantic Models ───────────────────────────────────

class ClienteCreate(BaseModel):
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "nombre": "María García",
                    "apellidos": "López",
                    "nif_cif": "12345678A",
                    "tipo_cliente": "persona_fisica",
                    "telefono_principal": "+34 612 345 678",
                    "email": "maria@ejemplo.com",
                    "direccion_calle": "Calle Lleida",
                    "direccion_numero": "43",
                    "direccion_municipio": "Gironella",
                    "direccion_provincia": "Barcelona",
                    "direccion_codigo_postal": "08680"
                }
            ]
        }
    }
    nombre: str
    apellidos: Optional[str] = None
    nif_cif: Optional[str] = None
    tipo_cliente: str = "persona_fisica"
    telefono_principal: Optional[str] = None
    email: Optional[str] = None
    direccion_calle: Optional[str] = None
    direccion_numero: Optional[str] = None
    direccion_municipio: Optional[str] = None
    direccion_provincia: Optional[str] = None
    direccion_codigo_postal: Optional[str] = None

class TrabajoCreate(BaseModel):
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "titulo": "Instalación eléctrica cocina",
                    "descripcion": "Nuevo punto de luz, enchufes adicionales, circuito independiente para electrodomésticos y toma de tierra.",
                    "cliente_id": 1,
                    "cliente_nombre": "María García",
                    "estado": "pendiente",
                    "prioridad": "media",
                    "obra_calle": "Calle Lleida",
                    "obra_numero": "43",
                    "obra_municipio": "Gironella",
                    "obra_provincia": "Barcelona",
                    "fecha_inicio": "2026-06-01",
                    "fecha_fin_estimada": "2026-06-01"
                }
            ]
        }
    }
    titulo: str
    descripcion: Optional[str] = None
    cliente_id: Optional[int] = None
    cliente_nombre: Optional[str] = None
    estado: str = "pendiente"
    prioridad: str = "media"
    obra_calle: Optional[str] = None
    obra_numero: Optional[str] = None
    obra_municipio: Optional[str] = None
    obra_provincia: Optional[str] = None
    fecha_inicio: Optional[str] = None
    fecha_fin_estimada: Optional[str] = None

class MaterialCreate(BaseModel):
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "nombre": "Cable AFUMEX 3 hilos 2.5mm²",
                    "descripcion": "Cable unipolar de cobre para instalaciones eléctricas fijas",
                    "categoria": "cables",
                    "precio_unitario": 3.50,
                    "unidad_medida": "m",
                    "fabricante": "Prysmian"
                }
            ]
        }
    }
    nombre: str
    descripcion: Optional[str] = None
    categoria: Optional[str] = None
    precio_unitario: float = 0
    unidad_medida: str = "ud"
    fabricante: Optional[str] = None

class ChecklistCreate(BaseModel):
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "descripcion": "Llamar a María García para confirmar visita",
                    "fecha_programada": "2026-06-01",
                    "hora_programada": "10:00",
                    "notas": "Confirmar si está en casa"
                }
            ]
        }
    }
    descripcion: str
    fecha_programada: Optional[str] = None
    hora_programada: Optional[str] = None
    notas: Optional[str] = None

class TiempoCreate(BaseModel):
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "fecha": "2026-05-28",
                    "horas": 3.0,
                    "descripcion": "Instalación encimera y trabajos eléctricos"
                }
            ]
        }
    }
    fecha: str
    horas: float
    descripcion: Optional[str] = None

class CalendarioCreate(BaseModel):
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "titulo": "Instalación caldera - María García",
                    "descripcion": "Conexión eléctrica, gas y evacuación de humos",
                    "fecha_evento": "2026-05-29",
                    "hora_evento": "12:00",
                    "duracion_min": 150,
                    "entidad_tipo": "trabajo",
                    "entidad_nombre": "Instalación caldera",
                    "entidad_id": 2,
                    "cliente_nombre": "María García",
                    "ubicacion": "C/ Lleida, 43 - Gironella",
                    "estado": "confirmado",
                    "color": "#F59E0B",
                    "notas": "Llevar herramientas de gas"
                }
            ]
        }
    }
    titulo: str
    descripcion: Optional[str] = None
    fecha_evento: str
    hora_evento: Optional[str] = None
    hora_fin: Optional[str] = None
    duracion_min: int = 60
    entidad_tipo: Optional[str] = None
    entidad_nombre: Optional[str] = None
    entidad_id: Optional[int] = None
    cliente_nombre: Optional[str] = None
    cliente_id: Optional[int] = None
    ubicacion: Optional[str] = None
    estado: str = "pendiente"
    color: str = "#3B82F6"
    notas: Optional[str] = None

class PresupuestoCreate(BaseModel):
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "titulo": "Reforma eléctrica cocina",
                    "descripcion": "Instalación eléctrica completa: punto de luz, enchufes, circuito electrodomésticos y toma de tierra.",
                    "cliente_id": 1,
                    "cliente_nombre": "María García",
                    "estado": "borrador",
                    "validez_dias": 30,
                    "base_imponible": 705.00,
                    "iva": 148.05,
                    "tipo_iva": 21.00,
                    "retencion_irpf": 0,
                    "total": 853.05,
                    "condiciones_pago": "Transferencia 30 días",
                    "notas": "Material y mano de obra incluidos"
                }
            ]
        }
    }
    titulo: str
    descripcion: Optional[str] = None
    cliente_id: Optional[int] = None
    cliente_nombre: Optional[str] = None
    estado: str = "borrador"
    validez_dias: int = 30
    base_imponible: float = 0
    iva: float = 0
    tipo_iva: float = 21.00
    retencion_irpf: float = 0
    total: float = 0
    condiciones_pago: Optional[str] = None
    notas: Optional[str] = None

class OportunidadCreate(BaseModel):
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "titulo": "Instalación placas solares",
                    "descripcion": "Cliente interesado en autoconsumo con 6 paneles e inversor",
                    "cliente_id": 1,
                    "cliente_nombre": "María García",
                    "estado": "abierta",
                    "origen": "recomendacion",
                    "probabilidad_cierre": 60,
                    "presupuesto_estimado": 4500.00,
                    "fecha_contacto": "2026-05-28",
                    "fecha_cierre_estimada": "2026-06-15",
                    "notas_seguimiento": "Le enviaremos presupuesto detallado la próxima semana"
                }
            ]
        }
    }
    titulo: str
    descripcion: Optional[str] = None
    cliente_id: Optional[int] = None
    cliente_nombre: Optional[str] = None
    estado: str = "abierta"
    origen: Optional[str] = None
    probabilidad_cierre: int = 50
    presupuesto_estimado: float = 0
    fecha_contacto: Optional[str] = None
    fecha_cierre_estimada: Optional[str] = None
    notas_seguimiento: Optional[str] = None

class FacturaCreate(BaseModel):
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "tipo": "factura",
                    "cliente_id": 1,
                    "cliente_nombre": "María García",
                    "nif_cif_cliente": "12345678A",
                    "trabajo_id": 1,
                    "presupuesto_id": 1,
                    "fecha_emision": "2026-05-28",
                    "fecha_vencimiento": "2026-06-27",
                    "base_imponible": 705.00,
                    "iva": 148.05,
                    "tipo_iva": 21.00,
                    "retencion_irpf": 0,
                    "total": 853.05,
                    "estado_pago": "pendiente",
                    "forma_pago": "transferencia",
                    "datos_bancarios_iban": "ES00 0000 0000 0000 0000 0000",
                    "datos_bancarios_titular": "Franc Pérez",
                    "regimen_iva": "general",
                    "factura_direccion_calle": "Calle Lleida",
                    "factura_direccion_numero": "43",
                    "factura_direccion_codigo_postal": "08680",
                    "factura_direccion_municipio": "Gironella",
                    "factura_direccion_provincia": "Barcelona"
                }
            ]
        }
    }
    tipo: str = "factura"
    cliente_id: Optional[int] = None
    cliente_nombre: Optional[str] = None
    nif_cif_cliente: Optional[str] = None
    trabajo_id: Optional[int] = None
    presupuesto_id: Optional[int] = None
    fecha_emision: Optional[str] = None
    fecha_vencimiento: Optional[str] = None
    base_imponible: float = 0
    iva: float = 0
    tipo_iva: float = 21.00
    retencion_irpf: float = 0
    total: float = 0
    estado_pago: str = "pendiente"
    forma_pago: Optional[str] = None
    datos_bancarios_iban: Optional[str] = None
    datos_bancarios_titular: Optional[str] = None
    regimen_iva: Optional[str] = None
    factura_direccion_calle: Optional[str] = None
    factura_direccion_numero: Optional[str] = None
    factura_direccion_codigo_postal: Optional[str] = None
    factura_direccion_municipio: Optional[str] = None
    factura_direccion_provincia: Optional[str] = None


# ══════════════════════════════════════════════════════
# CLIENTES
# ══════════════════════════════════════════════════════

@app.get("/api/clientes")
def listar_clientes(activo: bool = True):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM clientes WHERE active = %s ORDER BY nombre", (activo,))
        rows = cur.fetchall()
        return [serialize_dict(r) for r in rows]
    finally:
        conn.close()

@app.get("/api/clientes/{cliente_id}")
def obtener_cliente(cliente_id: int):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM clientes WHERE id = %s", (cliente_id,))
        r = cur.fetchone()
        if not r:
            raise HTTPException(404, "Cliente no encontrado")
        return serialize_dict(r)
    finally:
        conn.close()

@app.post("/api/clientes")
def crear_cliente(data: ClienteCreate):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO clientes (nombre, apellidos, nif_cif, tipo_cliente,
                telefono_principal, email,
                direccion_calle, direccion_numero, direccion_municipio,
                direccion_provincia, direccion_codigo_postal)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            RETURNING id
        """, (
            data.nombre, data.apellidos, data.nif_cif, data.tipo_cliente,
            data.telefono_principal, data.email,
            data.direccion_calle, data.direccion_numero, data.direccion_municipio,
            data.direccion_provincia, data.direccion_codigo_postal
        ))
        new_id = cur.fetchone()[0]
        conn.commit()
        return {"id": new_id, "mensaje": "Cliente creado"}
    finally:
        conn.close()

@app.patch("/api/clientes/{cliente_id}")
def actualizar_cliente(cliente_id: int, data: dict):
    conn = get_db()
    try:
        cur = conn.cursor()
        sets = []
        vals = []
        for k, v in data.items():
            if v is not None:
                sets.append(f"{k} = %s")
                vals.append(v)
        if not sets:
            raise HTTPException(400, "Sin campos para actualizar")
        vals.append(cliente_id)
        cur.execute(f"UPDATE clientes SET {', '.join(sets)}, fecha_modificacion = NOW() WHERE id = %s", vals)
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(404, "Cliente no encontrado")
        return {"mensaje": "Cliente actualizado"}
    finally:
        conn.close()


# ══════════════════════════════════════════════════════
# TRABAJOS
# ══════════════════════════════════════════════════════

@app.get("/api/trabajos")
def listar_trabajos(activo: bool = True, estado: str = None):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        if estado:
            cur.execute("SELECT * FROM trabajos WHERE activo = %s AND estado = %s ORDER BY fecha_creacion DESC", (activo, estado))
        else:
            cur.execute("SELECT * FROM trabajos WHERE activo = %s ORDER BY fecha_creacion DESC", (activo,))
        return [serialize_dict(r) for r in cur.fetchall()]
    finally:
        conn.close()

@app.get("/api/trabajos/{trabajo_id}")
def obtener_trabajo(trabajo_id: int):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM trabajos WHERE id = %s", (trabajo_id,))
        t = cur.fetchone()
        if not t:
            raise HTTPException(404, "Trabajo no encontrado")
        t = serialize_dict(t)

        cur.execute("SELECT * FROM trabajo_checklist WHERE trabajo_id = %s ORDER BY id", (trabajo_id,))
        t["checklist"] = [serialize_dict(r) for r in cur.fetchall()]
        cur.execute("SELECT * FROM trabajo_tiempos WHERE trabajo_id = %s ORDER BY fecha", (trabajo_id,))
        t["tiempos"] = [serialize_dict(r) for r in cur.fetchall()]
        cur.execute("SELECT * FROM trabajo_materiales WHERE trabajo_id = %s", (trabajo_id,))
        t["materiales"] = [serialize_dict(r) for r in cur.fetchall()]
        cur.execute("SELECT * FROM comentarios WHERE entity_type = 'trabajo' AND entity_id = %s ORDER BY fecha_creacion ASC", (trabajo_id,))
        t["comentarios"] = [serialize_dict(r) for r in cur.fetchall()]

        return t
    finally:
        conn.close()

@app.post("/api/trabajos")
def crear_trabajo(data: TrabajoCreate):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO trabajos (titulo, descripcion, cliente_id, cliente_nombre,
                estado, prioridad, obra_calle, obra_numero, obra_municipio,
                obra_provincia, fecha_inicio, fecha_fin_estimada)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            RETURNING id
        """, (
            data.titulo, data.descripcion, data.cliente_id, data.cliente_nombre,
            data.estado, data.prioridad, data.obra_calle, data.obra_numero,
            data.obra_municipio, data.obra_provincia,
            data.fecha_inicio, data.fecha_fin_estimada
        ))
        new_id = cur.fetchone()[0]
        conn.commit()
        return {"id": new_id, "mensaje": "Trabajo creado"}
    finally:
        conn.close()

@app.patch("/api/trabajos/{trabajo_id}")
def actualizar_trabajo(trabajo_id: int, data: dict):
    conn = get_db()
    try:
        cur = conn.cursor()
        sets = []
        vals = []
        for k, v in data.items():
            if v is not None:
                sets.append(f"{k} = %s")
                vals.append(v)
        if not sets:
            raise HTTPException(400, "Sin campos para actualizar")
        vals.append(trabajo_id)
        cur.execute(f"UPDATE trabajos SET {', '.join(sets)}, fecha_modificacion = NOW() WHERE id = %s", vals)
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(404, "Trabajo no encontrado")
        return {"mensaje": "Trabajo actualizado"}
    finally:
        conn.close()

# ── Checklist en trabajos ────────────────────────────

@app.get("/api/trabajos/{trabajo_id}/checklist")
def listar_checklist(trabajo_id: int):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM trabajo_checklist WHERE trabajo_id = %s ORDER BY fecha_programada, hora_programada", (trabajo_id,))
        return [serialize_dict(r) for r in cur.fetchall()]
    finally:
        conn.close()

@app.post("/api/trabajos/{trabajo_id}/checklist")
def añadir_checklist(trabajo_id: int, data: ChecklistCreate):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO trabajo_checklist (trabajo_id, descripcion,
                fecha_programada, hora_programada, notas)
            VALUES (%s,%s,%s,%s,%s)
        """, (trabajo_id, data.descripcion, data.fecha_programada, data.hora_programada, data.notas))
        conn.commit()
        return {"mensaje": "Item añadido al checklist"}
    finally:
        conn.close()

@app.patch("/api/checklist/{item_id}")
def completar_checklist(item_id: int, completada: bool = True):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("""
            UPDATE trabajo_checklist
            SET completada = %s, fecha_completada = CASE WHEN %s THEN NOW() ELSE NULL END
            WHERE id = %s
        """, (completada, completada, item_id))
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(404, "Item no encontrado")
        return {"mensaje": "Item actualizado"}
    finally:
        conn.close()

# ── Tiempos ──────────────────────────────────────────

@app.post("/api/trabajos/{trabajo_id}/tiempos")
def registrar_tiempo(trabajo_id: int, data: TiempoCreate):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO trabajo_tiempos (trabajo_id, fecha, horas, descripcion)
            VALUES (%s,%s,%s,%s)
        """, (trabajo_id, data.fecha, data.horas, data.descripcion))
        conn.commit()
        return {"mensaje": "Tiempo registrado"}
    finally:
        conn.close()

# ── Tareas por fecha ─────────────────────────────────

@app.get("/api/tareas/fecha/{fecha}")
def tareas_por_fecha(fecha: str):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT tc.*, t.titulo as trabajo_titulo, t.cliente_nombre
            FROM trabajo_checklist tc
            JOIN trabajos t ON tc.trabajo_id = t.id
            WHERE tc.fecha_programada = %s AND tc.completada = FALSE
            ORDER BY tc.hora_programada
        """, (fecha,))
        return [serialize_dict(r) for r in cur.fetchall()]
    finally:
        conn.close()


# ── Comentarios genéricos (todas las entidades) ─────

@app.get("/api/comentarios/{entity_type}/{entity_id}")
def listar_comentarios(entity_type: str, entity_id: int):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM comentarios WHERE entity_type = %s AND entity_id = %s ORDER BY fecha_creacion ASC", (entity_type, entity_id))
        return [serialize_dict(r) for r in cur.fetchall()]
    finally:
        conn.close()

@app.post("/api/comentarios/{entity_type}/{entity_id}")
def anadir_comentario(entity_type: str, entity_id: int, data: dict):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO comentarios (entity_type, entity_id, autor, contenido)
            VALUES (%s,%s,%s,%s)
        """, (entity_type, entity_id, data.get("autor", "Usuario"), data["contenido"]))
        conn.commit()
        return {"mensaje": "Comentario añadido"}
    finally:
        conn.close()


# ── Comentarios en trabajos (backwards compat) ──────

@app.get("/api/trabajos/{trabajo_id}/comentarios")
def listar_comentarios_trabajo(trabajo_id: int):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM comentarios WHERE entity_type = 'trabajo' AND entity_id = %s ORDER BY fecha_creacion ASC", (trabajo_id,))
        return [serialize_dict(r) for r in cur.fetchall()]
    finally:
        conn.close()

@app.post("/api/trabajos/{trabajo_id}/comentarios")
def anadir_comentario_trabajo(trabajo_id: int, data: dict):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO comentarios (entity_type, entity_id, autor, contenido)
            VALUES ('trabajo',%s,%s,%s)
        """, (trabajo_id, data.get("autor", "Usuario"), data["contenido"]))
        conn.commit()
        return {"mensaje": "Comentario añadido"}
    finally:
        conn.close()


# ══════════════════════════════════════════════════════
# MATERIALES
# ══════════════════════════════════════════════════════

@app.get("/api/materiales")
def listar_materiales(activo: bool = True, categoria: str = None):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        if categoria:
            cur.execute("SELECT * FROM materiales WHERE activo = %s AND categoria = %s ORDER BY nombre", (activo, categoria))
        else:
            cur.execute("SELECT * FROM materiales WHERE activo = %s ORDER BY nombre", (activo,))
        return [serialize_dict(r) for r in cur.fetchall()]
    finally:
        conn.close()

@app.post("/api/materiales")
def crear_material(data: MaterialCreate):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO materiales (nombre, descripcion, categoria,
                precio_unitario, unidad_medida, fabricante)
            VALUES (%s,%s,%s,%s,%s,%s)
            RETURNING id
        """, (data.nombre, data.descripcion, data.categoria, data.precio_unitario, data.unidad_medida, data.fabricante))
        new_id = cur.fetchone()[0]
        conn.commit()
        return {"id": new_id, "mensaje": "Material creado"}
    finally:
        conn.close()


# ══════════════════════════════════════════════════════
# CALENDARIO
# ══════════════════════════════════════════════════════

@app.get("/api/calendario")
def listar_eventos(fecha: str = None, entidad_tipo: str = None, estado: str = None):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        where = ["activo = TRUE"]
        params = []
        if fecha:
            where.append("fecha_evento = %s")
            params.append(fecha)
        if entidad_tipo:
            where.append("entidad_tipo = %s")
            params.append(entidad_tipo)
        if estado:
            where.append("estado = %s")
            params.append(estado)
        sql = f"SELECT * FROM calendario WHERE {' AND '.join(where)} ORDER BY fecha_evento, hora_evento"
        cur.execute(sql, params)
        return [serialize_dict(r) for r in cur.fetchall()]
    finally:
        conn.close()

@app.get("/api/calendario/rango")
def eventos_por_rango(desde: str, hasta: str):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT * FROM calendario
            WHERE activo = TRUE AND fecha_evento >= %s AND fecha_evento <= %s
            ORDER BY fecha_evento, hora_evento
        """, (desde, hasta))
        return [serialize_dict(r) for r in cur.fetchall()]
    finally:
        conn.close()

@app.post("/api/calendario")
def crear_evento(data: CalendarioCreate):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO calendario (titulo, descripcion, fecha_evento, hora_evento,
                hora_fin, duracion_min, entidad_tipo, entidad_nombre, entidad_id,
                cliente_nombre, cliente_id, ubicacion, estado, color, notas)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            RETURNING id
        """, (
            data.titulo, data.descripcion, data.fecha_evento, data.hora_evento,
            data.hora_fin, data.duracion_min, data.entidad_tipo, data.entidad_nombre,
            data.entidad_id, data.cliente_nombre, data.cliente_id, data.ubicacion,
            data.estado, data.color, data.notas
        ))
        new_id = cur.fetchone()[0]
        conn.commit()
        return {"id": new_id, "mensaje": "Evento creado"}
    finally:
        conn.close()

@app.patch("/api/calendario/{evento_id}")
def actualizar_evento(evento_id: int, data: dict):
    conn = get_db()
    try:
        cur = conn.cursor()
        sets = []
        vals = []
        for k, v in data.items():
            if v is not None:
                sets.append(f"{k} = %s")
                vals.append(v)
        if not sets:
            raise HTTPException(400, "Sin campos para actualizar")
        vals.append(evento_id)
        cur.execute(f"UPDATE calendario SET {', '.join(sets)}, fecha_actualizacion = NOW() WHERE id = %s", vals)
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(404, "Evento no encontrado")
        return {"mensaje": "Evento actualizado"}
    finally:
        conn.close()

@app.delete("/api/calendario/{evento_id}")
def eliminar_evento(evento_id: int):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("UPDATE calendario SET activo = FALSE, fecha_actualizacion = NOW() WHERE id = %s", (evento_id,))
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(404, "Evento no encontrado")
        return {"mensaje": "Evento eliminado"}
    finally:
        conn.close()


# ══════════════════════════════════════════════════════
# OPORTUNIDADES
# ══════════════════════════════════════════════════════

@app.get("/api/oportunidades")
def listar_oportunidades(activo: bool = True, estado: str = None):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        if estado:
            cur.execute("SELECT * FROM oportunidades WHERE activo = %s AND estado = %s ORDER BY fecha_creacion DESC", (activo, estado))
        else:
            cur.execute("SELECT * FROM oportunidades WHERE activo = %s ORDER BY fecha_creacion DESC", (activo,))
        return [serialize_dict(r) for r in cur.fetchall()]
    finally:
        conn.close()

@app.get("/api/oportunidades/{oportunidad_id}")
def obtener_oportunidad(oportunidad_id: int):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM oportunidades WHERE id = %s", (oportunidad_id,))
        r = cur.fetchone()
        if not r:
            raise HTTPException(404, "Oportunidad no encontrada")
        return serialize_dict(r)
    finally:
        conn.close()

@app.post("/api/oportunidades")
def crear_oportunidad(data: OportunidadCreate):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO oportunidades (titulo, descripcion, cliente_id, cliente_nombre,
                estado, origen, probabilidad_cierre, presupuesto_estimado,
                fecha_contacto, fecha_cierre_estimada, notas_seguimiento)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            RETURNING id
        """, (
            data.titulo, data.descripcion, data.cliente_id, data.cliente_nombre,
            data.estado, data.origen, data.probabilidad_cierre, data.presupuesto_estimado,
            data.fecha_contacto, data.fecha_cierre_estimada, data.notas_seguimiento
        ))
        new_id = cur.fetchone()[0]
        conn.commit()
        return {"id": new_id, "mensaje": "Oportunidad creada"}
    finally:
        conn.close()

@app.patch("/api/oportunidades/{oportunidad_id}")
def actualizar_oportunidad(oportunidad_id: int, data: dict):
    conn = get_db()
    try:
        cur = conn.cursor()
        sets = []
        vals = []
        for k, v in data.items():
            if v is not None:
                sets.append(f"{k} = %s")
                vals.append(v)
        if not sets:
            raise HTTPException(400, "Sin campos para actualizar")
        vals.append(oportunidad_id)
        cur.execute(f"UPDATE oportunidades SET {', '.join(sets)} WHERE id = %s", vals)
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(404, "Oportunidad no encontrada")
        return {"mensaje": "Oportunidad actualizada"}
    finally:
        conn.close()

@app.delete("/api/oportunidades/{oportunidad_id}")
def eliminar_oportunidad(oportunidad_id: int):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("UPDATE oportunidades SET activo = FALSE WHERE id = %s", (oportunidad_id,))
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(404, "Oportunidad no encontrada")
        return {"mensaje": "Oportunidad eliminada"}
    finally:
        conn.close()


# ══════════════════════════════════════════════════════
# PRESUPUESTOS

@app.get("/api/presupuestos")
def listar_presupuestos(activo: bool = True, estado: str = None):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        if estado:
            cur.execute("SELECT * FROM presupuestos WHERE activo = %s AND estado = %s ORDER BY fecha_creacion DESC", (activo, estado))
        else:
            cur.execute("SELECT * FROM presupuestos WHERE activo = %s ORDER BY fecha_creacion DESC", (activo,))
        return [serialize_dict(r) for r in cur.fetchall()]
    finally:
        conn.close()

@app.get("/api/presupuestos/{presupuesto_id}")
def obtener_presupuesto(presupuesto_id: int):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM presupuestos WHERE id = %s", (presupuesto_id,))
        p = cur.fetchone()
        if not p:
            raise HTTPException(404, "Presupuesto no encontrado")
        p = serialize_dict(p)
        cur.execute("SELECT * FROM presupuesto_lineas WHERE presupuesto_id = %s ORDER BY id", (presupuesto_id,))
        p["lineas"] = [serialize_dict(r) for r in cur.fetchall()]
        return p
    finally:
        conn.close()

@app.post("/api/presupuestos")
def crear_presupuesto(data: PresupuestoCreate):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO presupuestos (titulo, descripcion, cliente_id, cliente_nombre,
                estado, validez_dias, base_imponible, iva, tipo_iva,
                retencion_irpf, total, condiciones_pago, notas)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            RETURNING id
        """, (
            data.titulo, data.descripcion, data.cliente_id, data.cliente_nombre,
            data.estado, data.validez_dias, data.base_imponible, data.iva,
            data.tipo_iva, data.retencion_irpf, data.total,
            data.condiciones_pago, data.notas
        ))
        new_id = cur.fetchone()[0]
        conn.commit()
        return {"id": new_id, "mensaje": "Presupuesto creado"}
    finally:
        conn.close()

@app.patch("/api/presupuestos/{presupuesto_id}")
def actualizar_presupuesto(presupuesto_id: int, data: dict):
    conn = get_db()
    try:
        cur = conn.cursor()
        sets = []
        vals = []
        for k, v in data.items():
            if v is not None:
                sets.append(f"{k} = %s")
                vals.append(v)
        if not sets:
            raise HTTPException(400, "Sin campos para actualizar")
        vals.append(presupuesto_id)
        cur.execute(f"UPDATE presupuestos SET {', '.join(sets)}, fecha_modificacion = NOW() WHERE id = %s", vals)
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(404, "Presupuesto no encontrado")
        return {"mensaje": "Presupuesto actualizado"}
    finally:
        conn.close()

@app.delete("/api/presupuestos/{presupuesto_id}")
def eliminar_presupuesto(presupuesto_id: int):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("UPDATE presupuestos SET activo = FALSE, fecha_modificacion = NOW() WHERE id = %s", (presupuesto_id,))
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(404, "Presupuesto no encontrado")
        return {"mensaje": "Presupuesto eliminado"}
    finally:
        conn.close()

# ── Líneas de presupuesto ─────────────────────────

@app.get("/api/presupuestos/{presupuesto_id}/lineas")
def listar_lineas(presupuesto_id: int):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM presupuesto_lineas WHERE presupuesto_id = %s ORDER BY id", (presupuesto_id,))
        return [serialize_dict(r) for r in cur.fetchall()]
    finally:
        conn.close()

@app.post("/api/presupuestos/{presupuesto_id}/lineas")
def añadir_linea(presupuesto_id: int, data: dict):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO presupuesto_lineas (presupuesto_id, descripcion, cantidad, unidad, precio_unitario, importe)
            VALUES (%s,%s,%s,%s,%s,%s)
        """, (
            presupuesto_id, data.get("descripcion"), data.get("cantidad", 1),
            data.get("unidad", "ud"), data.get("precio_unitario", 0),
            data.get("importe", 0)
        ))
        conn.commit()
        return {"mensaje": "Línea añadida"}
    finally:
        conn.close()


# ══════════════════════════════════════════════════════
# FACTURAS
# ══════════════════════════════════════════════════════

@app.get("/api/facturas")
def listar_facturas(activo: bool = True, estado_pago: str = None):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        if estado_pago:
            cur.execute("SELECT * FROM facturas WHERE activo = %s AND estado_pago = %s ORDER BY fecha_creacion DESC", (activo, estado_pago))
        else:
            cur.execute("SELECT * FROM facturas WHERE activo = %s ORDER BY fecha_creacion DESC", (activo,))
        return [serialize_dict(r) for r in cur.fetchall()]
    finally:
        conn.close()

@app.get("/api/facturas/{factura_id}")
def obtener_factura(factura_id: int):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM facturas WHERE id = %s", (factura_id,))
        f = cur.fetchone()
        if not f:
            raise HTTPException(404, "Factura no encontrada")
        f = serialize_dict(f)
        cur.execute("SELECT * FROM factura_lineas WHERE factura_id = %s ORDER BY id", (factura_id,))
        f["lineas"] = [serialize_dict(r) for r in cur.fetchall()]
        return f
    finally:
        conn.close()

@app.post("/api/facturas")
def crear_factura(data: FacturaCreate):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO facturas (tipo, cliente_id, cliente_nombre, nif_cif_cliente,
                trabajo_id, presupuesto_id, fecha_emision, fecha_vencimiento,
                base_imponible, iva, tipo_iva, retencion_irpf, total,
                estado_pago, forma_pago, datos_bancarios_iban, datos_bancarios_titular,
                regimen_iva, factura_direccion_calle, factura_direccion_numero,
                factura_direccion_codigo_postal, factura_direccion_municipio,
                factura_direccion_provincia)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            RETURNING id
        """, (
            data.tipo, data.cliente_id, data.cliente_nombre, data.nif_cif_cliente,
            data.trabajo_id, data.presupuesto_id, data.fecha_emision, data.fecha_vencimiento,
            data.base_imponible, data.iva, data.tipo_iva, data.retencion_irpf, data.total,
            data.estado_pago, data.forma_pago, data.datos_bancarios_iban, data.datos_bancarios_titular,
            data.regimen_iva, data.factura_direccion_calle, data.factura_direccion_numero,
            data.factura_direccion_codigo_postal, data.factura_direccion_municipio,
            data.factura_direccion_provincia
        ))
        new_id = cur.fetchone()[0]
        conn.commit()
        return {"id": new_id, "mensaje": "Factura creada"}
    finally:
        conn.close()

@app.patch("/api/facturas/{factura_id}")
def actualizar_factura(factura_id: int, data: dict):
    conn = get_db()
    try:
        cur = conn.cursor()
        sets = []
        vals = []
        for k, v in data.items():
            if v is not None:
                sets.append(f"{k} = %s")
                vals.append(v)
        if not sets:
            raise HTTPException(400, "Sin campos para actualizar")
        vals.append(factura_id)
        cur.execute(f"UPDATE facturas SET {', '.join(sets)}, fecha_modificacion = NOW() WHERE id = %s", vals)
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(404, "Factura no encontrada")
        return {"mensaje": "Factura actualizada"}
    finally:
        conn.close()

@app.delete("/api/facturas/{factura_id}")
def eliminar_factura(factura_id: int):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("UPDATE facturas SET activo = FALSE, fecha_modificacion = NOW() WHERE id = %s", (factura_id,))
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(404, "Factura no encontrada")
        return {"mensaje": "Factura eliminada"}
    finally:
        conn.close()

# ── Líneas de factura ────────────────────────────

@app.get("/api/facturas/{factura_id}/lineas")
def listar_lineas_factura(factura_id: int):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM factura_lineas WHERE factura_id = %s ORDER BY id", (factura_id,))
        return [serialize_dict(r) for r in cur.fetchall()]
    finally:
        conn.close()

@app.post("/api/facturas/{factura_id}/lineas")
def añadir_linea_factura(factura_id: int, data: dict):
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO factura_lineas (factura_id, descripcion, cantidad, unidad, precio_unitario, importe)
            VALUES (%s,%s,%s,%s,%s,%s)
        """, (
            factura_id, data.get("descripcion"), data.get("cantidad", 1),
            data.get("unidad", "ud"), data.get("precio_unitario", 0),
            data.get("importe", 0)
        ))
        conn.commit()
        return {"mensaje": "Línea añadida a la factura"}
    finally:
        conn.close()


# ══════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════

def serialize_dict(d):
    """Recursively convert datetimes to ISO strings in a dict."""
    result = {}
    for k, v in d.items():
        result[k] = serialize(v)
    return result


# ══════════════════════════════════════════════════════
# HEALTH
# ══════════════════════════════════════════════════════

@app.get("/health")
def health():
    return {"status": "ok", "db": "postgresql", "version": "1.0.0"}


# ══════════════════════════════════════════════════════
# WEB APP (React SPA)
# ══════════════════════════════════════════════════════

WEB_DIST = os.path.join(os.path.dirname(__file__), "..", "web", "dist")
if os.path.isdir(WEB_DIST):
    app.mount("/", StaticFiles(directory=WEB_DIST, html=True), name="web")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

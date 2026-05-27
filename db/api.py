"""
AI-First Autónomos — FastAPI REST API
Provides CRUD operations over PostgreSQL for all entities.
"""
import os, json
from datetime import date, datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
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
    nombre: str
    descripcion: Optional[str] = None
    categoria: Optional[str] = None
    precio_unitario: float = 0
    unidad_medida: str = "ud"
    fabricante: Optional[str] = None

class ChecklistCreate(BaseModel):
    descripcion: str
    fecha_programada: Optional[str] = None
    hora_programada: Optional[str] = None
    notas: Optional[str] = None

class TiempoCreate(BaseModel):
    fecha: str
    horas: float
    descripcion: Optional[str] = None

class CalendarioCreate(BaseModel):
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
# PRESUPUESTOS
# ══════════════════════════════════════════════════════

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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

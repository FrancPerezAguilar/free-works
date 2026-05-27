"""
Migrate existing YAML data to PostgreSQL.
Reads from yaml_store and inserts into PostgreSQL tables.
"""
import sys, os, json
from datetime import date, datetime, timezone

sys.path.insert(0, "/home/ai/ai-first-autonomos")
from core.yaml_store import store

os.environ["LD_LIBRARY_PATH"] = "/home/ai/pg-dist/usr/lib/x86_64-linux-gnu:/home/ai/pg-dist/usr/lib/postgresql/16/lib"

DB_DSN = "host=/home/ai/pg-data/sockets dbname=ai_first_autonomos user=ai_first password=ai_first_2026"

def get_conn():
    import psycopg2
    return psycopg2.connect(DB_DSN)

def safe(val, default=None):
    """Return None if empty string, else val"""
    if val is None or val == "":
        return default
    return val

# ── CLIENTES ───────────────────────────────────────
def migrate_clientes(conn):
    cur = conn.cursor()
    clientes = store.listar("clientes", {"activo": True})
    clientes += [c for c in store.listar("clientes") if not c.get("activo", True)]
    
    count = 0
    for c in clientes:
        direccion = c.get("direccion", {}) or {}
        bancarios = c.get("datos_bancarios", {}) or {}
        cond_pago = c.get("condiciones_pago", {}) or {}
        rgpd = c.get("consentimiento_rgpd", {}) or {}
        
        cur.execute("""
            INSERT INTO clientes (
                codigo_cliente, tipo_cliente, nombre, apellidos, nif_cif,
                telefono_principal, email, contacto_preferido,
                direccion_calle, direccion_numero, direccion_piso_puerta,
                direccion_codigo_postal, direccion_municipio, direccion_provincia,
                direccion_pais, regimen_iva, forma_pago_preferida,
                datos_bancarios_iban, datos_bancarios_titular,
                condiciones_pago_plazo_dias,
                origen_cliente, notas_internas, etiquetas,
                total_facturado, total_pendiente_cobro,
                estado, fecha_creacion, active
            ) VALUES (
                %s,%s,%s,%s,%s,%s,%s,%s,
                %s,%s,%s,%s,%s,%s,%s,%s,%s,
                %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s
            ) ON CONFLICT (codigo_cliente) DO NOTHING
        """, (
            c.get("id"), c.get("tipo_cliente", "persona_fisica"),
            c.get("nombre"), safe(c.get("apellidos")), safe(c.get("nif_cif")),
            safe(c.get("telefono_principal")), safe(c.get("email")),
            c.get("contacto_preferido", "telefono"),
            safe(direccion.get("calle")), safe(direccion.get("numero")),
            safe(direccion.get("piso_puerta")),
            safe(direccion.get("codigo_postal")), safe(direccion.get("municipio")),
            safe(direccion.get("provincia")), direccion.get("pais", "España"),
            c.get("regimen_iva", "general"), c.get("forma_pago_preferida", "transferencia"),
            safe(bancarios.get("iban")), safe(bancarios.get("titular")),
            cond_pago.get("plazo_dias", 30),
            c.get("origen_cliente", "desconocido"), safe(c.get("notas_internas")),
            c.get("etiquetas", []),
            c.get("total_facturado", 0), c.get("total_pendiente_cobro", 0),
            c.get("estado", "activo"),
            c.get("fecha_creacion") or datetime.now(timezone.utc).isoformat(),
            c.get("activo", True)
        ))
        count += cur.rowcount
    conn.commit()
    print(f"  Clientes migrados: {count}")

# ── MATERIALES ─────────────────────────────────────
def migrate_materiales(conn):
    cur = conn.cursor()
    try:
        materiales = store.listar("materiales", {"activo": True})
    except:
        materiales = store.listar("materiales")
    
    count = 0
    for m in materiales:
        proveedor = m.get("proveedor", {}) or {}
        cur.execute("""
            INSERT INTO materiales (
                codigo_material, nombre, descripcion, categoria, subcategoria,
                precio_unitario, iva_porcentaje, precio_con_iva, moneda,
                unidad_medida, stock_actual, ubicacion_almacen,
                referencia_fabricante, fabricante,
                activo, fecha_creacion
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (codigo_material) DO NOTHING
        """, (
            m.get("id"), m.get("nombre"), safe(m.get("descripcion")),
            safe(m.get("categoria")), safe(m.get("subcategoria")),
            m.get("precio_unitario", 0), m.get("iva_porcentaje", 21.00),
            m.get("precio_con_iva", 0), m.get("moneda", "EUR"),
            m.get("unidad_medida", "ud"), m.get("stock_actual", 0),
            safe(m.get("ubicacion_almacen")),
            safe(m.get("referencia_fabricante")), safe(m.get("fabricante")),
            m.get("activo", True),
            m.get("fecha_creacion") or datetime.now(timezone.utc).isoformat()
        ))
        count += cur.rowcount
    conn.commit()
    print(f"  Materiales migrados: {count}")

# ── TRABAJOS ───────────────────────────────────────
def migrate_trabajos(conn):
    cur = conn.cursor()
    trabajos = store.listar("trabajos", {"activo": True})
    trabajos += [t for t in store.listar("trabajos") if not t.get("activo", True)]
    
    count = 0
    for t in trabajos:
        obra = t.get("direccion_obra", {}) or {}
        
        # Insert trabajo
        cur.execute("""
            INSERT INTO trabajos (
                codigo_trabajo, titulo, descripcion,
                cliente_nombre,
                obra_calle, obra_numero, obra_piso_puerta,
                obra_codigo_postal, obra_municipio, obra_provincia, obra_notas_acceso,
                fecha_inicio, fecha_fin_estimada, fecha_fin_real,
                estado, prioridad,
                total_horas, coste_materiales, coste_mano_obra, coste_total,
                fecha_creacion, activo
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (codigo_trabajo) DO NOTHING
            RETURNING id
        """, (
            t.get("id"), t.get("titulo"), safe(t.get("descripcion")),
            t.get("cliente_nombre"),
            safe(obra.get("calle")), safe(obra.get("numero")),
            safe(obra.get("piso_puerta")),
            safe(obra.get("codigo_postal")), safe(obra.get("municipio")),
            safe(obra.get("provincia")), safe(obra.get("notas_acceso")),
            safe(t.get("fecha_inicio")), safe(t.get("fecha_fin_estimada")),
            safe(t.get("fecha_fin_real")),
            t.get("estado", "pendiente"), t.get("prioridad", "media"),
            t.get("total_horas", 0), t.get("coste_materiales", 0),
            t.get("coste_mano_obra", 0), t.get("coste_total", 0),
            t.get("fecha_creacion") or datetime.now(timezone.utc).isoformat(),
            t.get("activo", True)
        ))
        trabajo_pg_id = cur.fetchone()
        
        if not trabajo_pg_id:
            continue
        trabajo_pg_id = trabajo_pg_id[0]
        count += 1
        
        # Migrate checklist
        for item in t.get("checklist", []):
            prog_date = item.get("fecha_programada")
            prog_time = item.get("hora_programada")
            if prog_time and len(prog_time.split(":")) == 2:
                prog_time += ":00"
            comp_date = item.get("fecha_completada")
            
            cur.execute("""
                INSERT INTO trabajo_checklist 
                    (trabajo_id, descripcion, completada, fecha_programada, hora_programada, fecha_completada, notas)
                VALUES (%s,%s,%s,%s,%s,%s,%s)
            """, (
                trabajo_pg_id, item.get("descripcion", ""),
                item.get("completada", False),
                prog_date, safe(prog_time),
                comp_date, safe(item.get("notas"))
            ))
        
        # Migrate tiempos
        for tt in t.get("tiempos", []):
            cur.execute("""
                INSERT INTO trabajo_tiempos (trabajo_id, fecha, horas, descripcion)
                VALUES (%s,%s,%s,%s)
            """, (
                trabajo_pg_id, tt.get("fecha"), tt.get("horas", 0),
                safe(tt.get("descripcion"))
            ))
        
        # Migrate materiales
        for mt in t.get("materiales", []):
            cur.execute("""
                INSERT INTO trabajo_materiales
                    (trabajo_id, material_nombre, cantidad_usada, unidad, precio_unitario, subtotal, notas)
                VALUES (%s,%s,%s,%s,%s,%s,%s)
            """, (
                trabajo_pg_id, mt.get("material_nombre"),
                mt.get("cantidad_usada", 0), mt.get("unidad", "ud"),
                mt.get("precio_unitario", 0), mt.get("subtotal", 0),
                safe(mt.get("notas"))
            ))
    
    conn.commit()
    print(f"  Trabajos migrados: {count}")

if __name__ == "__main__":
    print("Migrando datos de YAML → PostgreSQL...\n")
    
    conn = get_conn()
    try:
        migrate_clientes(conn)
        migrate_materiales(conn)
        migrate_trabajos(conn)
        print("\n✅ Migración completada.")
    finally:
        conn.close()

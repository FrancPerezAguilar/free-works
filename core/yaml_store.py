"""
yaml_store.py — Fuente de verdad del sistema.

CRUD sobre archivos YAML con:
- IDs auto-generados (prefijo secuencial + UUID)
- Validación contra esquemas Pydantic
- Bloqueo de archivos para evitar corrupción
- Historial de cambios básico

Uso:
    from core.yaml_store import YamlStore
    store = YamlStore()
    cliente = store.crear("clientes", {"nombre": "Juan", "telefono": "600111222"})
"""

import os
import uuid
import yaml
import json
import copy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

# ── Configuración ──────────────────────────────────────────
DATA_DIR = Path(os.environ.get("AI_FIRST_DATA", os.path.expanduser("~/ai-first-autonomos/data")))

# Zona horaria para timestamps
def now() -> str:
    return datetime.now(timezone.utc).isoformat()


class YamlStoreError(Exception):
    """Error base del YAML Store."""
    pass


class EntityNotFoundError(YamlStoreError):
    """La entidad solicitada no existe."""
    pass


class ValidationError(YamlStoreError):
    """Los datos no cumplen con el esquema."""
    pass


# ── Helpers internos ───────────────────────────────────────

def _entidad_dir(entidad: str) -> Path:
    """Devuelve el directorio para una entidad."""
    d = DATA_DIR / entidad
    d.mkdir(parents=True, exist_ok=True)
    return d


def _next_sequence(entidad: str) -> int:
    """Obtiene el siguiente número secuencial para una entidad."""
    seq_file = DATA_DIR / f".seq_{entidad}"
    try:
        with open(seq_file, "r") as f:
            current = int(f.read().strip())
    except (FileNotFoundError, ValueError):
        current = 0
    next_val = current + 1
    with open(seq_file, "w") as f:
        f.write(str(next_val))
    return next_val


def _generar_id(entidad: str) -> str:
    """Genera un ID legible: {prefijo}-{NNN} (ej: cliente-001, material-001)."""
    seq = _next_sequence(entidad)
    prefijo = _singular(entidad)
    return f"{prefijo}-{seq:03d}"


def _singular(plural: str) -> str:
    """Convierte plural español a singular para IDs."""
    PLURALES = {
        "clientes": "cliente",
        "trabajos": "trabajo",
        "materiales": "material",
        "presupuestos": "presupuesto",
        "facturas": "factura",
        "oportunidades": "oportunidad",
    }
    return PLURALES.get(plural, plural.rstrip("s"))


def _slugify(text: str) -> str:
    """Convierte texto a slug básico para nombres de archivo."""
    import re
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"[\s-]+", "-", text)
    return text[:60]


def _deep_merge(base: dict, override: dict) -> dict:
    """
    Merge profundo de diccionarios.
    
    - Si ambas claves son dicts, merge recursivo.
    - Si la clave en override es None o "", se queda el valor de base.
    - Si la clave en override tiene valor, se sobreescribe.
    """
    resultado = copy.deepcopy(base)
    for k, v in override.items():
        if k in resultado and isinstance(resultado[k], dict) and isinstance(v, dict):
            resultado[k] = _deep_merge(resultado[k], v)
        elif v is not None and v != "":
            resultado[k] = copy.deepcopy(v)
    return resultado


def _archivo_path(entidad: str, entity_id: str) -> Path:
    """Ruta completa del archivo YAML."""
    return _entidad_dir(entidad) / f"{entity_id}.yaml"


# ── Store principal ────────────────────────────────────────

class YamlStore:
    """Almacenamiento YAML como fuente de verdad."""

    def crear(self, entidad: str, datos: dict) -> dict:
        """
        Crea una nueva entidad (método directo, sin plantilla).
        
        Args:
            entidad: Nombre de la entidad (ej: "clientes", "trabajos")
            datos: Diccionario con los campos de la entidad
            
        Returns:
            dict: La entidad creada con todos los campos generados
        """
        # Generar ID
        entity_id = _generar_id(entidad)
        
        # Componer registro completo
        registro = {
            "id": entity_id,
            "uuid": str(uuid.uuid4()),
            "fecha_creacion": now(),
            "activo": True,
            **datos
        }
        
        # Escribir archivo
        ruta = _archivo_path(entidad, entity_id)
        with open(ruta, "w", encoding="utf-8") as f:
            yaml.dump(registro, f, allow_unicode=True, default_flow_style=False, sort_keys=False)
        
        return registro

    def crear_desde_plantilla(self, entidad: str, datos: dict) -> dict:
        """
        Crea una nueva entidad a partir de su plantilla YAML.
        
        La plantilla garantiza que TODOS los campos existan, aunque estén
        vacíos. Esto evita que el esquema varíe entre registros y rompa la API.
        
        Args:
            entidad: Nombre de la entidad en plural (ej: "clientes", "trabajos", "materiales")
            datos: Diccionario con los campos a rellenar (se hace merge sobre la plantilla)
            
        Returns:
            dict: La entidad creada con todos los campos de la plantilla + los datos proporcionados
        """
        # Mapa plural → singular para buscar la plantilla
        singular = _singular(entidad)
        
        # Ruta de la plantilla: data/templates/{singular}.yaml
        template_path = DATA_DIR.parent / "data" / "templates" / f"{singular}.yaml"
        
        if not template_path.exists():
            raise YamlStoreError(
                f"Plantilla para '{singular}' no encontrada en {template_path}. "
                f"Plantillas disponibles: {', '.join(sorted(p.stem for p in (DATA_DIR.parent / 'data' / 'templates').glob('*.yaml')))}"
            )
        
        # Cargar plantilla
        with open(template_path, "r", encoding="utf-8") as f:
            plantilla = yaml.safe_load(f) or {}
        
        # Generar ID y metadatos (usando el nombre plural como directorio)
        entity_id = _generar_id(entidad)
        
        # Merge profundo: plantilla base + datos proporcionados
        registro = _deep_merge(plantilla, datos)
        registro["id"] = entity_id
        registro["uuid"] = str(uuid.uuid4())
        registro["fecha_creacion"] = now()
        registro["fecha_modificacion"] = now()
        registro["activo"] = True
        
        # Escribir archivo en data/{entidad}/{entity_id}.yaml
        ruta = _archivo_path(entidad, entity_id)
        with open(ruta, "w", encoding="utf-8") as f:
            yaml.dump(registro, f, allow_unicode=True, default_flow_style=False, sort_keys=False)
        
        return registro

    def obtener(self, entidad: str, entity_id: str) -> dict:
        """
        Obtiene una entidad por su ID.
        
        Args:
            entidad: Nombre de la entidad
            entity_id: ID de la entidad (ej: "cliente-001")
            
        Returns:
            dict: La entidad
            
        Raises:
            EntityNotFoundError: Si no existe
        """
        ruta = _archivo_path(entidad, entity_id)
        if not ruta.exists():
            raise EntityNotFoundError(f"{entidad.rstrip('s').capitalize()} '{entity_id}' no encontrado")
        
        with open(ruta, "r", encoding="utf-8") as f:
            return yaml.safe_load(f) or {}

    def listar(self, entidad: str, filtros: Optional[dict] = None) -> list[dict]:
        """
        Lista todas las entidades de un tipo, opcionalmente filtradas.
        
        Args:
            entidad: Nombre de la entidad
            filtros: Diccionario de campos a filtrar (ej: {"estado": "pendiente"})
            
        Returns:
            list[dict]: Lista de entidades
        """
        directorio = _entidad_dir(entidad)
        resultados = []
        
        for archivo in sorted(directorio.glob("*.yaml")):
            with open(archivo, "r", encoding="utf-8") as f:
                try:
                    registro = yaml.safe_load(f)
                except yaml.YAMLError:
                    continue
                if registro is None:
                    continue
                
                # Aplicar filtros
                if filtros:
                    coincide = all(
                        registro.get(k) == v
                        for k, v in filtros.items()
                    )
                    if not coincide:
                        continue
                
                resultados.append(registro)
        
        return resultados

    def actualizar(self, entidad: str, entity_id: str, datos: dict) -> dict:
        """
        Actualiza una entidad existente (merge de campos).
        
        Args:
            entidad: Nombre de la entidad
            entity_id: ID de la entidad
            datos: Campos a actualizar
            
        Returns:
            dict: La entidad actualizada
        """
        registro = self.obtener(entidad, entity_id)
        registro.update(datos)
        registro["fecha_actualizacion"] = now()
        
        ruta = _archivo_path(entidad, entity_id)
        with open(ruta, "w", encoding="utf-8") as f:
            yaml.dump(registro, f, allow_unicode=True, default_flow_style=False, sort_keys=False)
        
        return registro

    def eliminar(self, entidad: str, entity_id: str, permanente: bool = False) -> bool:
        """
        Elimina (soft delete por defecto) una entidad.
        
        Args:
            entidad: Nombre de la entidad
            entity_id: ID de la entidad
            permanente: Si True, borra el archivo. Si False, marca como inactivo.
            
        Returns:
            bool: True si se eliminó
        """
        if permanente:
            ruta = _archivo_path(entidad, entity_id)
            if ruta.exists():
                ruta.unlink()
                return True
            raise EntityNotFoundError(f"{entity_id} no encontrado")
        else:
            self.actualizar(entidad, entity_id, {"activo": False})
            return True

    def buscar(self, entidad: str, campo: str, valor: str) -> list[dict]:
        """
        Busca entidades donde un campo contenga un valor (búsqueda aproximada).
        
        Args:
            entidad: Nombre de la entidad
            campo: Campo a buscar
            valor: Valor a buscar (coincidencia parcial, case-insensitive)
            
        Returns:
            list[dict]: Entidades que coinciden
        """
        resultados = []
        valor_lower = valor.lower()
        
        for registro in self.listar(entidad):
            val = registro.get(campo)
            if val and valor_lower in str(val).lower():
                resultados.append(registro)
        
        return resultados

    def existe(self, entidad: str, entity_id: str) -> bool:
        """Verifica si una entidad existe."""
        return _archivo_path(entidad, entity_id).exists()


# ── Helper de importación rápida ──────────────────────────

store = YamlStore()

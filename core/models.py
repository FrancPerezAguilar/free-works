"""
models.py — Modelos Pydantic para validación de entidades.

Define los esquemas de datos para Cliente y Trabajo (módulo básico MVP).
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import date, datetime
import re


# ── Helpers ────────────────────────────────────────────────

def validar_telefono(v: str) -> str:
    """Validación básica de teléfono español."""
    limpio = re.sub(r"[\s\(\)\-]", "", v)
    if not re.match(r"^(\+34)?[6789]\d{8}$", limpio):
        raise ValueError("Formato de teléfono inválido. Debe ser un número español (9 dígitos, opcional +34)")
    return v


# ── Cliente ────────────────────────────────────────────────

class ClienteCreate(BaseModel):
    """Datos para crear un nuevo cliente."""
    nombre: str = Field(..., min_length=1, max_length=200, description="Nombre completo")
    telefono: str = Field(..., min_length=9, max_length=20, description="Teléfono principal")
    email: Optional[str] = Field(None, max_length=254, description="Email")
    direccion: Optional[str] = Field(None, description="Dirección completa")
    nif: Optional[str] = Field(None, max_length=15, description="NIF/CIF")
    notas: Optional[str] = Field(None, description="Notas internas")

    @field_validator("telefono")
    @classmethod
    def check_telefono(cls, v):
        return validar_telefono(v)


class Cliente(ClienteCreate):
    """Cliente completo (con campos del sistema)."""
    id: str
    uuid: str
    fecha_creacion: str
    activo: bool = True
    fecha_actualizacion: Optional[str] = None


# ── Trabajo ────────────────────────────────────────────────

class ChecklistItem(BaseModel):
    """Una tarea dentro del checklist del trabajo."""
    id: str = ""
    descripcion: str
    completada: bool = False
    fecha_completada: Optional[str] = None


class RegistroHoras(BaseModel):
    """Registro de horas trabajadas en un día."""
    fecha: date
    horas: float = Field(..., gt=0, le=24)
    descripcion: Optional[str] = None


class MaterialUsado(BaseModel):
    """Material consumido en el trabajo."""
    nombre: str
    cantidad: float = Field(..., gt=0)
    unidad: str = "ud"
    precio: Optional[float] = None


class FotoTrabajo(BaseModel):
    """Foto o evidencia del trabajo."""
    url: str
    descripcion: Optional[str] = None
    fecha: Optional[str] = None


class TrabajoCreate(BaseModel):
    """Datos para crear un nuevo trabajo."""
    cliente_id: str = Field(..., description="ID del cliente (ej: cliente-001)")
    titulo: str = Field(..., min_length=1, max_length=200, description="Título del trabajo")
    descripcion: Optional[str] = Field(None, description="Descripción detallada")
    direccion_obra: Optional[str] = Field(None, description="Dirección donde se realiza")
    estado: str = Field("pendiente", description="Estado del trabajo")


class Trabajo(TrabajoCreate):
    """Trabajo completo (con campos del sistema)."""
    id: str
    uuid: str
    codigo: str
    fecha_creacion: str
    activo: bool = True
    fecha_actualizacion: Optional[str] = None
    fecha_inicio: Optional[str] = None
    fecha_fin: Optional[str] = None
    checklist: list = []
    horas: list = []
    materiales: list = []
    fotos: list = []

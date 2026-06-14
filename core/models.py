"""
models.py — Modelos Pydantic para Free Works.

Define los esquemas de datos para todas las entidades del sistema.
Versión adaptada para la arquitectura Free Works + Holded.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import date, datetime
import re


# ── Helpers ────────────────────────────────────────────────

def validar_telefono(v: str) -> str:
    limpio = re.sub(r"[\s\(\)\-]", "", v)
    if not re.match(r"^(\+34)?[6789]\d{8}$", limpio):
        raise ValueError("Teléfono inválido. Debe ser un número español (9 dígitos, opcional +34)")
    return v


# ── Técnico ────────────────────────────────────────────────

class TecnicoCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=200)
    telefono: Optional[str] = None
    email: Optional[str] = None
    especialidad: Optional[str] = None


class Tecnico(TecnicoCreate):
    id: str
    activo: bool = True
    fecha_alta: str


# ── Cliente (sincronizado con Holded) ─────────────────────

class ClienteCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=200)
    telefono: str = Field(..., min_length=9, max_length=20)
    email: Optional[str] = Field(None, max_length=254)
    direccion: Optional[str] = None
    nif: Optional[str] = Field(None, max_length=15)
    holded_id: Optional[str] = Field(None, description="ID en Holded (para sincronización)")

    @field_validator("telefono")
    @classmethod
    def check_telefono(cls, v):
        return validar_telefono(v)


class Cliente(ClienteCreate):
    id: str
    uuid: str
    fecha_creacion: str
    activo: bool = True
    fecha_actualizacion: Optional[str] = None


# ── Trabajo (core) ────────────────────────────────────────

class TecnicoAsignado(BaseModel):
    """Técnico asignado a un trabajo con sus horas."""
    tecnico_id: str
    nombre: str
    horas: float = Field(default=0, ge=0)


class ChecklistItem(BaseModel):
    id: str = ""
    descripcion: str
    completada: bool = False
    completada_por: Optional[str] = None
    fecha_completada: Optional[str] = None


class RegistroHoras(BaseModel):
    """Registro de horas de un técnico en un trabajo."""
    tecnico_id: str = Field(..., description="ID del técnico")
    nombre: str = Field(..., description="Nombre del técnico")
    fecha: date
    horas: float = Field(..., gt=0, le=24)
    descripcion: Optional[str] = None


class MaterialUsado(BaseModel):
    nombre: str
    cantidad: float = Field(..., gt=0)
    unidad: str = "ud"
    precio: Optional[float] = None
    holded_id: Optional[str] = Field(None, description="ID del producto en Holded")


class Adjunto(BaseModel):
    tipo: str = Field(..., pattern=r"^(foto|pdf|audio|documento)$")
    nombre: str
    ruta: str
    descripcion: Optional[str] = None
    fecha: Optional[str] = None
    subido_por: Optional[str] = None


class Comentario(BaseModel):
    autor: str
    texto: str
    fecha: str
    adjuntos: list[Adjunto] = []


class TrabajoCreate(BaseModel):
    cliente_id: str = Field(..., description="ID del cliente")
    cliente_nombre: str = Field(..., description="Nombre del cliente (para display rápido)")
    holded_cliente_id: Optional[str] = Field(None, description="ID del cliente en Holded")
    titulo: str = Field(..., min_length=1, max_length=200)
    descripcion: Optional[str] = None
    direccion_obra: Optional[str] = None
    estado: str = Field("pendiente", pattern=r"^(pendiente|en_curso|completado|cancelado)$")
    prioridad: str = Field("media", pattern=r"^(baja|media|alta|urgente)$")


class Trabajo(TrabajoCreate):
    id: str
    uuid: str
    codigo: str
    fecha_creacion: str
    activo: bool = True
    fecha_actualizacion: Optional[str] = None
    fecha_inicio: Optional[str] = None
    fecha_fin: Optional[str] = None
    tecnicos_asignados: list[TecnicoAsignado] = []
    checklist: list[ChecklistItem] = []
    horas: list[RegistroHoras] = []
    materiales: list[MaterialUsado] = []
    adjuntos: list[Adjunto] = []
    comentarios: list[Comentario] = []

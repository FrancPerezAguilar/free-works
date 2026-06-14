"""Free Works Core — Lógica de negocio y modelos."""

from .yaml_store import YamlStore
from .models import (
    Tecnico, TecnicoCreate,
    Cliente, ClienteCreate,
    Trabajo, TrabajoCreate,
    ChecklistItem, TecnicoAsignado,
    RegistroHoras, MaterialUsado,
    Adjunto, Comentario,
)

store = YamlStore()

__all__ = [
    "store",
    "Tecnico", "TecnicoCreate",
    "Cliente", "ClienteCreate",
    "Trabajo", "TrabajoCreate",
    "ChecklistItem", "TecnicoAsignado",
    "RegistroHoras", "MaterialUsado",
    "Adjunto", "Comentario",
]

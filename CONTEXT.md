# Free Works — Contexto para IA

## Qué es
Free Works es un gestor de trabajos con IA para autónomos técnicos.
Se conecta a Holded (ERP) para facturación, contabilidad y Verifactu.

## Stack
- Frontend: React + TypeScript + Vite (en web/)
- Backend: Python FastAPI + PostgreSQL (en db/)
- Datos locales: YAML (core/yaml_store.py)
- ERP externo: Holded vía MCP (@energio/holded-mcp)
- IA: Hermes Agent + DeepSeek V4 + MiniMax M3

## Estructura del repo
- core/ — Modelos Pydantic + YAML store
- web/ — Frontend React (trabajos, clientes, etc.)
- db/ — API server + migraciones PostgreSQL
- sync/holded/ — Capa de sincronización con Holded
- mcp/ — Configuración MCP de Holded
- tecnicos/ — Módulo de técnicos (pendiente de implementar)
- adjuntos/ — Módulo de archivos multimedia (pendiente)
- archive/ — Código legacy del antiguo ERP

## Estado actual
- Fase 1 (Core trabajos): ✅ CRUD, checklist, horas, materiales, estados
- Fase 2 (Conector Holded): ⏳ Pendiente API key
- Fase 3-5: No iniciadas

## Pendiente inmediato
- Configurar MCP Holded (necesita API key)
- Probar flujo completo: trabajo → presupuesto → factura

## Enlaces
- Repo: https://github.com/FrancPerezAguilar/free-works
- Arquitectura: ARQUITECTURA.md
- Auditoría Holded MCP: /home/ai/HOLDED_MCP_SECURITY_AUDIT.md

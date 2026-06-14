# Holded MCP Connector — Free Works

## Configuración

### 1. API Key

Generar en Holded → Ajustes → Desarrolladores → Credenciales → Add API Token

```bash
export HOLDED_API_KEY="tu-api-key-aqui"
```

### 2. Configurar MCP en Hermes

```yaml
# ~/.hermes/config.yaml o perfiles/free-works/config.yaml
mcp_servers:
  holded:
    command: npx
    args: ["-y", "@energio/holded-mcp"]
    env:
      HOLDED_API_KEY: "${HOLDED_API_KEY}"
      HOLDED_MODULES: "invoicing,accounting"
      HOLDED_DEBUG: "false"
```

O mediante CLI:

```bash
hermes mcp add holded \
  --command "npx -y @energio/holded-mcp" \
  --env "HOLDED_API_KEY=..." \
  --env "HOLDED_MODULES=invoicing,accounting"
```

### 3. Módulos activos

| Módulo | Tools | Uso en Free Works |
|--------|-------|-------------------|
| `invoicing` | Documentos, Contactos, Productos, Pagos, Tesorería | Clientes, facturas, presupuestos, materiales |
| `accounting` | Cuentas, Diario | Conciliación, consulta contable |

### 4. Sincronización

| Dato | Dirección | Frecuencia |
|------|-----------|------------|
| Clientes | Holded → Free Works | Al crear trabajo, pull |
| Productos/Materiales | Holded → Free Works | Pull catálogo diario |
| Presupuestos | Free Works → Holded | Push al crear |
| Facturas | Free Works → Holded | Push al facturar |
| Pagos | Holded → Free Works | Pull consulta |

### 5. Seguridad (ver auditoría en /home/ai/HOLDED_MCP_SECURITY_AUDIT.md)

- ✅ API key dedicada solo para Hermes
- ✅ Módulos limitados a invoicing, accounting
- ✅ Confirmación humana para: delete, pay, send, attach
- ✅ Sin exposición de red (stdio local)
- ❌ NO cargar PDFs de origen no confiable en contexto del agente

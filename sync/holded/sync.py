"""Free Works → Holded sync layer

Synchronizes data between Free Works local store and Holded via MCP.
Uses @energio/holded-mcp tools through the MCP client.

Typical flow:
  1. User creates a job with client name
  2. Sync layer looks up client in Holded by name
  3. If found, links holded_id to the job
  4. If not found, creates client in Holded first
  5. When job is completed → push invoice to Holded

Tools available (via MCP):
  - holded_invoicing_list_contacts / get_contact / create_contact
  - holded_invoicing_list_products / get_product
  - holded_invoicing_create_document (invoice, estimate, etc.)
  - holded_invoicing_get_document / pay_document / send_document
  - holded_invoicing_list_treasuries / get_treasury
  - holded_accounting_list_accounts / create_entry
"""

from typing import Optional, Any

# Placeholder: MCP client integration will use Hermes delegate_task
# or direct MCP call when Hermes supports it

class HoldedSync:
    """Sync layer between Free Works and Holded"""

    def __init__(self, mcp_client=None):
        self.mcp = mcp_client

    async def find_client(self, name: str, phone: str = "") -> Optional[dict]:
        """Find a client in Holded by name or phone"""
        # TODO: MCP call → holded_invoicing_list_contacts
        return None

    async def sync_client(self, client_data: dict) -> str:
        """Sync client to Holded, return holded_id"""
        # TODO: create or update client in Holded
        return ""

    async def sync_product(self, product_data: dict) -> str:
        """Sync product/material to Holded catalog, return holded_id"""
        return ""

    async def create_estimate(self, job_data: dict) -> str:
        """Create estimate in Holded from a job, return doc_id"""
        return ""

    async def create_invoice(self, job_data: dict) -> str:
        """Create invoice in Holded from a completed job"""
        return ""

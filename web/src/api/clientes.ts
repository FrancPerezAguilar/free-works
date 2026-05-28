import { api } from "./client";
import type { Cliente, ClienteCreate, ClienteUpdate } from "../types/cliente";

export function getClientes(activo = true): Promise<Cliente[]> {
  return api.get(`clientes?activo=${activo}`);
}

export function getCliente(id: number): Promise<Cliente> {
  return api.get(`clientes/${id}`);
}

export function createCliente(data: ClienteCreate): Promise<{ id: number }> {
  return api.post("clientes", data);
}

export function updateCliente(id: number, data: ClienteUpdate): Promise<{ mensaje: string }> {
  return api.patch(`clientes/${id}`, data);
}

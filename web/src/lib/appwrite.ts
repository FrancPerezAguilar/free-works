/**
 * Cliente Appwrite compartido por toda la aplicación.
 *
 * Inicializa el `Client` con endpoint + project + API key del servidor.
 * Exporta las instancias singleton de `Databases`, `Account` y `Storage`
 * listas para usar desde los módulos de `web/src/api/*`.
 *
 * Importante: la `apiKey` concede permisos elevados. En producción real
 * debería moverse a una Cloud Function y el navegador solo usaría sesión
 * de usuario (account.createEmailSession / account.createAnonymousSession).
 * Aquí lo dejamos así para acelerar el desarrollo.
 */

import { Client, Databases, Account, Storage } from "appwrite";
import { APPWRITE_CONFIG } from "../config";

export const client = new Client()
  .setEndpoint(APPWRITE_CONFIG.endpoint)
  .setProject(APPWRITE_CONFIG.projectId)
  .setDevKey(APPWRITE_CONFIG.apiKey);

export const databases = new Databases(client);
export const account = new Account(client);
export const storage = new Storage(client);

export { APPWRITE_CONFIG };
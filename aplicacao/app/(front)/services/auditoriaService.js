import { apiFetch } from "./api";

// GET auditoria (somente leitura)
export function getAuditoria() {
  return apiFetch("/api/auditoria");
}

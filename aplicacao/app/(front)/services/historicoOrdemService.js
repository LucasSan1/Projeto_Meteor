import { apiFetch } from "./api";

// GET histórico de ordens (somente leitura)
export function getHistoricoOrdens() {
  return apiFetch("/api/historicoOrdens");
}

import { apiFetch } from "./api";

// GET materiais das ordens (somente leitura)
export function getOrdemMateriais() {
  return apiFetch("/api/ordemMateriais");
}

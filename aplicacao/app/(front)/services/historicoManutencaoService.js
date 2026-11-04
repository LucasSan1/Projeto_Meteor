import { apiFetch } from "./api";

// GET histórico de manutenções (somente leitura)
export function getHistoricoManutencao() {
  return apiFetch("/api/historicoManutencao");
}

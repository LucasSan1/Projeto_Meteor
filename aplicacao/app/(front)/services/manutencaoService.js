import { apiFetch } from "./api";

// GET manutenções
export function getManutencoes() {
  return apiFetch("/api/manutencoesProgramadas");
}

// POST manutenção
export function createManutencao(data) {
  return apiFetch("/api/manutencoesProgramadas", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// PATCH manutenção (dados planejados)
export function updateManutencao(id, data) {
  return apiFetch(`/api/manutencoesProgramadas/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// PUT status
export function updateStatusManutencao(id, data) {
  return apiFetch(`/api/manutencoesProgramadas/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// DELETE (cancelar)
export function cancelarManutencao(id) {
  return apiFetch(`/api/manutencoesProgramadas/${id}`, {
    method: "DELETE",
  });
}

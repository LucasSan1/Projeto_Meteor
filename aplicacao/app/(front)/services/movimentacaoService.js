import { apiFetch } from "./api";

// GET movimentações
export function getMovimentacoes() {
  return apiFetch("/api/movimentacoesEstoque");
}

// POST movimentação
export function createMovimentacao(data) {
  return apiFetch("/api/movimentacoesEstoque", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// PATCH movimentação
export function updateMovimentacao(id, data) {
  return apiFetch(`/api/movimentacoesEstoque/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// DELETE movimentação
export function deleteMovimentacao(id) {
  return apiFetch(`/api/movimentacoesEstoque/${id}`, {
    method: "DELETE",
  });
}

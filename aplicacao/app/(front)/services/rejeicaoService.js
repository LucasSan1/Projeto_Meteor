import { apiFetch } from "./api";

// GET rejeições
export function getRejeicoes() {
  return apiFetch("/api/rejeicoes");
}

// POST rejeição
export function createRejeicao(data) {
  return apiFetch("/api/rejeicoes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// PATCH rejeição
export function updateRejeicao(id, data) {
  return apiFetch(`/api/rejeicoes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// DELETE rejeição
export function deleteRejeicao(id) {
  return apiFetch(`/api/rejeicoes/${id}`, {
    method: "DELETE",
  });
}

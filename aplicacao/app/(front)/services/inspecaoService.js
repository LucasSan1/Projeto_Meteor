import { apiFetch } from "./api";

// GET inspeções
export function getInspecoes() {
  return apiFetch("/api/inspecoes");
}

// POST inspeção
export function createInspecao(data) {
  return apiFetch("/api/inspecoes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// PATCH inspeção
export function updateInspecao(id, data) {
  return apiFetch(`/api/inspecoes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// DELETE inspeção
export function deleteInspecao(id) {
  return apiFetch(`/api/inspecoes/${id}`, {
    method: "DELETE",
  });
}

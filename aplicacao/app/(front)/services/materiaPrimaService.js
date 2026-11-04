import { apiFetch } from "./api";

// GET matérias-primas
export function getMateriasPrimas() {
  return apiFetch("/api/materiaPrima");
}

// POST matéria-prima
export function createMateriaPrima(data) {
  return apiFetch("/api/materiaPrima", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// PATCH matéria-prima
export function updateMateriaPrima(id, data) {
  return apiFetch(`/api/materiaPrima/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// DELETE (desativar)
export function deleteMateriaPrima(id) {
  return apiFetch(`/api/materiaPrima/${id}`, {
    method: "DELETE",
  });
}

// ATIVAR matéria-prima
export function activateMateriaPrima(id) {
  return apiFetch(`/api/materiaPrima/${id}`, {
    method: "PUT",
  });
}

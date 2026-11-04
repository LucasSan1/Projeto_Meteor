import { apiFetch } from "./api";

// GET profissionais
export function getProfissionais() {
  return apiFetch("/api/profissionais");
}

// POST profissional
export function createProfissional(data) {
  return apiFetch("/api/profissionais", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// PATCH profissional
export function updateProfissional(id, data) {
  return apiFetch(`/api/profissionais/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// DELETE (desativar)
export function deleteProfissional(id) {
  return apiFetch(`/api/profissionais/${id}`, {
    method: "DELETE",
  });
}

// ATIVAR profissional
export function activateProfissional(id) {
  return apiFetch(`/api/profissionais/${id}`, {
    method: "PUT",
  });
}

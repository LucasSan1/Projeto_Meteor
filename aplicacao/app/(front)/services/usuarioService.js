import { apiFetch } from "./api";

// GET usuários
export function getUsuarios() {
  return apiFetch("/api/usuarios");
}

// POST usuário
export function createUsuario(data) {
  return apiFetch("/api/usuarios", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// PATCH usuário
export function updateUsuario(id, data) {
  return apiFetch(`/api/usuarios/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// DELETE (desativar)
export function deleteUsuario(id) {
  return apiFetch(`/api/usuarios/${id}`, {
    method: "DELETE",
  });
}

// ATIVAR usuário
export function activateUsuario(id) {
  return apiFetch(`/api/usuarios/${id}`, {
    method: "PUT",
  });
}

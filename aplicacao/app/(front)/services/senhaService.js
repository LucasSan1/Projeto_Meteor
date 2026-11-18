import { apiFetch } from "./api";

// Pede o código de recuperação pro email informado
export function esqueciSenhaService(data) {
  return apiFetch("/api/auth/esqueciSenha", {
    method: "POST",
    body: JSON.stringify(data),
    skipAuth: true,
  });
}

export function redefinirSenhaService(data) {
  return apiFetch("/api/auth/redefinirSenha", {
    method: "PUT",
    body: JSON.stringify(data),
    skipAuth: true,
  });
}

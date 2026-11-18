// Utilidades de sessão do lado do navegador

export function limparSessao() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("token");
  localStorage.removeItem("cargo");
  localStorage.removeItem("usuario");
  localStorage.removeItem("primeiroAcesso");
}

export function tokenExpirado(token) {
  if (!token) return true;

  try {
    const partes = token.split(".");

    // JWT tem três pedaços, qualquer coisa diferente disso já é suspeita
    if (partes.length !== 3) return true;

    const base64 = partes[1].replace(/-/g, "+").replace(/_/g, "/");
    const comPadding = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );

    const payload = JSON.parse(atob(comPadding));

    // Sem exp não dá pra confiar, com exp vencido, tchau
    if (!payload.exp) return true;

    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

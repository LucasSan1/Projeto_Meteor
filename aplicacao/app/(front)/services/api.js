import Swal from "sweetalert2";

export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem("token");

  const skipAuth = options.skipAuth || false;

  try {
    const response = await fetch(url, {
      ...options,

      headers: {
        "Content-Type": "application/json",

        ...(token &&
          !skipAuth && {
            Authorization: `Bearer ${token}`,
          }),

        ...(options.headers || {}),
      },
    });

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (response.status === 401) {
      if (skipAuth) {
        await Swal.fire({
          icon: "warning",
          title: "Credenciais inválidas",
          text: data?.message || "Usuário ou senha incorretos.",
        });

        return null;
      }

      await Swal.fire({
        icon: "warning",
        title: "Sessão expirada",
        text: data?.message || "Faça login novamente.",
      });

      localStorage.removeItem("token");
      localStorage.removeItem("cargo");

      window.location.href = "/login";

      return null;
    }

    if (response.status === 403) {
      await Swal.fire({
        icon: "error",
        title: "Acesso negado",
        text: data?.message || "Você não tem permissão para esta ação.",
      });

      return null;
    }

    if (!response.ok) {
      await Swal.fire({
        icon: "error",
        title: "Erro",
        text: data?.message || "Erro inesperado no servidor.",
      });

      return null;
    }

    return data;
  } catch (err) {
    console.error("Erro API:", err);

    await Swal.fire({
      icon: "error",
      title: "Erro de conexão",
      text: "Não foi possível conectar ao servidor.",
    });

    return null;
  }
}

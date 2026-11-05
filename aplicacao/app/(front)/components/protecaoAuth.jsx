"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

// Rotas que não exigem login (se proteger a própria /login vira loop de redirect)
const ROTAS_PUBLICAS = ["/login"];

// O gestor manda em tudo, operador e mecânico só têm o que precisam pro trabalho
const ROTAS_POR_CARGO = {
  gerente: [
    "/",
    "/usuarios",
    "/profissionais",
    "/operadores",
    "/fornecedores",
    "/materiasPrimas",
    "/pecas",
    "/equipamentos",
    "/maquinas",
    "/ordemServico",
    "/ordemMateriais",
    "/inspecoes",
    "/rejeicoes",
    "/movimentacoesEstoque",
    "/manutencoesProgramadas",
    "/historicoManutencao",
    "/historicoOrdens",
    "/auditoria",
    "/trocarSenha",
  ],
  operador: ["/ordemServico", "/trocarSenha"],
  mecanico: ["/manutencoesProgramadas", "/trocarSenha"],
};

// Pra onde cada perfil vai quando tenta abrir uma tela que não é dele
const HOME_POR_CARGO = {
  gerente: "/",
  operador: "/ordemServico",
  mecanico: "/manutencoesProgramadas",
};

// Remove barra sobrando pra comparar direitinho
function normalizarRota(pathname) {
  if (!pathname) return "/";

  const semBarra = pathname.replace(/\/+$/, "");

  return semBarra || "/";
}

export default function ProtecaoAuth({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const rota = normalizarRota(pathname);

  const rotaPublica = ROTAS_PUBLICAS.includes(rota);

  // Começa "checando" de propósito: o server e o primeiro render do client
  // mostram a mesma coisa, então não tem mismatch de hidratação
  const [liberado, setLiberado] = useState(false);

  useEffect(() => {
    // Página pública passa direto, sem olhar token
    if (rotaPublica) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLiberado(true);
      return;
    }

    const token = localStorage.getItem("token");
    const cargo = localStorage.getItem("cargo");

    // Sem token na caixa = visita não autenticada, manda pro login
    if (!token || !cargo) {
      localStorage.removeItem("token");
      localStorage.removeItem("cargo");
      localStorage.removeItem("usuario");

      setLiberado(false);
      router.replace("/login");
      return;
    }

    const rotasPermitidas = ROTAS_POR_CARGO[cargo];

    // Cargo estranho também não passa
    if (!rotasPermitidas) {
      localStorage.removeItem("token");
      localStorage.removeItem("cargo");
      localStorage.removeItem("usuario");

      setLiberado(false);
      router.replace("/login");
      return;
    }

    // Tentou abrir tela de outro perfil? Volta pra casa do próprio perfil
    if (!rotasPermitidas.includes(rota)) {
      setLiberado(false);
      router.replace(HOME_POR_CARGO[cargo]);
      return;
    }

    setLiberado(true);
  }, [rota, rotaPublica, router]);

  // Login não precisa esperar nada
  if (rotaPublica) return children;

  // Enquanto confere o token, segura a página pra não sair disparando API sem auth
  if (!liberado) {
    return <p className="p-6 text-black">Verificando autenticação...</p>;
  }

  return children;
}

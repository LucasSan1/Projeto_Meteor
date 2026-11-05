"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

// Rotas que não exigem login (se proteger a própria /login vira loop de redirect)
const ROTAS_PUBLICAS = ["/login"];

export default function ProtecaoAuth({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const rotaPublica = ROTAS_PUBLICAS.includes(pathname);

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

    // Sem token na caixa = visita não autenticada, manda pro login
    if (!localStorage.getItem("token")) {
      setLiberado(false);
      router.replace("/login");
      return;
    }

    setLiberado(true);
  }, [pathname, rotaPublica, router]);

  // Login não precisa esperar nada
  if (rotaPublica) return children;

  // Enquanto confere o token, segura a página pra não sair disparando API sem auth
  if (!liberado) {
    return <p className="p-6 text-black">Verificando autenticação...</p>;
  }

  return children;
}

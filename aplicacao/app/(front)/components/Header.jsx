"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import HamburgerMenu from "./HamburguerMenu";
import { CosmoMarca } from "./marca";
import { limparSessao } from "../../utils/sessao";

export default function Header() {
  const [usuario, setUsuario] = useState("");

  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("usuario");

    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsuario(user);
    }
  }, []);

  function logout() {
    limparSessao();

    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-40 w-full h-14 bg-white border-b border-[#334E7F]/10 shadow-sm">
      <div className="w-full h-full flex justify-between items-center px-4 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <HamburgerMenu />

          <Link href="/" className="flex items-center min-w-0">
            <CosmoMarca size={26} />
          </Link>
        </div>

        <div className="flex items-center gap-3 min-w-0">
          <span className="hidden sm:block text-sm text-[#697385] truncate">
            Usuário:{" "}
            <span className="text-[#11284F] font-semibold">
              {usuario || "não identificado"}
            </span>
          </span>

          <Link
            href="/trocarSenha"
            className="text-[#4A48A8] hover:text-[#3d3b8f] text-sm font-semibold transition-colors flex-shrink-0"
          >
            Trocar senha
          </Link>

          <button
            onClick={logout}
            className="bg-[#4A48A8] hover:bg-[#3d3b8f] text-white px-3 py-1.5 rounded text-sm font-bold transition-colors flex-shrink-0"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}

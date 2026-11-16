"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ICONES_POR_ROTA, IconeMenu, IconeX } from "./icones";
import { CosmoMarca } from "./marca";

// Cada perfil vê só o que faz sentido pro trabalho dele
// O gestor manda em tudo, operador e mecânico ficam no essencial
const MENUS_POR_CARGO = {
  gerente: [
    {
      itens: [{ href: "/", label: "Home" }],
    },
    {
      secao: "Pessoas",
      itens: [
        { href: "/usuarios", label: "Usuários" },
        { href: "/profissionais", label: "Profissionais" },
      ],
    },
    {
      secao: "Cadastros",
      itens: [
        { href: "/fornecedores", label: "Fornecedores" },
        { href: "/materiasPrimas", label: "Matérias-primas" },
        { href: "/pecas", label: "Peças" },
        { href: "/equipamentos", label: "Equipamentos" },
        { href: "/maquinas", label: "Máquinas" },
      ],
    },
    {
      secao: "Produção",
      itens: [
        { href: "/ordemServico", label: "Ordens de Produção" },
        { href: "/inspecoes", label: "Inspeções" },
        { href: "/rejeicoes", label: "Rejeições" },
      ],
    },
    {
      secao: "Manutenção",
      itens: [
        { href: "/manutencoesProgramadas", label: "Manutenções" },
      ],
    },
    {
      secao: "Consultas",
      itens: [
        { href: "/movimentacoesEstoque", label: "Movimentações de Estoque" },
        { href: "/ordemMateriais", label: "Materiais por Ordem" },
        { href: "/historicoOrdens", label: "Histórico de Ordens" },
        { href: "/historicoManutencao", label: "Histórico de Manutenção" },
        { href: "/auditoria", label: "Auditoria" },
      ],
    },
  ],
  operador: [
    {
      itens: [{ href: "/ordemServico", label: "Ordens de Produção" }],
    },
  ],
  mecanico: [
    {
      itens: [{ href: "/manutencoesProgramadas", label: "Manutenções" }],
    },
  ],
};

const CARGO_LABEL = {
  gerente: "Gestor",
  operador: "Operador",
  mecanico: "Mecânico",
};

export default function HamburguerMenu() {
  const [open, setOpen] = useState(false);

  const pathname = usePathname();

  // localStorage só existe no client. Ler direto na inicialização do componente evita que o menu "pisque" ao abrir a página
  const [cargo] = useState(() =>
    typeof window === "undefined" ? null : localStorage.getItem("cargo"),
  );

  const [usuario] = useState(() =>
    typeof window === "undefined" ? "" : localStorage.getItem("usuario") || "",
  );

  const toggleMenu = () => {
    setOpen(!open);
  };

  const menu = MENUS_POR_CARGO[cargo] || [];

  return (
    <>
      <button
        onClick={toggleMenu}
        aria-label="Abrir menu"
        className="text-[#334E7F]/70 hover:text-[#334E7F] transition-colors p-1"
      >
        <IconeMenu size={22} />
      </button>

      {/* MENU LATERAL */}
      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-30"
            onClick={toggleMenu}
          />

          <aside
            className="
              fixed
              top-0
              left-0
              h-full
              w-64
              bg-[#11284F]
              shadow-2xl
              z-40
              flex
              flex-col
            "
          >
            <div className="h-14 flex items-center px-4 gap-3 bg-white flex-shrink-0">
              <button
                onClick={toggleMenu}
                aria-label="Fechar menu"
                className="text-[#334E7F]/60 hover:text-[#334E7F] transition-colors"
              >
                <IconeX size={18} />
              </button>

              <CosmoMarca size={24} legenda />
            </div>

            <nav className="flex-1 py-2 overflow-y-auto">
              {menu.map((grupo, index) => (
                <div key={grupo.secao || `grupo-${index}`} className="py-1">
                  {grupo.secao && (
                    <p className="px-5 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                      {grupo.secao}
                    </p>
                  )}

                  {grupo.itens.map((item) => {
                    const Icone = ICONES_POR_ROTA[item.href] || IconeMenu;

                    const ativo =
                      item.href === "/"
                        ? pathname === "/"
                        : pathname?.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={toggleMenu}
                        className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors text-left ${
                          ativo
                            ? "bg-white/10 text-white border-r-2 border-[#4A48A8]"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <Icone size={17} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>

            <div className="px-5 py-4 border-t border-white/10">
              <p className="text-[11px] font-medium uppercase tracking-wider text-white/40">
                {CARGO_LABEL[cargo] || "Perfil"}
              </p>
              <p className="text-sm font-semibold text-white truncate">
                {usuario || "Usuário"}
              </p>
            </div>
          </aside>
        </>
      )}
    </>
  );
}

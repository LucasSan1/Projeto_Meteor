"use client";

import { useState } from "react";
import Link from "next/link";

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
        { href: "/ordemMateriais", label: "Materiais por Ordem" },
        { href: "/inspecoes", label: "Inspeções" },
        { href: "/rejeicoes", label: "Rejeições" },
        { href: "/movimentacoesEstoque", label: "Movimentações de Estoque" },
      ],
    },
    {
      secao: "Manutenção",
      itens: [
        { href: "/manutencoesProgramadas", label: "Manutenções" },
        { href: "/historicoManutencao", label: "Histórico de Manutenção" },
      ],
    },
    {
      secao: "Consultas",
      itens: [
        { href: "/historicoOrdens", label: "Histórico de Ordens" },
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

export default function HamburguerMenu() {
  const [open, setOpen] = useState(false);

  // localStorage só existe no client. Ler direto na inicialização do componente evita que o menu "pisque" ao abrir a página
  const [cargo] = useState(() =>
    typeof window === "undefined" ? null : localStorage.getItem("cargo"),
  );

  const toggleMenu = () => {
    setOpen(!open);
  };

  const menu = MENUS_POR_CARGO[cargo] || [];

  return (
    <>
      <button
        onClick={toggleMenu}
        className="
          flex
          flex-col
          justify-center
          items-center
          w-10
          h-10
          gap-1
          hover:bg-white/10
          rounded-md
          transition
        "
      >
        <span className="w-6 h-0.5 bg-white"></span>
        <span className="w-6 h-0.5 bg-white"></span>
        <span className="w-6 h-0.5 bg-white"></span>
      </button>

      {/* MENU LATERAL */}
      {open && (
        <div
          className="
          fixed
          top-0
          left-0
          h-full
          w-64
          bg-[#3E2723]
          shadow-lg
          z-50
          p-6
          flex
          flex-col
          gap-4
          overflow-y-auto
        "
        >
          <button
            onClick={toggleMenu}
            className="text-white text-sm mb-4 self-end"
          >
            ✕
          </button>

          {menu.map((grupo, index) => (
            <div key={grupo.secao || `grupo-${index}`} className="flex flex-col gap-3">
              {grupo.secao && (
                <span className="text-xs uppercase tracking-wide text-[#C69214] mt-2">
                  {grupo.secao}
                </span>
              )}

              {grupo.itens.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-white hover:text-[#C69214] transition"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

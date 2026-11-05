"use client";

import { useState } from "react";
import Link from "next/link";

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);

  const toggleMenu = () => {
    setOpen(!open);
  };

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

          {/* LINKS */}

          <Link href="/" className="text-white hover:text-[#C69214] transition">
            Home
          </Link>

          <span className="text-xs uppercase tracking-wide text-[#C69214] mt-2">
            Pessoas
          </span>

          <Link
            href="/usuarios"
            className="text-white hover:text-[#C69214] transition"
          >
            Usuários
          </Link>

          <Link
            href="/profissionais"
            className="text-white hover:text-[#C69214] transition"
          >
            Profissionais
          </Link>

          <span className="text-xs uppercase tracking-wide text-[#C69214] mt-2">
            Cadastros
          </span>

          <Link
            href="/fornecedores"
            className="text-white hover:text-[#C69214] transition"
          >
            Fornecedores
          </Link>

          <Link
            href="/materiasPrimas"
            className="text-white hover:text-[#C69214] transition"
          >
            Matérias-primas
          </Link>

          <Link
            href="/pecas"
            className="text-white hover:text-[#C69214] transition"
          >
            Peças
          </Link>

          <Link
            href="/equipamentos"
            className="text-white hover:text-[#C69214] transition"
          >
            Equipamentos
          </Link>

          <Link
            href="/maquinas"
            className="text-white hover:text-[#C69214] transition"
          >
            Máquinas
          </Link>

          <span className="text-xs uppercase tracking-wide text-[#C69214] mt-2">
            Produção
          </span>

          <Link
            href="/ordemServico"
            className="text-white hover:text-[#C69214] transition"
          >
            Ordens de Produção
          </Link>

          <Link
            href="/ordemMateriais"
            className="text-white hover:text-[#C69214] transition"
          >
            Materiais por Ordem
          </Link>

          <Link
            href="/inspecoes"
            className="text-white hover:text-[#C69214] transition"
          >
            Inspeções
          </Link>

          <Link
            href="/rejeicoes"
            className="text-white hover:text-[#C69214] transition"
          >
            Rejeições
          </Link>

          <Link
            href="/movimentacoesEstoque"
            className="text-white hover:text-[#C69214] transition"
          >
            Movimentações de Estoque
          </Link>

          <span className="text-xs uppercase tracking-wide text-[#C69214] mt-2">
            Manutenção
          </span>

          <Link
            href="/manutencoesProgramadas"
            className="text-white hover:text-[#C69214] transition"
          >
            Manutenções
          </Link>

          <Link
            href="/historicoManutencao"
            className="text-white hover:text-[#C69214] transition"
          >
            Histórico de Manutenção
          </Link>

          <span className="text-xs uppercase tracking-wide text-[#C69214] mt-2">
            Consultas
          </span>

          <Link
            href="/historicoOrdens"
            className="text-white hover:text-[#C69214] transition"
          >
            Histórico de Ordens
          </Link>

          <Link
            href="/auditoria"
            className="text-white hover:text-[#C69214] transition"
          >
            Auditoria
          </Link>

        </div>
      )}
    </>
  );
}

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

          <Link
            href="/ordemServico"
            className="text-white hover:text-[#C69214] transition"
          >
            Ordens de Serviço
          </Link>

          <Link
            href="/pecas"
            className="text-white hover:text-[#C69214] transition"
          >
            Peças
          </Link>

          <Link
            href="/"
            className="text-white hover:text-[#C69214] transition"
          >
         
          </Link>
        </div>
      )}
    </>
  );
}

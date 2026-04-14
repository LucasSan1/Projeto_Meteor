"use client";

import Link from "next/link";
import HamburgerMenu from "./HamburguerMenu";

export default function Header() {
  return (
    <header className="w-full bg-[#4E342E] shadow-md relative z-40">
      <div className="w-full flex justify-between items-center px-6 py-4">
     
        <div className="flex items-center gap-4">
          <HamburgerMenu />

          <Link href="/">
            <h1 className="text-2xl font-bold text-white tracking-wide hover:text-[#C69214] transition cursor-pointer">
              Meteor
            </h1>
          </Link>
        </div>

        {/* DIREITA */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-200">Usuário</span>

          <button
            className="
            bg-[#C69214]
            text-white
            px-4
            py-2
            rounded-md
            hover:bg-[#a87a10]
            transition
            text-sm
            font-medium
          "
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}

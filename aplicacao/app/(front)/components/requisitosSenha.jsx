"use client";

import { IconeCheck, IconeX } from "./icones";
import { regrasSenha, SENHA_MINIMA } from "../../utils/senha";

const REQUISITOS = [
  { chave: "tamanho", texto: `Pelo menos ${SENHA_MINIMA} caracteres` },
  { chave: "letra", texto: "Uma letra" },
  { chave: "numero", texto: "Um número" },
  { chave: "especial", texto: "Um caractere especial" },
];

// Checklist vivo da senha
export default function RequisitosSenha({ senha }) {
  const regras = regrasSenha(senha);

  return (
    <ul className="flex flex-col gap-1" aria-live="polite">
      {REQUISITOS.map((requisito) => {
        const cumprido = regras[requisito.chave];

        return (
          <li
            key={requisito.chave}
            className={`flex items-center gap-1.5 text-[11px] transition-colors ${
              cumprido ? "text-emerald-600" : "text-[#697385]"
            }`}
          >
            {cumprido ? (
              <IconeCheck size={13} strokeWidth={2.5} />
            ) : (
              <IconeX size={13} strokeWidth={2.5} />
            )}

            {requisito.texto}
          </li>
        );
      })}
    </ul>
  );
}

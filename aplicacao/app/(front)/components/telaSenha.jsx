"use client";

import { BrandLogo, CosmoMarca } from "./marca";

export default function TelaSenha({ titulo, subtitulo, children }) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-[#EBECF7]">
      <div className="relative hidden md:flex items-center justify-center p-10 md:p-12 bg-[#11284F] overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#4A48A8]/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full bg-[#334E7F]/40 blur-3xl" />

        <div className="relative flex flex-col items-center text-center">
          <BrandLogo width={340} claro />

          <p className="mt-6 text-sm text-white/50 tracking-wide">
            Gestão industrial do começo ao fim
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <div className="md:hidden flex justify-center mb-8">
            <CosmoMarca size={34} legenda />
          </div>

          <h2
            className="text-center text-3xl font-bold tracking-[0.12em] text-[#11284F]"
            style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
            }}
          >
            {titulo}
          </h2>

          <p className="mt-2 text-sm text-center text-[#697385]">{subtitulo}</p>

          <div className="mt-8 flex flex-col gap-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";

import cosmoLogo from "../assets/cosmoLogo.png";
import cosmoCometa from "../assets/cosmoCometa.png";

// Marca oficial do Cosmo, com duas variantes:
//  • "completo": logotipo inteiro (cometa + "Cosmo Usinagem")
//  • "simbolo": só o cometa, recortado da prancha oficial Cosmo.png 1878×1056
// Em fundo escuro, o filtro deixa o traço branco sem precisar de outro arquivo
export function Logo({
  variante = "completo",
  width = 240,
  size = 32,
  claro = false,
}) {
  if (variante === "completo") {
    return (
      <Image
        src={cosmoLogo}
        alt="Cosmo Usinagem"
        unoptimized
        width={width}
        height={width}
        priority
        style={{
          width,
          height: "auto",
          objectFit: "contain",
          display: "block",
          filter: claro ? "brightness(0) invert(1)" : "none",
        }}
      />
    );
  }


  const w = size * 1.582;
  const escala = size / 396;
  const offsetX = (w - 530 * escala) / 2;

  return (
    <div
      aria-hidden="true"
      style={{
        width: w,
        height: size,
        overflow: "hidden",
        position: "relative",
        flexShrink: 0,
      }}
    >
      <Image
        src={cosmoCometa}
        alt=""
        unoptimized
        width={Math.round(1878 * escala)}
        height={Math.round(1056 * escala)}
        style={{
          position: "absolute",
          maxWidth: "none",
          width: 1878 * escala,
          height: 1056 * escala,
          left: -28 * escala + offsetX,
          top: -22 * escala,
          filter: claro ? "grayscale(1) contrast(10) invert(1)" : "none",
          mixBlendMode: claro ? "screen" : "multiply",
        }}
      />
    </div>
  );
}

// Só o cometa, pra usar em cabeçalhos e menus
export function Mark({ size = 32, claro = false }) {
  return <Logo variante="simbolo" size={size} claro={claro} />;
}

// Logotipo completo, usado no painel de login
export function BrandLogo({ width = 240, claro = false }) {
  return <Logo variante="completo" width={width} claro={claro} />;
}


export function CosmoMarca({ size = 26, cor = "#11284F", legenda = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <Mark size={size} />

      <div className="flex flex-col leading-none">
        <span
          className="font-bold tracking-tight"
          style={{ color: cor, fontSize: size * 0.62 }}
        >
          Cosmo
        </span>

        {legenda && (
          <span
            className="text-[9px] font-medium uppercase tracking-[0.18em]"
            style={{ color: cor, opacity: 0.5, marginTop: 3 }}
          >
            Cosmo Usinagem
          </span>
        )}
      </div>
    </div>
  );
}

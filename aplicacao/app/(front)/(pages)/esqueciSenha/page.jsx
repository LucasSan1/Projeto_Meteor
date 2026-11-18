"use client";

import Link from "next/link";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Swal from "sweetalert2";

import TelaSenha from "@/app/(front)/components/telaSenha";
import { esqueciSenhaService } from "@/app/(front)/services/senhaService";

export default function EsqueciSenha() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [codigoGerado, setCodigoGerado] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();

    if (carregando) return;

    if (!email.trim()) {
      setCodigoGerado(null);

      Swal.fire({
        icon: "warning",
        title: "Campo obrigatório",
        text: "Informe o email da conta.",
      });

      return;
    }

    setCarregando(true);

    try {
      const response = await esqueciSenhaService({ email });

      // O apiFetch já mostrou o alerta de erro e devolveu null
      if (!response) return;

      // Em produção isso chegaria por email; aqui o modo acadêmico mostra na tela
      setCodigoGerado({
        codigo: response.codigo ?? null,
        validadeMinutos: response.validadeMinutos ?? 10,
      });
    } finally {
      setCarregando(false);
    }
  }

  function continuar() {
    router.push(`/redefinirSenha?email=${encodeURIComponent(email.trim())}`);
  }

  return (
    <TelaSenha
      titulo="RECUPERAR ACESSO"
      subtitulo="Informe seu email pra gerar o código de recuperação"
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {/* EMAIL */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[#334E7F]">
            E-mail
          </label>

          <input
            type="email"
            placeholder="Digite seu email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setCodigoGerado(null);
            }}
            className="
            w-full
            rounded-full
            px-5
            py-3
            text-sm
            text-[#11284F]
            bg-white
            border
            border-[#334E7F]/15
            placeholder:text-[#697385]/60
            focus:outline-none
            focus:ring-2
            focus:ring-[#4A48A8]/40
            transition-shadow
            "
          />
        </div>

        <button
          type="submit"
          disabled={carregando}
          aria-busy={carregando}
          className="
          w-full
          rounded-full
          py-3.5
          mt-2
          bg-[#11284F]
          text-white
          text-sm
          font-bold
          tracking-[0.14em]
          hover:bg-[#1c2947]
          transition-colors
          disabled:opacity-60
          disabled:cursor-not-allowed
          "
        >
          {carregando ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              GERANDO...
            </span>
          ) : (
            "GERAR CÓDIGO"
          )}
        </button>
      </form>

      {codigoGerado?.codigo && (
        <div className="rounded-2xl bg-white border border-[#4A48A8]/20 p-4 text-center">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-[#697385]">
            CÓDIGO
          </p>

          <p className="mt-1 text-2xl font-bold tracking-[0.3em] text-[#11284F]">
            {codigoGerado.codigo}
          </p>

          <p className="mt-1 text-[11px] text-[#697385]">
            Válido por {codigoGerado.validadeMinutos} minutos
          </p>

          <button
            type="button"
            onClick={continuar}
            className="
            mt-3
            w-full
            rounded-full
            py-2.5
            bg-[#4A48A8]
            text-white
            text-xs
            font-bold
            tracking-[0.14em]
            hover:bg-[#3d3b8f]
            transition-colors
            "
          >
            CONTINUAR
          </button>
        </div>
      )}

      {/* Sem código? O backend respondeu genérico e não dá pra continuar */}
      {codigoGerado && !codigoGerado.codigo && (
        <p className="text-center text-[12px] text-[#697385]">
          Se o email estiver cadastrado, o código foi enviado. Confira a caixa de
          entrada.
        </p>
      )}

      <Link
        href="/login"
        className="
        text-center
        text-[13px]
        font-semibold
        text-[#4A48A8]
        hover:text-[#3d3b8f]
        transition-colors
        "
      >
        Voltar para o login
      </Link>
    </TelaSenha>
  );
}

"use client";

import Link from "next/link";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Swal from "sweetalert2";

import TelaSenha from "@/app/(front)/components/telaSenha";
import RequisitosSenha from "@/app/(front)/components/requisitosSenha";
import { redefinirSenhaService } from "@/app/(front)/services/senhaService";

const CAMPO_CLASSE = `
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
`;

const CAMPO_BLOQUEADO_CLASSE = `
w-full
rounded-full
px-5
py-3
text-sm
text-[#697385]
bg-[#EBECF7]
border
border-[#334E7F]/15
focus:outline-none
`;

function FormularioRedefinir() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = (searchParams.get("email") ?? "").trim();

  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  if (!email) {
    return (
      <TelaSenha
        titulo="REDEFINIR SENHA"
        subtitulo="Precisamos do email da conta pra continuar"
      >
        <p className="text-center text-sm text-[#697385]">
          Comece informando o email na tela de recuperação.
        </p>

        <Link
          href="/esqueciSenha"
          className="
          text-center
          text-[13px]
          font-semibold
          text-[#4A48A8]
          hover:text-[#3d3b8f]
          transition-colors
          "
        >
          Ir para a recuperação
        </Link>
      </TelaSenha>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (carregando) return;

    if (!codigo.trim() || !nome.trim() || !novaSenha.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Campos obrigatórios",
        text: "Preencha código, nome e a nova senha.",
      });

      return;
    }

    // Conferência local só pra não gastar tentativa do código com erro de digitação
    if (novaSenha !== confirmarSenha) {
      Swal.fire({
        icon: "warning",
        title: "Senhas diferentes",
        text: "A confirmação precisa ser igual à nova senha.",
      });

      return;
    }

    setCarregando(true);

    try {
      const response = await redefinirSenhaService({
        email,
        codigo,
        nome,
        novaSenha,
      });

      if (!response) return;

      await Swal.fire({
        icon: "success",
        title: "Senha redefinida!",
        text: "Agora faça login com a nova senha.",
      });

      router.push("/login");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <TelaSenha
      titulo="REDEFINIR SENHA"
      subtitulo="Confirme o código e o nome da conta pra liberar a troca"
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {/* EMAIL — já veio da tela anterior */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[#334E7F]">
            E-mail
          </label>

          <input
            type="email"
            value={email}
            readOnly
            className={CAMPO_BLOQUEADO_CLASSE}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[#334E7F]">
            Código de recuperação
          </label>

          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6 dígitos"
            maxLength={6}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
            className={`${CAMPO_CLASSE} tracking-[0.3em]`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[#334E7F]">
            Nome cadastrado
          </label>

          <input
            type="text"
            placeholder="Nome completo da conta"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={CAMPO_CLASSE}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[#334E7F]">
            Nova senha
          </label>

          <div className="relative">
            <input
              type={mostrarSenha ? "text" : "password"}
              placeholder="Nova senha"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className={`${CAMPO_CLASSE} pr-20`}
            />

            <button
              type="button"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              className="
              absolute
              right-4
              top-1/2
              -translate-y-1/2
              text-xs
              font-semibold
              text-[#4A48A8]
              hover:text-[#3d3b8f]
              transition-colors
              "
            >
              {mostrarSenha ? "ocultar" : "mostrar"}
            </button>
          </div>
        </div>

        <div className="-mt-1">
          <RequisitosSenha senha={novaSenha} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[#334E7F]">
            Confirmar nova senha
          </label>

          <input
            type={mostrarSenha ? "text" : "password"}
            placeholder="Repita a nova senha"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            className={`${CAMPO_CLASSE} pr-20`}
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
              SALVANDO...
            </span>
          ) : (
            "REDEFINIR SENHA"
          )}
        </button>
      </form>

      <Link
        href="/esqueciSenha"
        className="
        text-center
        text-[13px]
        font-semibold
        text-[#4A48A8]
        hover:text-[#3d3b8f]
        transition-colors
        "
      >
        Gerar um código novo
      </Link>
    </TelaSenha>
  );
}

export default function RedefinirSenha() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#EBECF7]" />}>
      <FormularioRedefinir />
    </Suspense>
  );
}

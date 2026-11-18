"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Swal from "sweetalert2";

import TelaSenha from "@/app/(front)/components/telaSenha";
import RequisitosSenha from "@/app/(front)/components/requisitosSenha";
import { trocarSenhaService } from "@/app/(front)/services/senhaService";
import { limparSessao } from "@/app/utils/sessao";
import { HOME_POR_CARGO } from "@/app/utils/homePorCargo";

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

export default function TrocarSenha() {
  const router = useRouter();

  const [primeiroAcesso, setPrimeiroAcesso] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    setPrimeiroAcesso(localStorage.getItem("primeiroAcesso") === "1");
  }, []);

  function sair() {
    limparSessao();
    router.push("/login");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (carregando) return;

    if ((!primeiroAcesso && !senhaAtual.trim()) || !novaSenha.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Campos obrigatórios",
        text: primeiroAcesso
          ? "Preencha a nova senha."
          : "Preencha a senha atual e a nova senha.",
      });

      return;
    }

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
      const response = await trocarSenhaService(
        primeiroAcesso ? { novaSenha } : { senhaAtual, novaSenha },
      );

      if (!response) return;

      localStorage.setItem("token", response.token);
      localStorage.setItem("cargo", response.cargo);
      localStorage.setItem("usuario", response.usuario);
      localStorage.removeItem("primeiroAcesso");

      await Swal.fire({
        icon: "success",
        title: "Senha atualizada!",
        text: "Sua nova senha já está valendo.",
      });

      router.push(HOME_POR_CARGO[response.cargo] || "/");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <TelaSenha
      titulo="TROCAR SENHA"
      subtitulo={
        primeiroAcesso
          ? "Primeiro acesso: escolha uma senha só sua pra liberar o sistema"
          : "Confirme a senha atual e defina a nova"
      }
    >
      {primeiroAcesso && (
        <div className="rounded-2xl bg-white border border-[#4A48A8]/20 p-3 text-[12px] text-[#334E7F]">
          Sua conta ainda está com a senha padrão. A troca é obrigatória antes
          de usar o sistema.
        </div>
      )}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {/* SENHA ATUAL — no primeiro acesso o login já validou a credencial */}
        {!primeiroAcesso && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#334E7F]">
              Senha atual
            </label>

            <input
              type={mostrarSenha ? "text" : "password"}
              placeholder="Sua senha atual"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              className={CAMPO_CLASSE}
            />
          </div>
        )}

        {/* NOVA SENHA */}
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
            "SALVAR NOVA SENHA"
          )}
        </button>
      </form>

      <button
        type="button"
        onClick={sair}
        className="
        text-center
        text-[13px]
        font-semibold
        text-[#4A48A8]
        hover:text-[#3d3b8f]
        transition-colors
        "
      >
        Sair da conta
      </button>
    </TelaSenha>
  );
}

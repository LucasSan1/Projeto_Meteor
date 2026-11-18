"use client";

import Link from "next/link";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Swal from "sweetalert2";

import { BrandLogo, CosmoMarca } from "@/app/(front)/components/marca";
import { loginService } from "@/app/(front)/services/loginService";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (carregando) return;

    if (!email || !senha) {
      Swal.fire({
        icon: "warning",
        title: "Campos obrigatórios",
        text: "Preencha email e senha.",
      });

      return;
    }

    setCarregando(true);

    try {
      const response = await loginService({
        email,
        senha,
      });

      if (!response) return;

      localStorage.setItem("token", response.token);
      localStorage.setItem("cargo", response.cargo);
      localStorage.setItem("usuario", response.usuario);

      Swal.fire({
        icon: "success",
        title: "Login realizado!",
      });

      // Cada perfil cai na tela que realmente usa
      const homePorCargo = {
        gerente: "/",
        operador: "/ordemServico",
        mecanico: "/manutencoesProgramadas",
      };

      router.push(homePorCargo[response.cargo] || "/");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-[#EBECF7]">
      {/* Painel esquerdo — marca sobre o navy */}
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

      {/* FORM */}
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
            LOGIN
          </h2>

          <p className="mt-2 text-sm text-center text-[#697385]">
            Faça login para acessar o sistema
          </p>

          <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit}>

            {/* EMAIL */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#334E7F]">
                E-mail
              </label>

              <input
                type="email"
                placeholder="Digite seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

            {/* SENHA */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-[#334E7F]">
                Senha
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="
                  w-full
                  rounded-full
                  px-5
                  py-3
                  pr-20
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

                {/* show/hiden na senha */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
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
                  {showPassword ? "ocultar" : "mostrar"}
                </button>
              </div>
            </div>

            {/* CHECKBOX */}
            <div className="flex items-center gap-2 text-sm text-[#334E7F]">
              <input
                type="checkbox"
                className="w-4 h-4 accent-[#4A48A8]"
              />

              <label>Manter logado</label>
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
                  ENTRANDO...
                </span>
              ) : (
                "ENTRAR"
              )}
            </button>

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
              Esqueceu sua senha?
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}

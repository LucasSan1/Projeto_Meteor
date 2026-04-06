"use client"

import Link from "next/link";
import Image from "next/image";
import logo from "@/app/(front)/assets/Logo Meteor.png";

export default function Login() {

  return (
    <div className="flex h-screen">

      <div className="hidden md:flex w-1/2 bg-[#4E342E] items-center justify-center flex-col text-white p-10">

        <Image
          src={logo}
          alt="Logo Meteor"
          width={600}
          height={600}
          className="mb-6"
        />

      </div>


      {/* FORM */}
      <div className="flex w-full md:w-1/2 items-center justify-center bg-[#F9F7F4]">

        <div className="w-[22rem] flex flex-col gap-6 bg-white p-8 rounded-xl shadow-md">

          <h2 className="text-3xl font-bold text-center text-[#4E342E]">
            Login
          </h2>

          <p className="text-sm text-gray-600 text-center">
            Faça login para acessar o sistema
          </p>

          <form className="flex flex-col gap-4">

            {/* EMAIL */}
            <div className="flex flex-col gap-1">

              <label className="text-sm font-medium text-[#4E342E]">
                Email
              </label>

              <input
                type="email"
                placeholder="Digite seu email"
                className="
                border border-gray-300
                rounded-md
                p-2
                focus:outline-none
                focus:ring-2
                focus:ring-[#C69214]
                transition
                "
              />

            </div>


            {/* SENHA */}
            <div className="flex flex-col gap-1">

              <label className="text-sm font-medium text-[#4E342E]">
                Senha
              </label>

              <input
                type="password"
                placeholder="Digite sua senha"
                className="
                border border-gray-300
                rounded-md
                p-2
                focus:outline-none
                focus:ring-2
                focus:ring-[#C69214]
                transition
                "
              />

            </div>


            {/* CHECKBOX */}
            <div className="flex items-center gap-2 text-sm text-[#4E342E]">

              <input
                type="checkbox"
                className="accent-[#C69214]"
              />

              <label>Manter logado</label>

            </div>


            {/* BOTÃO */}
            <button
              type="submit"
              className="
              bg-[#C69214]
              text-white
              p-2
              rounded-md
              hover:bg-[#a87a10]
              transition
              font-medium
              "
            >
              Entrar
            </button>


            {/* LINK */}
            <Link
              href="/forgot"
              className="
              text-sm
              text-[#C69214]
              hover:underline
              text-center
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
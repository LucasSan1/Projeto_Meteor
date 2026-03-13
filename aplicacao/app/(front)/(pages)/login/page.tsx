"use client"

import Link from "next/link";


export default function Login() {

  return (
 <div className="flex h-screen items-center justify-center bg-gray-50">

      <div className="w-[22rem] flex flex-col gap-6">

        <h1 className="text-4xl font-bold text-center">Meteor</h1>

        <p className="text-sm text-gray-600 text-center">
          Faça login para acessar o sistema
        </p>

        <form className="flex flex-col gap-4">

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              placeholder="Digite seu email"
              className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Senha</label>
            <input
              type="password"
              placeholder="Digite sua senha"
              className="border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 text-sm">
            <input type="checkbox" />
            <label>Manter logado</label>
          </div>

          <button
            type="submit"
            className="bg-black text-white p-2 rounded-md hover:bg-gray-800 transition"
          >
            Entrar
          </button>

          <Link
            href="/forgot"
            className="text-sm text-blue-600 hover:underline text-center"
          >
            Esqueceu sua senha?
          </Link>

        </form>

      </div>

    </div>
  );
}


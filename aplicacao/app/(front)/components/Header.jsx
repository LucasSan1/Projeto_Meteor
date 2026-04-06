"use client"

export default function Header() {

  return (

    <header className="
      w-full
      bg-white
      shadow-md
      px-6
      py-4
      flex
      justify-between
      items-center
      rounded-xl
    ">

      {/* NOME DO SISTEMA */}
      <h1 className="
        text-2xl
        font-bold
        text-[#4E342E]
      ">
        Meteor
      </h1>


      {/* USUÁRIO */}
      <div className="
        flex
        items-center
        gap-4
      ">

        <span className="text-sm text-gray-600">
          Usuário
        </span>

        <button className="
          bg-[#C69214]
          text-white
          px-4
          py-2
          rounded-md
          hover:bg-[#a87a10]
          transition
          text-sm
        ">
          Sair
        </button>

      </div>

    </header>

  )

}
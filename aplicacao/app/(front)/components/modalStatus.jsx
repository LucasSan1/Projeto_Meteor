"use client";

import { useState } from "react";

export default function ModalStatus({
  ordem,
  statusOptions = [],
  onClose,
  onConfirm
}) {

  const [statusSelecionado, setStatusSelecionado] =
    useState(ordem?.status || "");

  function handleConfirm() {
    if (statusSelecionado === ordem.status) {

        onClose();
        return;

    }

    const payload = {
        id: ordem.pk_ordemID,
        status: statusSelecionado
    };

    onConfirm(payload);

    }


  return (

    <div className="
      fixed
      inset-0
      bg-black/40
      flex
      items-center
      justify-center
      z-50
    ">

      <div className="
        bg-white
        p-6
        rounded-xl
        shadow-lg
        w-full
        max-w-md
        flex
        flex-col
        gap-4
      ">

        {/* Título */}
        <h2 className="
          text-lg
          font-bold
          text-[#4E342E]
        ">
          Alterar Status da Ordem
        </h2>

        {/* Select */}
        <select
          value={statusSelecionado}
          onChange={(e) =>
            setStatusSelecionado(e.target.value)
          }
          className="
            border
            rounded
            p-2
            text-black
          "
        >

          {statusOptions.map(status => (

            <option
              key={status}
              value={status}
            >
              {status}
            </option>

          ))}

        </select>

        {/* Botões */}
        <div className="
          flex
          justify-end
          gap-2
          mt-4
        ">

          <button
            onClick={onClose}
            className="
              px-4
              py-2
              rounded
              bg-gray-300
              hover:bg-gray-400
            "
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            className="
              px-4
              py-2
              rounded
              bg-green-600
              text-white
              hover:bg-green-700
            "
          >
            Confirmar
          </button>

        </div>

      </div>

    </div>

  );

}
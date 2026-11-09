"use client";

import { useState } from "react";

import Swal from "sweetalert2";

export default function ModalStatus({
  ordem,
  statusOptions = [],
  permitirAntecipacao = false,
  onClose,
  onConfirm
}) {

  const [statusSelecionado, setStatusSelecionado] =
    useState(ordem?.status || "");

  const [observacao, setObservacao] = useState("");

  // Operador pode começar antes do planejado, mas precisa justificar
  const inicioPlanejado = ordem?.inicioPlanejado
    ? new Date(ordem.inicioPlanejado)
    : null;

  const iniciandoAntecipado =
    permitirAntecipacao &&
    statusSelecionado === "Em Produção" &&
    inicioPlanejado &&
    !Number.isNaN(inicioPlanejado.getTime()) &&
    new Date() < inicioPlanejado;

  async function handleConfirm() {
    if (statusSelecionado === ordem.status) {

        onClose();
        return;

    }

    if (iniciandoAntecipado && !observacao.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Observação obrigatória",
        text: "Explique o motivo de iniciar a ordem antes do planejado.",
      });

      return;
    }

    const payload = {
        id: ordem.pk_ordemID,
        status: statusSelecionado,
        observacao: observacao.trim() || undefined
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

        {/* Só aparece quando o operador vai começar antes da data planejada */}
        {iniciandoAntecipado && (
          <div className="flex flex-col gap-1">
            <label className="text-sm text-black">
              Observação do início antecipado
            </label>

            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={3}
              placeholder="Explique por que a ordem está começando antes do planejado"
              className="border rounded p-2 text-black"
            />
          </div>
        )}

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
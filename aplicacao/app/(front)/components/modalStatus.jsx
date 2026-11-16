"use client";

import { useState } from "react";

import Swal from "sweetalert2";

import { IconeX } from "./icones";

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
      bg-black/50
      flex
      items-center
      justify-center
      z-50
      p-4
    ">

      <div className="
        bg-white
        rounded-xl
        shadow-2xl
        w-full
        max-w-md
        flex
        flex-col
        overflow-hidden
      ">

        {/* Título */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#334E7F]/10">
          <h2 className="text-base font-semibold text-[#11284F]">
            Alterar Status da Ordem
          </h2>

          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-[#697385] hover:text-[#11284F] transition-colors"
          >
            <IconeX size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* Select */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Novo status
            </label>

            <select
              value={statusSelecionado}
              onChange={(e) =>
                setStatusSelecionado(e.target.value)
              }
              className="campo"
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
          </div>

          {/* Só aparece quando o operador vai começar antes da data planejada */}
          {iniciandoAntecipado && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Observação do início antecipado
              </label>

              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                rows={3}
                placeholder="Explique por que a ordem está começando antes do planejado"
                className="campo"
              />
            </div>
          )}
        </div>

        {/* Botões */}
        <div className="
          flex
          justify-end
          gap-2
          px-5
          py-4
          border-t
          border-[#334E7F]/10
        ">

          <button onClick={onClose} className="btn-secundario">
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded bg-[#2E9B5E] text-white font-semibold hover:bg-[#27844F] transition-colors"
          >
            Confirmar
          </button>

        </div>

      </div>

    </div>

  );

}

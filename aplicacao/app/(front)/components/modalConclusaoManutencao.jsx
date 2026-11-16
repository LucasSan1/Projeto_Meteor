"use client";

import { useState } from "react";

import { IconeX } from "./icones";

export default function ModalConclusaoManutencao({
  manutencao,
  onClose,
  onConfirm,
}) {
  const [servicosRealizados, setServicosRealizados] = useState(
    manutencao?.servicosRealizados || "",
  );
  const [custos, setCustos] = useState("");
  const [observacoes, setObservacoes] = useState("");

  function handleConfirm() {
    onConfirm({
      status: "Concluída",
      servicosRealizados,
      custos: custos ? Number(custos) : 0,
      observacoes,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#334E7F]/10 flex-shrink-0">
          <h2 className="text-base font-semibold text-[#11284F]">
            Concluir Manutenção
          </h2>

          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-[#697385] hover:text-[#11284F] transition-colors"
          >
            <IconeX size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          <p className="text-sm text-[#697385]">
            Equipamento:{" "}
            <span className="text-[#11284F] font-semibold">
              {manutencao?.equipamento}
            </span>
          </p>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Serviços Realizados
            </label>

            <textarea
              rows={3}
              value={servicosRealizados}
              onChange={(e) => setServicosRealizados(e.target.value)}
              className="campo"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Custos (R$)
            </label>

            <input
              type="number"
              step="0.01"
              value={custos}
              onChange={(e) => setCustos(e.target.value)}
              className="campo"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Observações
            </label>

            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="campo"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#334E7F]/10 flex-shrink-0">
          <button onClick={onClose} className="btn-secundario">
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded bg-[#2E9B5E] text-white font-semibold hover:bg-[#27844F] transition-colors"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}

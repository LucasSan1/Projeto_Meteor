"use client";

import { useState } from "react";

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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md flex flex-col gap-4">
        <h2 className="text-lg font-bold text-[#4E342E]">
          Concluir Manutenção
        </h2>

        <p className="text-sm text-black">
          Equipamento: {manutencao?.equipamento}
        </p>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-black">Serviços Realizados</label>

          <textarea
            rows={3}
            value={servicosRealizados}
            onChange={(e) => setServicosRealizados(e.target.value)}
            className="border rounded p-2"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-black">Custos (R$)</label>

          <input
            type="number"
            step="0.01"
            value={custos}
            onChange={(e) => setCustos(e.target.value)}
            className="border rounded p-2"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-black">Observações</label>

          <textarea
            rows={2}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            className="border rounded p-2"
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}

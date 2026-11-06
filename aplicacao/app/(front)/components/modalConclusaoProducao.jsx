"use client";

import { useState } from "react";

import Swal from "sweetalert2";

// Conclusão é onde a ordem vira história, consumo, produção e inspeção saem daqui juntos
export default function ModalConclusaoProducao({ ordem, onClose, onConfirm }) {
  const materiais = ordem.materiais || [];

  const [formData, setFormData] = useState(() => ({
    quantidadeProduzida: String(ordem.quantidadePlanejada ?? ""),
    aprovadas: String(ordem.quantidadePlanejada ?? ""),
    rejeitadas: "0",
    observacoes: "",
  }));

  const [consumo, setConsumo] = useState(() => {
    const inicial = {};

    materiais.forEach((material) => {
      inicial[material.fk_materiaID] = String(material.quantidadePrevista ?? "");
    });

    return inicial;
  });

  const [rejeicoes, setRejeicoes] = useState([]);

  function atualizarCampo(nome, valor) {
    setFormData((prev) => ({ ...prev, [nome]: valor }));
  }

  // Mantém aprovadas + rejeitadas fechando com o produzido sem o usuário precisar fazer conta de cabeça (o banco também valida, claro)
  function atualizarProduzida(valor) {
    const produzida = Number(valor);
    const rejeitadas = Number(formData.rejeitadas || 0);

    setFormData((prev) => ({
      ...prev,
      quantidadeProduzida: valor,
      aprovadas:
        Number.isInteger(produzida) && rejeitadas <= produzida
          ? String(produzida - rejeitadas)
          : prev.aprovadas,
    }));
  }

  function atualizarRejeitadas(valor) {
    const rejeitadas = Number(valor);
    const produzida = Number(formData.quantidadeProduzida);

    setFormData((prev) => ({
      ...prev,
      rejeitadas: valor,
      aprovadas:
        Number.isInteger(produzida) && rejeitadas <= produzida
          ? String(produzida - rejeitadas)
          : prev.aprovadas,
    }));

    if (rejeitadas > 0) {
      setRejeicoes((prev) => {
        if (prev.length === 0) {
          return [
            {
              quantidade: String(rejeitadas),
              motivoRejeicao: "",
              tipo: "Perda",
              acoesCorretivas: "",
            },
          ];
        }

        if (prev.length === 1) {
          return [{ ...prev[0], quantidade: String(rejeitadas) }];
        }

        return prev;
      });
    } else {
      setRejeicoes([]);
    }
  }

  function atualizarRejeicao(index, campo, valor) {
    setRejeicoes((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [campo]: valor } : item)),
    );
  }

  function adicionarRejeicao() {
    setRejeicoes((prev) => [
      ...prev,
      {
        quantidade: "",
        motivoRejeicao: "",
        tipo: "Perda",
        acoesCorretivas: "",
      },
    ]);
  }

  function removerRejeicao(index) {
    setRejeicoes((prev) => prev.filter((_, i) => i !== index));
  }

  function atualizarConsumo(materiaID, valor) {
    setConsumo((prev) => ({ ...prev, [materiaID]: valor }));
  }

  async function handleConfirm() {
    const produzida = Number(formData.quantidadeProduzida);
    const aprovadas = Number(formData.aprovadas);
    const rejeitadas = Number(formData.rejeitadas);

    if (
      !Number.isInteger(produzida) ||
      !Number.isInteger(aprovadas) ||
      !Number.isInteger(rejeitadas) ||
      produzida < 0 ||
      aprovadas < 0 ||
      rejeitadas < 0
    ) {
      await Swal.fire({
        icon: "warning",
        title: "Quantidades inválidas",
        text: "Produzidas, aprovadas e rejeitadas precisam ser inteiros não negativos.",
      });

      return;
    }

    if (aprovadas + rejeitadas !== produzida) {
      await Swal.fire({
        icon: "warning",
        title: "Conta não fecha",
        text: "Aprovadas + rejeitadas precisa bater com o total produzido.",
      });

      return;
    }

    if (rejeitadas > 0) {
      if (rejeicoes.length === 0) {
        await Swal.fire({
          icon: "warning",
          title: "Motivo obrigatório",
          text: "Informe o motivo das peças rejeitadas.",
        });

        return;
      }

      for (const rejeicao of rejeicoes) {
        if (!Number.isInteger(Number(rejeicao.quantidade)) || Number(rejeicao.quantidade) <= 0) {
          await Swal.fire({
            icon: "warning",
            title: "Rejeição inválida",
            text: "Cada rejeição precisa de uma quantidade inteira maior que zero.",
          });

          return;
        }

        if (!rejeicao.motivoRejeicao.trim()) {
          await Swal.fire({
            icon: "warning",
            title: "Motivo obrigatório",
            text: "Preencha o motivo de cada rejeição.",
          });

          return;
        }
      }

      const soma = rejeicoes.reduce(
        (total, rejeicao) => total + Number(rejeicao.quantidade),
        0,
      );

      if (soma !== rejeitadas) {
        await Swal.fire({
          icon: "warning",
          title: "Soma divergente",
          text: `A soma dos motivos (${soma}) precisa bater com o total rejeitado (${rejeitadas}).`,
        });

        return;
      }
    }

    for (const material of materiais) {
      const valor = Number(consumo[material.fk_materiaID]);

      if (!Number.isFinite(valor) || valor < 0) {
        await Swal.fire({
          icon: "warning",
          title: "Consumo inválido",
          text: `O consumo de "${material.materia}" não pode ser negativo.`,
        });

        return;
      }
    }

    await onConfirm({
      status: "Concluída",
      consumo: materiais.map((material) => ({
        materiaID: material.fk_materiaID,
        quantidade: Number(consumo[material.fk_materiaID] || 0),
      })),
      producao: {
        quantidadeProduzida: produzida,
        aprovadas,
        rejeitadas,
        observacoes: formData.observacoes,
      },
      rejeicoes: rejeitadas > 0 ? rejeicoes : [],
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#4E342E]">
            Concluir {ordem.codigo}
          </h2>
          <p className="text-sm text-gray-600">
            {ordem.nomePeca} — {ordem.quantidadePlanejada} peças planejadas
          </p>
        </div>

        {materiais.length === 0 ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
            Esta ordem é antiga e não tem matérias-primas vinculadas. O consumo
            será registrado vazio; dá pra seguir só com a produção e a inspeção.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-[#4E342E]">Consumo efetivo</h3>

            {materiais.map((material) => (
              <div
                key={material.fk_materiaID}
                className="flex flex-col sm:flex-row sm:items-center gap-2 border-b pb-2"
              >
                <div className="flex-1">
                  <p className="text-sm text-black">{material.materia}</p>
                  <p className="text-xs text-gray-500">
                    Planejado: {material.quantidadePrevista}{" "}
                    {material.unidadeMedida} — disponível:{" "}
                    {material.quantidadeEstoque} {material.unidadeMedida}
                  </p>
                </div>

                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={consumo[material.fk_materiaID] ?? ""}
                  onChange={(e) =>
                    atualizarConsumo(material.fk_materiaID, e.target.value)
                  }
                  className="border rounded p-2 w-full sm:w-40"
                />
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Campo label="Peças Produzidas">
            <input
              type="number"
              min="0"
              step="1"
              value={formData.quantidadeProduzida}
              onChange={(e) => atualizarProduzida(e.target.value)}
              className="border rounded p-2"
            />
          </Campo>

          <Campo label="Aprovadas">
            <input
              type="number"
              min="0"
              step="1"
              value={formData.aprovadas}
              onChange={(e) => atualizarCampo("aprovadas", e.target.value)}
              className="border rounded p-2"
            />
          </Campo>

          <Campo label="Rejeitadas">
            <input
              type="number"
              min="0"
              step="1"
              value={formData.rejeitadas}
              onChange={(e) => atualizarRejeitadas(e.target.value)}
              className="border rounded p-2"
            />
          </Campo>
        </div>

        {Number(formData.rejeitadas) > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#4E342E]">
                Motivos da rejeição
              </h3>

              <button
                type="button"
                onClick={adicionarRejeicao}
                className="text-sm bg-[#C69214] text-white px-3 py-1 rounded hover:brightness-110"
              >
                + Motivo
              </button>
            </div>

            {rejeicoes.map((rejeicao, index) => (
              <div
                key={index}
                className="border rounded p-3 flex flex-col gap-2 bg-[#F9F7F4]"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Campo label="Quantidade">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={rejeicao.quantidade}
                      onChange={(e) =>
                        atualizarRejeicao(index, "quantidade", e.target.value)
                      }
                      className="border rounded p-2"
                    />
                  </Campo>

                  <Campo label="Tipo">
                    <select
                      value={rejeicao.tipo}
                      onChange={(e) =>
                        atualizarRejeicao(index, "tipo", e.target.value)
                      }
                      className="border rounded p-2"
                    >
                      <option value="Perda">Perda</option>
                      <option value="Retrabalho">Retrabalho</option>
                    </select>
                  </Campo>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removerRejeicao(index)}
                      className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 w-full"
                    >
                      Remover
                    </button>
                  </div>
                </div>

                <Campo label="Motivo">
                  <input
                    type="text"
                    value={rejeicao.motivoRejeicao}
                    onChange={(e) =>
                      atualizarRejeicao(index, "motivoRejeicao", e.target.value)
                    }
                    className="border rounded p-2"
                  />
                </Campo>

                <Campo label="Ações corretivas (opcional)">
                  <input
                    type="text"
                    value={rejeicao.acoesCorretivas}
                    onChange={(e) =>
                      atualizarRejeicao(index, "acoesCorretivas", e.target.value)
                    }
                    className="border rounded p-2"
                  />
                </Campo>
              </div>
            ))}
          </div>
        )}

        <Campo label="Observações da inspeção">
          <textarea
            value={formData.observacoes}
            onChange={(e) => atualizarCampo("observacoes", e.target.value)}
            rows={2}
            className="border rounded p-2"
          />
        </Campo>

        <div className="flex justify-end gap-2">
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
            Concluir Ordem
          </button>
        </div>
      </div>
    </div>
  );
}

function Campo({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-black">{label}</label>
      {children}
    </div>
  );
}

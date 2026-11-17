"use client";

import { useState } from "react";

import Swal from "sweetalert2";

import { IconeX } from "./icones";

// Modal próprio da ordem porque ele tem uma lista dinâmica de materiais
// O ModalIncluir genérico não dá conta de linhas que vão e voltam
export default function ModalOrdemProducao({
  title = "Ordem de Produção",
  pecas = [],
  operadores = [],
  materias = [],
  initialData = null,
  codigoInicial = "",
  onSubmit,
  onClose,
}) {
  // Na criação o código é gerado sozinho, na edição mantém o que já existe
  const codigoAutomatico = !initialData;

  const [formData, setFormData] = useState(() => ({
    codigo: initialData?.codigo ?? codigoInicial,
    pecaID: initialData?.pecaID ?? "",
    quantidadePlanejada: initialData?.quantidadePlanejada ?? "",
    especializacao: initialData?.especializacao ?? "",
    operadorID: initialData?.operadorID ?? "",
    inicioPlanejado: initialData?.inicioPlanejado ?? "",
    terminoPlanejado: initialData?.terminoPlanejado ?? "",
  }));

  const [materiais, setMateriais] = useState(() => {
    const iniciais = initialData?.materiais || [];

    if (iniciais.length === 0) {
      return [{ materiaID: "", quantidadePrevista: "" }];
    }

    return iniciais.map((material) => ({
      materiaID: String(material.fk_materiaID ?? material.materiaID ?? ""),
      quantidadePrevista: String(
        material.quantidadePrevista ?? material.quantidade ?? "",
      ),
    }));
  });

  function atualizarCampo(nome, valor) {
    setFormData((prev) => ({ ...prev, [nome]: valor }));
  }

  function atualizarMaterial(index, campo, valor) {
    setMateriais((prev) =>
      prev.map((material, i) =>
        i === index ? { ...material, [campo]: valor } : material,
      ),
    );
  }

  function adicionarMaterial() {
    setMateriais((prev) => [
      ...prev,
      { materiaID: "", quantidadePrevista: "" },
    ]);
  }

  function removerMaterial(index) {
    setMateriais((prev) => prev.filter((_, i) => i !== index));
  }

  // Abre o calendário nativo já no clique, sem depender do ícone miúdo
  function abrirCalendario(event) {
    try {
      event.currentTarget.showPicker?.();
    } catch {
      // Alguns navegadores já abrem sozinhos ou bloqueiam a chamada, vida que segue
    }
  }

  async function handleConfirm() {
    try {
      const materiaisValidos = materiais.filter(
        (material) => material.materiaID || material.quantidadePrevista,
      );

      if (materiaisValidos.length === 0) {
        await Swal.fire({
          icon: "warning",
          title: "Materiais obrigatórios",
          text: "Inclua pelo menos uma matéria-prima na ordem.",
        });

        return;
      }

      if (
        materiaisValidos.some(
          (material) => !material.materiaID || !material.quantidadePrevista,
        )
      ) {
        await Swal.fire({
          icon: "warning",
          title: "Material incompleto",
          text: "Cada material precisa de matéria-prima e quantidade planejada.",
        });

        return;
      }

      const ids = materiaisValidos.map((material) => material.materiaID);

      if (new Set(ids).size !== ids.length) {
        await Swal.fire({
          icon: "warning",
          title: "Material repetido",
          text: "Não repita a mesma matéria-prima na ordem.",
        });

        return;
      }

      // Quantidade de matéria-prima é contada em peças inteiras, sem meio quilo de parafuso
      const quantidadeInvalida = materiaisValidos.some((material) => {
        const quantidade = Number(material.quantidadePrevista);

        return !Number.isInteger(quantidade) || quantidade <= 0;
      });

      if (quantidadeInvalida) {
        await Swal.fire({
          icon: "warning",
          title: "Quantidade inválida",
          text: "As quantidades das matérias-primas devem ser números inteiros maiores que zero.",
        });

        return;
      }

      await onSubmit({
        ...formData,
        pecaID: Number(formData.pecaID),
        operadorID: Number(formData.operadorID),
        quantidadePlanejada: Number(formData.quantidadePlanejada),
     
        inicioPlanejado: formData.inicioPlanejado,
        terminoPlanejado: formData.terminoPlanejado,
        materiais: materiaisValidos.map((material) => ({
          materiaID: Number(material.materiaID),
          quantidadePrevista: Number(material.quantidadePrevista),
        })),
      });
    } catch (err) {
      console.error("Erro ao salvar ordem:", err);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#334E7F]/10 flex-shrink-0">
          <h2 className="text-base font-semibold text-[#11284F]">{title}</h2>

          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-[#697385] hover:text-[#11284F] transition-colors"
          >
            <IconeX size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Campo label="Código da Ordem">
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => atualizarCampo("codigo", e.target.value)}
                readOnly={codigoAutomatico}
                className={`campo ${
                  codigoAutomatico ? "bg-[#DFE1EF]/60 text-[#697385]" : ""
                }`}
              />

              {codigoAutomatico && (
                <span className="text-xs text-[#697385]">
                  Gerado automaticamente no padrão OP-ano-sequencial
                </span>
              )}
            </Campo>

            <Campo label="Peça">
              <select
                value={formData.pecaID}
                onChange={(e) => atualizarCampo("pecaID", e.target.value)}
                className="campo"
              >
                <option value="">Selecione...</option>
                {pecas.map((peca) => (
                  <option key={peca.value} value={peca.value}>
                    {peca.label}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo label="Quantidade Planejada">
              <input
                type="number"
                min="1"
                step="1"
                value={formData.quantidadePlanejada}
                onChange={(e) =>
                  atualizarCampo("quantidadePlanejada", e.target.value)
                }
                className="campo"
              />
            </Campo>

            <Campo label="Especialização Exigida">
              <input
                type="text"
                value={formData.especializacao}
                onChange={(e) => atualizarCampo("especializacao", e.target.value)}
                className="campo"
              />
            </Campo>

            <Campo label="Operador">
              <select
                value={formData.operadorID}
                onChange={(e) => atualizarCampo("operadorID", e.target.value)}
                className="campo"
              >
                <option value="">Selecione...</option>
                {operadores.map((operador) => (
                  <option key={operador.value} value={operador.value}>
                    {operador.label}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo label="Início Planejado">
              <input
                type="date"
                value={formData.inicioPlanejado}
                onClick={abrirCalendario}
                onChange={(e) =>
                  atualizarCampo("inicioPlanejado", e.target.value)
                }
                className="campo"
              />
            </Campo>

            <Campo label="Término Planejado">
              <input
                type="date"
                value={formData.terminoPlanejado}
                onClick={abrirCalendario}
                onChange={(e) =>
                  atualizarCampo("terminoPlanejado", e.target.value)
                }
                className="campo"
              />
            </Campo>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#11284F]">
                Matérias-primas
              </h3>

              <button
                type="button"
                onClick={adicionarMaterial}
                className="text-sm bg-[#4A48A8] text-white px-3 py-1.5 rounded font-semibold hover:bg-[#3d3b8f] transition-colors"
              >
                + Material
              </button>
            </div>

            {materiais.map((material, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end border-b border-[#334E7F]/10 pb-2"
              >
                <div className="flex-1">
                  <Campo label="Matéria-prima">
                    <select
                      value={material.materiaID}
                      onChange={(e) =>
                        atualizarMaterial(index, "materiaID", e.target.value)
                      }
                      className="campo"
                    >
                      <option value="">Selecione...</option>
                      {materias.map((materia) => (
                        <option key={materia.value} value={materia.value}>
                          {materia.label}
                        </option>
                      ))}
                    </select>
                  </Campo>
                </div>

                <div className="w-full sm:w-40">
                  <Campo label="Quantidade">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={material.quantidadePrevista}
                      onChange={(e) =>
                        atualizarMaterial(
                          index,
                          "quantidadePrevista",
                          e.target.value,
                        )
                      }
                      className="campo"
                    />
                  </Campo>
                </div>

                <button
                  type="button"
                  onClick={() => removerMaterial(index)}
                  className="bg-[#C94545] text-white px-3 py-2 rounded font-semibold hover:bg-[#AD3A3A] transition-colors"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#334E7F]/10 flex-shrink-0">
          <button onClick={onClose} className="btn-secundario">
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded bg-[#4A48A8] text-white font-semibold hover:bg-[#3d3b8f] transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

function Campo({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

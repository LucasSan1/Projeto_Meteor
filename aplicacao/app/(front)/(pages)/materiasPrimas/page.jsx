"use client";

import { useEffect, useState } from "react";

import Header from "../../components/Header";
import PageTitle from "../../components/pageTitle";
import Card from "../../components/Card";
import ModalIncluir from "../../components/modalIncluir";
import ModalDesativados from "../../components/modalDesativados";
import { formatData } from "../../../utils/Datetime";

import Swal from "sweetalert2";

import {
  getMateriasPrimas,
  createMateriaPrima,
  updateMateriaPrima,
  deleteMateriaPrima,
  activateMateriaPrima,
} from "../../services/materiaPrimaService";

import { getFornecedore } from "../../services/fornecedoreServices";
import { createMovimentacao } from "../../services/movimentacaoService";

export default function MateriasPrimas() {
  const [materias, setMaterias] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalAddOpen, setModalAddOpen] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [modalEntradaOpen, setModalEntradaOpen] = useState(false);
  const [showDesativados, setShowDesativados] = useState(false);

  const [materiaSelecionada, setMateriaSelecionada] = useState(null);
  const [materiaEntrada, setMateriaEntrada] = useState(null);

  const materiaFields = [
    {
      name: "materia",
      label: "Matéria-prima",
      type: "text",
    },
    {
      name: "fornecedor",
      label: "Fornecedor",
      type: "select",
      options: fornecedores,
    },
    {
      name: "unidadeMedida",
      label: "Unidade de Medida (kg, m, un...)",
      type: "text",
    },
    {
      name: "estoqueMinimo",
      label: "Estoque Mínimo",
      type: "number",
      step: "0.001",
    },
  ];

  // Saldo inicial só no cadastro, Depois disso, o saldo dança conforme as movimentações de estoque
  const camposCriacao = [
    ...materiaFields,
    {
      name: "quantidadeEstoque",
      label: "Quantidade em Estoque Inicial",
      type: "number",
      step: "0.001",
    },
    {
      name: "dataUltimaCompra",
      label: "Data da Última Compra",
      type: "date",
    },
  ];

  // A última compra é atualizada pela entrada de estoque, não pela edição do cadastro
  const fornecedorAtualDesativado =
    materiaSelecionada?.fornecedorStatus &&
    materiaSelecionada.fornecedorStatus !== "Ativo";

  const fornecedoresEdicao = fornecedorAtualDesativado
    ? [
        ...fornecedores,
        {
          value: materiaSelecionada.fk_fornecedor,
          label: `${materiaSelecionada.fornecedor} (desativado)`,
        },
      ]
    : fornecedores;

  const camposEdicao = materiaFields.map((field) =>
    field.name === "fornecedor"
      ? { ...field, options: fornecedoresEdicao }
      : field,
  );

  // Entrada manual no estoque, a unidade vem da matéria-prima escolhida
  const camposEntrada = [
    {
      name: "quantidade",
      label: `Quantidade${materiaEntrada ? ` (${materiaEntrada.unidadeMedida})` : ""}`,
      type: "number",
      step: "0.001",
    },
    {
      name: "observacao",
      label: "Observação",
      type: "textarea",
    },
  ];

  async function carregar() {
    try {
      const [materiasRes, fornecedoresRes] = await Promise.all([
        getMateriasPrimas(),
        getFornecedore(),
      ]);

      if (materiasRes) {
        setMaterias(materiasRes.data);
      }

      if (fornecedoresRes) {
        setFornecedores(
          fornecedoresRes.data
            .filter((f) => f.status === "Ativo")
            .map((f) => ({
              value: f.pk_fornecedorID,
              label: f.nomeFornecedor,
            })),
        );
      }
    } catch (err) {
      console.error("Erro ao carregar matérias-primas:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleCreateMateria(data) {
    try {
      const response = await createMateriaPrima(data);

      if (!response) return;

      setModalAddOpen(false);

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Matéria-prima cadastrada!",
        showConfirmButton: false,
        timer: 2500,
      });

      await carregar();
    } catch (err) {
      console.error("Erro ao criar matéria-prima:", err);
    }
  }

  async function handleEditMateria(data) {
    try {
      const response = await updateMateriaPrima(
        materiaSelecionada.pk_materiaID,
        data,
      );

      if (!response) return;

      setModalEditOpen(false);
      setMateriaSelecionada(null);

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Matéria-prima atualizada!",
        showConfirmButton: false,
        timer: 2500,
      });

      await carregar();
    } catch (err) {
      console.error("Erro ao editar matéria-prima:", err);
    }
  }

  async function handleDeleteMateria(materia) {
    const result = await Swal.fire({
      title: "Desativar matéria-prima?",
      text: `Deseja desativar "${materia.materia}"?`,
      icon: "warning",

      showCancelButton: true,

      confirmButtonText: "Sim, desativar",
      cancelButtonText: "Cancelar",

      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await deleteMateriaPrima(materia.pk_materiaID);

      if (!response) return;

      await carregar();

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Matéria-prima desativada!",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (err) {
      console.error("Erro ao desativar matéria-prima:", err);
    }
  }

  async function handleActivateMateria(id) {
    try {
      const response = await activateMateriaPrima(id);

      if (!response) return;

      await carregar();

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Matéria-prima ativada!",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (err) {
      console.error("Erro ao ativar matéria-prima:", err);
    }
  }

  // Repõe saldo no estoque sem passar pela tela de movimentações, que agora é só o livro (histórico) de entradas e saídas
  async function handleEntradaEstoque(data) {
    try {
      const response = await createMovimentacao({
        materia: materiaEntrada.pk_materiaID,
        tipo: "Entrada",
        quantidade: data.quantidade,
        unidadeMedida: materiaEntrada.unidadeMedida,
        observacao: data.observacao,
      });

      if (!response) return;

      setModalEntradaOpen(false);
      setMateriaEntrada(null);

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Entrada de estoque registrada!",
        showConfirmButton: false,
        timer: 2500,
      });

      await carregar();
    } catch (err) {
      console.error("Erro ao registrar entrada de estoque:", err);
    }
  }

  async function abrirEntradaEstoque(materia) {
    if (materia.fornecedorStatus && materia.fornecedorStatus !== "Ativo") {
      await Swal.fire({
        icon: "warning",
        title: "Sem fornecedor ativo",
        text: `"${materia.materia}" está vinculada a ${materia.fornecedor}, que está desativado. Troque o fornecedor antes de adicionar estoque!`,
      });

      return;
    }

    setMateriaEntrada(materia);
    setModalEntradaOpen(true);
  }

  function abrirEdicao(materia) {
    setMateriaSelecionada({
      ...materia,
      fornecedor: materia.fk_fornecedor,
    });
    setModalEditOpen(true);
  }

  if (loading) {
    return <p className="p-6 text-[#697385]">Carregando matérias-primas...</p>;
  }

  const ativas = materias.filter((m) => m.status === "Ativo");
  const inativas = materias.filter((m) => m.status === "Desativado");

  return (
    <div className="min-h-screen bg-[#EBECF7] flex flex-col">
      <Header />

      <div className="w-full max-w-6xl mx-auto p-4 md:p-6 flex flex-col gap-6">
        <PageTitle title="Matérias-primas" subtitle="Saldo, mínimo e reposição de estoque">
          <button
            onClick={() => setShowDesativados(true)}
            className="px-4 py-2 rounded border border-[#334E7F]/30 bg-white text-[#334E7F] font-semibold hover:bg-[#334E7F]/10 transition-colors"
          >
            Mostrar desativadas
          </button>
        </PageTitle>

        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-[#11284F]">
            Matérias-primas ({ativas.length})
          </h2>

          {ativas.length === 0 ? (
            <p className="text-[#697385] text-center">
              Nenhuma matéria-prima ativa encontrada
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {ativas.map((materia) => {
                const estoqueBaixo =
                  Number(materia.quantidadeEstoque) <=
                  Number(materia.estoqueMinimo);

                const semFornecedorAtivo =
                  Boolean(materia.fornecedorStatus) &&
                  materia.fornecedorStatus !== "Ativo";

                return (
                  <Card key={materia.pk_materiaID} title={materia.materia}>
                    <p className="text-sm text-[#334E7F]">
                      Fornecedor: {materia.fornecedor}
                      {semFornecedorAtivo ? " (desativado)" : ""}
                    </p>

                    {semFornecedorAtivo && (
                      <p className="text-sm font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                        Sem fornecedor ativo: este insumo não tem fornecedor
                        disponível para novas compras!
                      </p>
                    )}

                    <p className="text-sm text-[#334E7F]">
                      Unidade: {materia.unidadeMedida}
                    </p>

                    <p className="text-sm text-[#334E7F]">
                      Estoque: {materia.quantidadeEstoque} / mínimo{" "}
                      {materia.estoqueMinimo}
                    </p>

                    {estoqueBaixo && (
                      <p className="text-sm text-red-600 font-semibold">
                        Estoque abaixo do mínimo!
                      </p>
                    )}

                    <p className="text-sm text-[#334E7F]">
                      Última compra: {formatData(materia.dataUltimaCompra)}
                    </p>

                    <p className="text-sm text-[#334E7F]">
                      Status: {materia.status}
                    </p>

                    <div className="flex gap-2 mt-3 flex-wrap">
                      <button
                        onClick={() => abrirEntradaEstoque(materia)}
                        className="bg-[#2E9B5E] text-white px-3 py-1 rounded font-semibold transition-colors hover:bg-[#27844F]"
                      >
                        Adicionar ao Estoque
                      </button>

                      <button
                        onClick={() => abrirEdicao(materia)}
                        className="bg-[#334E7F] text-white px-3 py-1 rounded font-semibold transition-colors hover:bg-[#28406b]"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => handleDeleteMateria(materia)}
                        className="bg-[#C94545] text-white px-3 py-1 rounded font-semibold transition-colors hover:bg-[#AD3A3A]"
                      >
                        Desativar
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setModalAddOpen(true)}
        className="
          fixed
          bottom-6
          right-6
          w-14
          h-14
          bg-[#2E9B5E]
          text-white
          text-3xl
          leading-none
          rounded-full
          shadow-xl
          transition-all
          hover:scale-105
          hover:bg-[#27844F]
          flex
          items-center
          justify-center
          z-50
        "
      >
        +
      </button>

      {modalAddOpen && (
        <ModalIncluir
          title="Nova Matéria-prima"
          fields={camposCriacao}
          onSubmit={handleCreateMateria}
          onClose={() => setModalAddOpen(false)}
        />
      )}

      {modalEditOpen && materiaSelecionada && (
        <ModalIncluir
          title="Editar Matéria-prima"
          fields={camposEdicao}
          initialData={materiaSelecionada}
          onSubmit={handleEditMateria}
          onClose={() => {
            setModalEditOpen(false);
            setMateriaSelecionada(null);
          }}
        />
      )}

      {modalEntradaOpen && materiaEntrada && (
        <ModalIncluir
          title={`Entrada de Estoque — ${materiaEntrada.materia} (saldo: ${materiaEntrada.quantidadeEstoque} ${materiaEntrada.unidadeMedida})`}
          fields={camposEntrada}
          onSubmit={handleEntradaEstoque}
          onClose={() => {
            setModalEntradaOpen(false);
            setMateriaEntrada(null);
          }}
        />
      )}

      {showDesativados && (
        <ModalDesativados
          title="Matérias-primas Desativadas"
          items={inativas}
          displayFields={[
            { label: "Matéria", value: "materia" },
            { label: "Fornecedor", value: "fornecedor" },
            { label: "Unidade", value: "unidadeMedida" },
          ]}
          idField="pk_materiaID"
          onActivate={handleActivateMateria}
          onClose={() => setShowDesativados(false)}
        />
      )}
    </div>
  );
}

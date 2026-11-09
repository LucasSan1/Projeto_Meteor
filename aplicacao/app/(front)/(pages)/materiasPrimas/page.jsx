"use client";

import { useEffect, useState } from "react";

import Header from "../../components/Header";
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
    {
      name: "dataUltimaCompra",
      label: "Data da Última Compra",
      type: "date",
    },
  ];

  // Saldo inicial só no cadastro, Depois disso, o saldo dança conforme as movimentações de estoque
  const camposCriacao = [
    ...materiaFields.slice(0, 4),
    {
      name: "quantidadeEstoque",
      label: "Quantidade em Estoque Inicial",
      type: "number",
      step: "0.001",
    },
    materiaFields[4],
  ];

  const camposEdicao = materiaFields;

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

  function abrirEntradaEstoque(materia) {
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
    return <p className="p-6">Carregando matérias-primas...</p>;
  }

  const ativas = materias.filter((m) => m.status === "Ativo");
  const inativas = materias.filter((m) => m.status === "Desativado");

  return (
    <div className="min-h-screen bg-[#F9F7F4] flex flex-col">
      <Header />

      <div className="p-6 flex flex-col gap-6">
        <div className="flex justify-end">
          <button
            onClick={() => setShowDesativados(true)}
            className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700"
          >
            Mostrar desativadas
          </button>
        </div>

        {ativas.length === 0 ? (
          <p className="text-gray-500 text-center">
            Nenhuma matéria-prima ativa encontrada
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {ativas.map((materia) => {
              const estoqueBaixo =
                Number(materia.quantidadeEstoque) <=
                Number(materia.estoqueMinimo);

              return (
                <Card key={materia.pk_materiaID} title={materia.materia}>
                  <p className="text-sm text-black">
                    Fornecedor: {materia.fornecedor}
                  </p>

                  <p className="text-sm text-black">
                    Unidade: {materia.unidadeMedida}
                  </p>

                  <p className="text-sm text-black">
                    Estoque: {materia.quantidadeEstoque} / mínimo{" "}
                    {materia.estoqueMinimo}
                  </p>

                  {estoqueBaixo && (
                    <p className="text-sm text-red-600 font-semibold">
                      Estoque abaixo do mínimo!
                    </p>
                  )}

                  <p className="text-sm text-black">
                    Última compra: {formatData(materia.dataUltimaCompra)}
                  </p>

                  <p className="text-sm text-black">Status: {materia.status}</p>

                  <div className="flex gap-2 mt-3 flex-wrap">
                    <button
                      onClick={() => abrirEntradaEstoque(materia)}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Adicionar ao Estoque
                    </button>

                    <button
                      onClick={() => abrirEdicao(materia)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => handleDeleteMateria(materia)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
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

      <button
        onClick={() => setModalAddOpen(true)}
        className="
          fixed
          bottom-6
          right-6
          w-14
          h-14
          bg-green-600
          text-white
          text-2xl
          rounded-full
          shadow-lg
          hover:bg-green-700
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

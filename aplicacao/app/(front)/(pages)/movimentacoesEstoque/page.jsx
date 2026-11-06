"use client";

import { useEffect, useState } from "react";

import Header from "../../components/Header";
import Card from "../../components/Card";
import ModalIncluir from "../../components/modalIncluir";
import { formatDataHora } from "../../../utils/Datetime";

import Swal from "sweetalert2";

import {
  getMovimentacoes,
  createMovimentacao,
  updateMovimentacao,
  deleteMovimentacao,
} from "../../services/movimentacaoService";

import { getMateriasPrimas } from "../../services/materiaPrimaService";

export default function MovimentacoesEstoque() {
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalAddOpen, setModalAddOpen] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(false);

  const [movimentacaoSelecionada, setMovimentacaoSelecionada] = useState(null);

  // Entrada é a única movimentação manual, Saída nasce da conclusão da ordem 
  const camposMovimentacao = [
    {
      name: "quantidade",
      label: "Quantidade",
      type: "number",
      step: "0.001",
    },
    {
      name: "unidadeMedida",
      label: "Unidade de Medida",
      type: "text",
    },
    {
      name: "observacao",
      label: "Observação",
      type: "textarea",
    },
  ];

  const camposCriacao = [
    {
      name: "materia",
      label: "Matéria-prima",
      type: "select",
      options: materias,
    },
    ...camposMovimentacao,
  ];

  async function carregar() {
    try {
      const [movRes, materiasRes] = await Promise.all([
        getMovimentacoes(),
        getMateriasPrimas(),
      ]);

      if (movRes) setMovimentacoes(movRes.data);

      if (materiasRes) {
        setMaterias(
          materiasRes.data
            .filter((m) => m.status === "Ativo")
            .map((m) => ({
              value: m.pk_materiaID,
              label: `${m.materia} (${m.unidadeMedida})`,
            })),
        );
      }
    } catch (err) {
      console.error("Erro ao carregar movimentações:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleCreate(data) {
    try {
      const response = await createMovimentacao({
        ...data,
        tipo: "Entrada",
      });

      if (!response) return;

      setModalAddOpen(false);

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Entrada registrada!",
        showConfirmButton: false,
        timer: 2500,
      });

      await carregar();
    } catch (err) {
      console.error("Erro ao criar movimentação:", err);
    }
  }

  async function handleEdit(data) {
    try {
      const response = await updateMovimentacao(
        movimentacaoSelecionada.pk_movimentacaoID,
        data,
      );

      if (!response) return;

      setModalEditOpen(false);
      setMovimentacaoSelecionada(null);

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Movimentação atualizada!",
        showConfirmButton: false,
        timer: 2500,
      });

      await carregar();
    } catch (err) {
      console.error("Erro ao editar movimentação:", err);
    }
  }

  async function handleDelete(movimentacao) {
    const result = await Swal.fire({
      title: "Excluir movimentação?",
      text: "O saldo do estoque será ajustado de volta.",
      icon: "warning",

      showCancelButton: true,

      confirmButtonText: "Sim, excluir",
      cancelButtonText: "Cancelar",

      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await deleteMovimentacao(
        movimentacao.pk_movimentacaoID,
      );

      if (!response) return;

      await carregar();

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Movimentação excluída!",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (err) {
      console.error("Erro ao excluir movimentação:", err);
    }
  }

  function abrirEdicao(movimentacao) {
    setMovimentacaoSelecionada(movimentacao);
    setModalEditOpen(true);
  }

  if (loading) {
    return <p className="p-6">Carregando movimentações...</p>;
  }

  return (
    <div className="min-h-screen bg-[#F9F7F4] flex flex-col">
      <Header />

      <div className="p-6 flex flex-col gap-6">
        <p className="text-sm text-gray-600">
          Entradas são lançadas manualmente pelo gestor. As saídas são geradas
          automaticamente na conclusão das ordens de produção.
        </p>

        {movimentacoes.length === 0 ? (
          <p className="text-gray-500 text-center">
            Nenhuma movimentação registrada
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {movimentacoes.map((mov) => {
              const automatica = Boolean(mov.fk_ordemID);

              return (
                <Card
                  key={mov.pk_movimentacaoID}
                  title={`${mov.tipo} - ${mov.materia}`}
                >
                  <p className="text-sm text-black">
                    Quantidade: {mov.quantidade} {mov.unidadeMedida}
                  </p>

                  <p className="text-sm text-black">
                    Responsável: {mov.usuario}
                  </p>

                  <p className="text-sm text-black">
                    Ordem: {mov.ordem || "-"}
                  </p>

                  <p className="text-sm text-black">
                    Data: {formatDataHora(mov.dataMovimentacao)}
                  </p>

                  <p className="text-sm text-black">
                    Observação: {mov.observacao || "-"}
                  </p>

                  {automatica && (
                    <p className="text-sm text-amber-700 font-semibold">
                      Saída: somente leitura
                    </p>
                  )}

                  {!automatica && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <button
                        onClick={() => abrirEdicao(mov)}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => handleDelete(mov)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Excluir
                      </button>
                    </div>
                  )}
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
          title="Nova Entrada de Estoque"
          fields={camposCriacao}
          onSubmit={handleCreate}
          onClose={() => setModalAddOpen(false)}
        />
      )}

      {modalEditOpen && movimentacaoSelecionada && (
        <ModalIncluir
          title="Editar Entrada"
          fields={camposMovimentacao}
          initialData={movimentacaoSelecionada}
          onSubmit={handleEdit}
          onClose={() => {
            setModalEditOpen(false);
            setMovimentacaoSelecionada(null);
          }}
        />
      )}
    </div>
  );
}

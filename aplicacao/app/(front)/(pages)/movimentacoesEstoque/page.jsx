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
import { getUsuarios } from "../../services/usuarioService";
import { getOrdens } from "../../services/orderService";

export default function MovimentacoesEstoque() {
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalAddOpen, setModalAddOpen] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(false);

  const [movimentacaoSelecionada, setMovimentacaoSelecionada] = useState(null);

  const camposMovimentacao = [
    {
      name: "tipo",
      label: "Tipo",
      type: "select",
      options: [
        { value: "Entrada", label: "Entrada" },
        { value: "Saida", label: "Saída" },
      ],
    },
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
      name: "usuario",
      label: "Responsável",
      type: "select",
      options: usuarios,
    },
    {
      name: "ordem",
      label: "Ordem de Produção (obrigatória na saída)",
      type: "select",
      options: [
        { value: "", label: "Sem ordem (entrada manual)" },
        ...ordens,
      ],
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
      const [movRes, materiasRes, usuariosRes, ordensRes] = await Promise.all([
        getMovimentacoes(),
        getMateriasPrimas(),
        getUsuarios(),
        getOrdens(),
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

      if (usuariosRes) {
        setUsuarios(
          usuariosRes.data
            .filter((u) => u.status === "Ativo")
            .map((u) => ({
              value: u.id,
              label: u.nome,
            })),
        );
      }

      if (ordensRes) {
        setOrdens(
          ordensRes.data
            .filter((o) => o.status !== "Cancelada")
            .map((o) => ({
              value: o.pk_ordemID,
              label: `${o.codigo} - ${o.nomePeca}`,
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
      const response = await createMovimentacao(data);

      if (!response) return;

      setModalAddOpen(false);

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Movimentação registrada!",
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
    setMovimentacaoSelecionada({
      ...movimentacao,
      usuario: movimentacao.fk_usuarioID,
      ordem: movimentacao.fk_ordemID || "",
    });
    setModalEditOpen(true);
  }

  if (loading) {
    return <p className="p-6">Carregando movimentações...</p>;
  }

  return (
    <div className="min-h-screen bg-[#F9F7F4] flex flex-col">
      <Header />

      <div className="p-6 flex flex-col gap-6">
        {movimentacoes.length === 0 ? (
          <p className="text-gray-500 text-center">
            Nenhuma movimentação registrada
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {movimentacoes.map((mov) => (
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
              </Card>
            ))}
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
          title="Nova Movimentação de Estoque"
          fields={camposCriacao}
          onSubmit={handleCreate}
          onClose={() => setModalAddOpen(false)}
        />
      )}

      {modalEditOpen && movimentacaoSelecionada && (
        <ModalIncluir
          title="Editar Movimentação"
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

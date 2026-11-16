"use client";

import { useEffect, useState } from "react";

import Header from "../../components/Header";
import PageTitle from "../../components/pageTitle";
import Card from "../../components/Card";
import ModalIncluir from "../../components/modalIncluir";
import { formatDataHora } from "../../../utils/Datetime";

import Swal from "sweetalert2";

import {
  getRejeicoes,
  createRejeicao,
  updateRejeicao,
  deleteRejeicao,
} from "../../services/rejeicaoService";

import { getInspecoes } from "../../services/inspecaoService";

export default function Rejeicoes() {
  const [rejeicoes, setRejeicoes] = useState([]);
  const [inspecoes, setInspecoes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalAddOpen, setModalAddOpen] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(false);

  const [rejeicaoSelecionada, setRejeicaoSelecionada] = useState(null);

  const camposRejeicao = [
    {
      name: "quantidade",
      label: "Quantidade",
      type: "number",
    },
    {
      name: "motivoRejeicao",
      label: "Motivo da Rejeição",
      type: "text",
    },
    {
      name: "tipo",
      label: "Tipo",
      type: "select",
      options: [
        { value: "Retrabalho", label: "Retrabalho" },
        { value: "Perda", label: "Perda" },
      ],
    },
    {
      name: "acoesCorretivas",
      label: "Ações Corretivas",
      type: "textarea",
    },
  ];

  async function carregar() {
    try {
      const [rejeicoesRes, inspecoesRes] = await Promise.all([
        getRejeicoes(),
        getInspecoes(),
      ]);

      if (rejeicoesRes) setRejeicoes(rejeicoesRes.data);
      if (inspecoesRes) setInspecoes(inspecoesRes.data);
    } catch (err) {
      console.error("Erro ao carregar rejeições:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function totalRejeitadoUsado(inspecaoID) {
    return rejeicoes
      .filter((r) => r.fk_inspecaoID === inspecaoID)
      .reduce((total, r) => total + Number(r.quantidade), 0);
  }

  // Só mostra inspeções que ainda têm quantidade rejeitada sobrando
  const inspecoesDisponiveis = inspecoes
    .filter(
      (i) => totalRejeitadoUsado(i.pk_inspecaoID) < Number(i.rejeitadas),
    )
    .map((i) => ({
      value: i.pk_inspecaoID,
      label: `${i.ordem} - ${i.peca} (${i.rejeitadas} rejeitadas)`,
    }));

  const camposCriacao = [
    {
      name: "inspecao",
      label: "Inspeção",
      type: "select",
      options: inspecoesDisponiveis,
    },
    ...camposRejeicao,
  ];

  async function handleCreate(data) {
    try {
      const payload = {
        inspecao: Number(data.inspecao),
        quantidade: Number(data.quantidade),
        motivoRejeicao: data.motivoRejeicao,
        tipo: data.tipo,
        acoesCorretivas: data.acoesCorretivas,
      };

      const response = await createRejeicao(payload);

      if (!response) return;

      setModalAddOpen(false);

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Rejeição registrada!",
        showConfirmButton: false,
        timer: 2500,
      });

      await carregar();
    } catch (err) {
      console.error("Erro ao criar rejeição:", err);
    }
  }

  async function handleEdit(data) {
    try {
      const payload = {
        ...data,
        quantidade: Number(data.quantidade),
      };

      const response = await updateRejeicao(
        rejeicaoSelecionada.pk_rejeicaoID,
        payload,
      );

      if (!response) return;

      setModalEditOpen(false);
      setRejeicaoSelecionada(null);

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Rejeição atualizada!",
        showConfirmButton: false,
        timer: 2500,
      });

      await carregar();
    } catch (err) {
      console.error("Erro ao editar rejeição:", err);
    }
  }

  async function handleConcluir(rejeicao) {
    const result = await Swal.fire({
      title: "Concluir retrabalho?",
      text: `Marcar o retrabalho da ordem ${rejeicao.ordem} como concluído?`,
      icon: "question",

      showCancelButton: true,

      confirmButtonText: "Sim, concluir",
      cancelButtonText: "Cancelar",

      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await updateRejeicao(rejeicao.pk_rejeicaoID, {
        status: "Concluído",
      });

      if (!response) return;

      await carregar();

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Retrabalho concluído!",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (err) {
      console.error("Erro ao concluir retrabalho:", err);
    }
  }

  async function handleDelete(rejeicao) {
    const result = await Swal.fire({
      title: "Excluir rejeição?",
      text: `Excluir a rejeição da ordem ${rejeicao.ordem}?`,
      icon: "warning",

      showCancelButton: true,

      confirmButtonText: "Sim, excluir",
      cancelButtonText: "Cancelar",

      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await deleteRejeicao(rejeicao.pk_rejeicaoID);

      if (!response) return;

      await carregar();

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Rejeição excluída!",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (err) {
      console.error("Erro ao excluir rejeição:", err);
    }
  }

  if (loading) {
    return <p className="p-6 text-[#697385]">Carregando rejeições...</p>;
  }

  return (
    <div className="min-h-screen bg-[#EBECF7] flex flex-col">
      <Header />

      <div className="w-full max-w-6xl mx-auto p-4 md:p-6 flex flex-col gap-6">
        <PageTitle title="Rejeições" subtitle="Perdas e retrabalhos registrados" />

        {rejeicoes.length === 0 ? (
          <p className="text-[#697385] text-center">
            Nenhuma rejeição registrada
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {rejeicoes.map((rejeicao) => (
              <Card
                key={rejeicao.pk_rejeicaoID}
                title={`${rejeicao.ordem} - ${rejeicao.peca}`}
              >
                <p className="text-sm text-[#334E7F]">
                  Quantidade: {rejeicao.quantidade}
                </p>

                <p className="text-sm text-[#334E7F]">
                  Motivo: {rejeicao.motivoRejeicao}
                </p>

                <p className="text-sm text-[#334E7F]">Tipo: {rejeicao.tipo}</p>

                <p className="text-sm text-[#334E7F]">
                  Ações corretivas: {rejeicao.acoesCorretivas || "-"}
                </p>

                <p className="text-sm text-[#334E7F]">
                  Data: {formatDataHora(rejeicao.dataRejeicao)}
                </p>

                {/* Perda é definitiva e retrabalho concluído vira histórico */}
                {rejeicao.tipo === "Retrabalho" && (
                  <p className="text-sm text-[#334E7F]">
                    Status: {rejeicao.status || "Pendente"}
                  </p>
                )}

                {rejeicao.tipo === "Retrabalho" &&
                  rejeicao.status !== "Concluído" && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <button
                        onClick={() => {
                          setRejeicaoSelecionada(rejeicao);
                          setModalEditOpen(true);
                        }}
                        className="bg-[#334E7F] text-white px-3 py-1 rounded font-semibold transition-colors hover:bg-[#28406b]"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => handleDelete(rejeicao)}
                        className="bg-[#C94545] text-white px-3 py-1 rounded font-semibold transition-colors hover:bg-[#AD3A3A]"
                      >
                        Excluir
                      </button>

                      <button
                        onClick={() => handleConcluir(rejeicao)}
                        className="bg-[#2E9B5E] text-white px-3 py-1 rounded font-semibold transition-colors hover:bg-[#27844F]"
                      >
                        Concluir Retrabalho
                      </button>
                    </div>
                  )}
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
          title="Nova Rejeição"
          fields={camposCriacao}
          onSubmit={handleCreate}
          onClose={() => setModalAddOpen(false)}
        />
      )}

      {modalEditOpen && rejeicaoSelecionada && (
        <ModalIncluir
          title="Editar Rejeição"
          fields={camposRejeicao}
          initialData={rejeicaoSelecionada}
          onSubmit={handleEdit}
          onClose={() => {
            setModalEditOpen(false);
            setRejeicaoSelecionada(null);
          }}
        />
      )}
    </div>
  );
}

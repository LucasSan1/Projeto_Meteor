"use client";

import { useEffect, useState } from "react";

import Header from "../../components/Header";
import Card from "../../components/Card";
import ModalIncluir from "../../components/modalIncluir";
import { formatDataHora } from "../../../utils/Datetime";

import Swal from "sweetalert2";

import {
  getInspecoes,
  createInspecao,
  updateInspecao,
  deleteInspecao,
} from "../../services/inspecaoService";

import { getOrdens } from "../../services/orderService";

export default function Inspecoes() {
  const [inspecoes, setInspecoes] = useState([]);
  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalAddOpen, setModalAddOpen] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(false);

  const [inspecaoSelecionada, setInspecaoSelecionada] = useState(null);

  const camposInspecao = [
    {
      name: "totalProduzido",
      label: "Total Produzido",
      type: "number",
    },
    {
      name: "aprovadas",
      label: "Aprovadas",
      type: "number",
    },
    {
      name: "rejeitadas",
      label: "Rejeitadas",
      type: "number",
    },
    {
      name: "observacoes",
      label: "Observações",
      type: "textarea",
    },
  ];

  async function carregar() {
    try {
      const [inspecoesRes, ordensRes] = await Promise.all([
        getInspecoes(),
        getOrdens(),
      ]);

      if (inspecoesRes) setInspecoes(inspecoesRes.data);

      if (ordensRes) {
        setOrdens(ordensRes.data);
      }
    } catch (err) {
      console.error("Erro ao carregar inspeções:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  // Só podem ser inspecionadas ordens concluídas que ainda não têm inspeção
  const ordensDisponiveis = ordens
    .filter(
      (o) =>
        o.status === "Concluída" &&
        !inspecoes.some((i) => i.fk_ordemID === o.pk_ordemID),
    )
    .map((o) => ({
      value: o.pk_ordemID,
      label: `${o.codigo} - ${o.nomePeca}`,
    }));

  const camposCriacao = [
    {
      name: "ordem",
      label: "Ordem Concluída",
      type: "select",
      options: ordensDisponiveis,
    },
    ...camposInspecao,
  ];

  async function handleCreate(data) {
    try {
      const payload = {
        ordem: Number(data.ordem),
        totalProduzido: Number(data.totalProduzido),
        aprovadas: Number(data.aprovadas || 0),
        rejeitadas: Number(data.rejeitadas || 0),
        observacoes: data.observacoes,
      };

      const response = await createInspecao(payload);

      if (!response) return;

      setModalAddOpen(false);

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Inspeção registrada!",
        showConfirmButton: false,
        timer: 2500,
      });

      await carregar();
    } catch (err) {
      console.error("Erro ao criar inspeção:", err);
    }
  }

  async function handleEdit(data) {
    try {
      const payload = {
        ...data,
        totalProduzido: Number(data.totalProduzido),
        aprovadas: Number(data.aprovadas),
        rejeitadas: Number(data.rejeitadas),
      };

      const response = await updateInspecao(
        inspecaoSelecionada.pk_inspecaoID,
        payload,
      );

      if (!response) return;

      setModalEditOpen(false);
      setInspecaoSelecionada(null);

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Inspeção atualizada!",
        showConfirmButton: false,
        timer: 2500,
      });

      await carregar();
    } catch (err) {
      console.error("Erro ao editar inspeção:", err);
    }
  }

  async function handleDelete(inspecao) {
    const result = await Swal.fire({
      title: "Excluir inspeção?",
      text: `Excluir a inspeção da ordem ${inspecao.ordem}?`,
      icon: "warning",

      showCancelButton: true,

      confirmButtonText: "Sim, excluir",
      cancelButtonText: "Cancelar",

      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await deleteInspecao(inspecao.pk_inspecaoID);

      if (!response) return;

      await carregar();

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Inspeção excluída!",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (err) {
      console.error("Erro ao excluir inspeção:", err);
    }
  }

  if (loading) {
    return <p className="p-6">Carregando inspeções...</p>;
  }

  return (
    <div className="min-h-screen bg-[#F9F7F4] flex flex-col">
      <Header />

      <div className="p-6 flex flex-col gap-6">
        {inspecoes.length === 0 ? (
          <p className="text-gray-500 text-center">
            Nenhuma inspeção registrada
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {inspecoes.map((inspecao) => (
              <Card
                key={inspecao.pk_inspecaoID}
                title={`${inspecao.ordem} - ${inspecao.peca}`}
              >
                <p className="text-sm text-black">
                  Total produzido: {inspecao.totalProduzido}
                </p>

                <p className="text-sm text-black">
                  Aprovadas: {inspecao.aprovadas}
                </p>

                <p className="text-sm text-black">
                  Rejeitadas: {inspecao.rejeitadas}
                </p>

                <p className="text-sm text-black">
                  Data: {formatDataHora(inspecao.dataInspecao)}
                </p>

                <p className="text-sm text-black">
                  Observações: {inspecao.observacoes || "-"}
                </p>

                <div className="flex gap-2 mt-3 flex-wrap">
                  <button
                    onClick={() => {
                      setInspecaoSelecionada(inspecao);
                      setModalEditOpen(true);
                    }}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => handleDelete(inspecao)}
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
          title="Nova Inspeção"
          fields={camposCriacao}
          onSubmit={handleCreate}
          onClose={() => setModalAddOpen(false)}
        />
      )}

      {modalEditOpen && inspecaoSelecionada && (
        <ModalIncluir
          title="Editar Inspeção"
          fields={camposInspecao}
          initialData={inspecaoSelecionada}
          onSubmit={handleEdit}
          onClose={() => {
            setModalEditOpen(false);
            setInspecaoSelecionada(null);
          }}
        />
      )}
    </div>
  );
}

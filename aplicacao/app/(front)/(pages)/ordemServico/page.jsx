"use client";

import { useEffect, useState } from "react";

import Header from "../../components/Header";
import Card from "../../components/Card";
import ModalStatus from "../../components/modalStatus";
import ModalIncluir from "../../components/modalIncluir";
import Swal from "sweetalert2";

import {
  getOrdens,
  updateStatusOrdem,
  createOrdem,
  getPecas,
} from "../../services/orderService";

export default function OrdemServico() {
  const [ordens, setOrdens] = useState([]);
  const [pecas, setPecas] = useState([]);
  const [loading, setLoading] = useState(true);

  // MODAL STATUS
  const [modalStatusOpen, setModalStatusOpen] = useState(false);
  const [ordemStatusSelecionada, setOrdemStatusSelecionada] = useState(null);

  // MODAL INCLUIR
  const [modalAddOpen, setModalAddOpen] = useState(false);

  // Status disponiveis para o select
  const statusOptions = ["Pendente", "Em Produção", "Pronto", "Cancelado"];

  // Campos da modal de novas ordens
  const ordemFields = [
    {
      name: "pecaID",
      label: "Peça",
      type: "select",
      options: pecas,
    },

    {
      name: "quantidade",
      label: "Quantidade",
      type: "number",
    },
  ];

  async function carregar() {
    try {
      const [ordensRes, pecasRes] = await Promise.all([
        getOrdens(),
        getPecas(),
      ]);

      // ordens
      if (ordensRes) {
        setOrdens(ordensRes.data);
      }

      // Select de peças
      if (pecasRes) {
        const options = pecasRes.data.map((p) => ({
          value: p.pk_pecaID,
          label: p.peca,
        }));

        setPecas(options);
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  // ABRIR MODAL STATUS
  function abrirModalStatus(ordem) {
    setOrdemStatusSelecionada(ordem);
    setModalStatusOpen(true);
  }

  // Popup para confirmar mudança de status
  async function confirmarStatus(payload) {
    try {
      const result = await Swal.fire({
        title: "Confirmar alteração?",
        text: `Deseja mudar o status para "${payload.status}"?`,
        icon: "question",

        showCancelButton: true,

        confirmButtonText: "Sim, alterar",
        cancelButtonText: "Cancelar",

        confirmButtonColor: "#eab308",
        cancelButtonColor: "#6b7280",
      });

      if (!result.isConfirmed) {
        return;
      }

      await updateStatusOrdem(payload.id, payload.status);

      // Fecha modal
      setModalStatusOpen(false);

      Swal.fire({
        toast: true,
        position: "top-end",

        icon: "success",
        title: "Status atualizado!",

        showConfirmButton: false,
        timer: 2000,
      });

      await carregar();
    } catch (err) {
      console.error("Erro ao atualizar status:", err);

      Swal.fire({
        icon: "error",
        title: "Erro ao atualizar status",
        text: "Não foi possível alterar o status.",
      });
    }
  }

  // Função para criar nova ordem
  async function handleCreateOrdem(data) {
    try {
      const payload = {
        pecaID: Number(data.pecaID),
        quantidade: Number(data.quantidade),
      };

      await createOrdem(payload);

      setModalAddOpen(false);

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Ordem criada com sucesso!",
        showConfirmButton: false,
        timer: 2500,
      });

      await carregar();
    } catch (err) {
      console.error("Erro ao criar ordem:", err);

      Swal.fire({
        icon: "error",
        title: "Erro ao criar ordem",
        text: "Não foi possível cadastrar a ordem.",
        confirmButtonColor: "#dc2626",
      });
    }
  }

  if (loading) {
    return <p className="p-6">Carregando ordens...</p>;
  }

  // Filtros
  const pendentes = ordens.filter((o) => o.status === "Pendente");
  const emProgresso = ordens.filter((o) => o.status === "Em Produção");
  const prontas = ordens.filter((o) => o.status === "Pronto");
  const canceladas = ordens.filter((o) => o.status === "Cancelado");

  return (
    <div className="min-h-screen bg-[#F9F7F4] flex flex-col">
      <Header />

      <div className="p-6 flex flex-col gap-8">
        <Section
          title="Ordens Pendentes"
          ordens={pendentes}
          onStatus={abrirModalStatus}
        />

        <Section
          title="Ordens em Produção"
          ordens={emProgresso}
          onStatus={abrirModalStatus}
        />

        <Section
          title="Ordens Prontas"
          ordens={prontas}
          onStatus={abrirModalStatus}
        />

        <Section
          title="Ordens Canceladas"
          ordens={canceladas}
          onStatus={abrirModalStatus}
        />
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

      {/* RENDER MODAL STATUS */}
      {modalStatusOpen && (
        <ModalStatus
          ordem={ordemStatusSelecionada}
          statusOptions={statusOptions}
          onClose={() => setModalStatusOpen(false)}
          onConfirm={confirmarStatus}
        />
      )}

      {/* RENDER MODAL INCLUIR */}
      {modalAddOpen && (
        <ModalIncluir
          title="Nova Ordem de Produção"
          fields={ordemFields}
          onSubmit={handleCreateOrdem}
          onClose={() => setModalAddOpen(false)}
        />
      )}
    </div>
  );
}

// Componente Sections (basicamente os cards)
function Section({ title, ordens, onStatus }) {
  const [open, setOpen] = useState(true);

  if (ordens.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <h2 className="text-xl font-bold text-[#4E342E]">{title}</h2>

        <span className="text-lg text-black">{open ? "-" : "+"}</span>
      </div>

      {/* CONTEÚDO */}
      {open && (
        <div className="flex flex-col gap-4">
          {ordens.map((ordem) => (
            <Card key={ordem.pk_ordemID} title={`Ordem #${ordem.pk_ordemID}`}>
              <p className="text-sm text-black">Peça: {ordem.peca}</p>

              <p className="text-sm text-black">
                Quantidade: {ordem.quantidade}
              </p>

              <p className="text-sm text-black">Status: {ordem.status}</p>

              <p className="text-sm text-black">
                Início: {new Date(ordem.dataInicio).toLocaleDateString("pt-BR")}
              </p>

              {(ordem.status === "Pronto" || ordem.status === "Cancelado") &&
                ordem.dataConclusao && (
                  <p className="text-sm text-black">
                    Conclusão:{" "}
                    {new Date(ordem.dataConclusao).toLocaleDateString("pt-BR")}
                  </p>
                )}

              <div className="flex gap-2 mt-3 flex-wrap">
                <button
                  onClick={() => onStatus(ordem)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                >
                  Mudar Status
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

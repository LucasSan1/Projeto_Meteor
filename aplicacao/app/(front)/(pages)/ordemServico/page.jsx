"use client";

import { useEffect, useState } from "react";

import Header from "../../components/Header";
import Card from "../../components/Card";
import ModalStatus from "../../components/modalStatus";
import ModalIncluir from "../../components/modalIncluir";
import ModalDesativados from "../../components/modalDesativados";
import { formatData } from "../../../utils/Datetime";

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

  // MODAIS
  const [modalStatusOpen, setModalStatusOpen] = useState(false);
  const [ordemStatusSelecionada, setOrdemStatusSelecionada] = useState(null);

  const [modalAddOpen, setModalAddOpen] = useState(false);
  const [showProntas, setShowProntas] = useState(false);
  const [showCanceladas, setShowCanceladas] = useState(false);

  // Status disponíveis
  const statusOptions = ["Pendente", "Em Produção", "Pronto", "Cancelado"];

  // Campos modal ordem
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

      if (ordensRes) {
        setOrdens(ordensRes.data);
      }

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

  function abrirModalStatus(ordem) {
    setOrdemStatusSelecionada(ordem);
    setModalStatusOpen(true);
  }

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

      if (!result.isConfirmed) return;

      await updateStatusOrdem(payload.id, payload.status);

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
      });
    }
  }

  if (loading) {
    return <p className="p-6">Carregando ordens...</p>;
  }

  // FILTROS
  const pendentes = ordens
    .filter((o) => o.status === "Pendente")
    .sort((a, b) => new Date(a.dataInicio) - new Date(b.dataInicio));
  const emProgresso = ordens
    .filter((o) => o.status === "Em Produção")
    .sort((a, b) => new Date(a.dataInicio) - new Date(b.dataInicio));
  const prontas = ordens
    .filter((o) => o.status === "Pronto")
    .sort((a, b) => new Date(b.dataConclusao) - new Date(a.dataConclusao));
  const canceladas = ordens
    .filter((o) => o.status === "Cancelado")
    .sort((a, b) => new Date(b.dataConclusao) - new Date(a.dataConclusao));

  return (
    <div className="min-h-screen bg-[#F9F7F4] flex flex-col">
      <Header />

      <div className="p-6 flex flex-col gap-6">
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setShowProntas(true)}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Ver Prontas
          </button>

          <button
            onClick={() => setShowCanceladas(true)}
            className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700"
          >
            Ver Canceladas
          </button>
        </div>

        <Section
          title="Ordens Pendentes"
          ordens={pendentes}
          onStatus={abrirModalStatus}
          allowStatusChange={true}
        />

        <Section
          title="Ordens em Produção"
          ordens={emProgresso}
          onStatus={abrirModalStatus}
          allowStatusChange={true}
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

      {modalStatusOpen && (
        <ModalStatus
          ordem={ordemStatusSelecionada}
          statusOptions={statusOptions}
          onClose={() => setModalStatusOpen(false)}
          onConfirm={confirmarStatus}
        />
      )}

      {modalAddOpen && (
        <ModalIncluir
          title="Nova Ordem de Produção"
          fields={ordemFields}
          onSubmit={handleCreateOrdem}
          onClose={() => setModalAddOpen(false)}
        />
      )}

      {showProntas && (
        <ModalDesativados
          title="Ordens Prontas"
          items={prontas}
          displayFields={[
            {
              label: "Peça",
              value: "nomePeca",
            },
            {
              label: "Quantidade",
              value: "quantidade",
            },
            {
              label: "Início",
              value: "dataInicio",
              type: "date",
            },
            {
              label: "Conclusão",
              value: "dataConclusao",
              type: "date",
            },
          ]}
          showActivateButton={false}
          idField="pk_ordemID"
          onActivate={() => {}}
          onClose={() => setShowProntas(false)}
        />
      )}

      {showCanceladas && (
        <ModalDesativados
          title="Ordens Canceladas"
          items={canceladas}
          displayFields={[
            {
              label: "Peça",
              value: "nomePeca",
            },
            {
              label: "Quantidade",
              value: "quantidade",
            },
            {
              label: "Início",
              value: "dataInicio",
              type: "date",
            },
            {
              label: "Conclusão",
              value: "dataConclusao",
              type: "date",
            },
          ]}
          showActivateButton={false}
          idField="pk_ordemID"
          onActivate={() => {}}
          onClose={() => setShowCanceladas(false)}
        />
      )}
    </div>
  );
}

// SECTION
function Section({ title, ordens, onStatus, allowStatusChange }) {
  const [open, setOpen] = useState(true);

  if (ordens.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <h2 className="text-xl font-bold text-[#4E342E]">
          {title} ({ordens.length})
        </h2>

        <span className="text-lg text-black">{open ? "-" : "+"}</span>
      </div>

      {open && (
        <div className="flex flex-col gap-4">
          {ordens.map((ordem) => (
            <Card key={ordem.pk_ordemID} title={`Ordem #${ordem.pk_ordemID}`}>
              <p className="text-sm text-black">Peça: {ordem.nomePeca}</p>

              <p className="text-sm text-black">
                Quantidade: {ordem.quantidade}
              </p>

              <p className="text-sm text-black">Status: {ordem.status}</p>

              <p className="text-sm text-black">
                Início: {formatData(ordem.dataInicio)}
              </p>

              <div className="flex gap-2 mt-3 flex-wrap">
                {allowStatusChange && (
                  <button
                    onClick={() => onStatus(ordem)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                  >
                    Mudar Status
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

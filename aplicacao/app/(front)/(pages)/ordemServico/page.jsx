"use client";

import { useEffect, useState } from "react";

import Header from "../../components/Header";
import Card from "../../components/Card";
import ModalEdicao from "../../components/modalEdicao";
import ModalStatus from "../../components/modalStatus";

import { getOrdens, updateStatusOrdem } from "../../services/orderService";

export default function OrdemServico() {
  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(true);

  // MODAL EDIÇÃO
  const [modalOpen, setModalOpen] = useState(false);

  const [ordemSelecionada, setOrdemSelecionada] = useState(null);

  // MODAL STATUS
  const [modalStatusOpen, setModalStatusOpen] = useState(false);

  const [ordemStatusSelecionada, setOrdemStatusSelecionada] = useState(null);

  // STATUS DISPONÍVEIS
  const statusOptions = ["Pendente", "Em Produção", "Pronto", "Cancelado"];

  async function carregar() {
    try {
      const response = await getOrdens();

      if (response) {
        setOrdens(response.data);
      }
    } catch (err) {
      console.error("Erro ao carregar ordens:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  // ABRIR MODAL EDIÇÃO
  function abrirModal(ordem) {
    setOrdemSelecionada(ordem);
    setModalOpen(true);
  }

  function fecharModal() {
    setModalOpen(false);
    setOrdemSelecionada(null);
  }

  // ABRIR MODAL STATUS
  function abrirModalStatus(ordem) {
    setOrdemStatusSelecionada(ordem);
    setModalStatusOpen(true);
  }

  // CONFIRMAR STATUS
  async function confirmarStatus(payload) {
    try {
      await updateStatusOrdem(payload.id, payload.status);

      setModalStatusOpen(false);

      await carregar();
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    }
  }

  if (loading) {
    return <p className="p-6">Carregando ordens...</p>;
  }

  const emProgresso = ordens.filter((o) => o.status === "Em Produção");

  const pendentes = ordens.filter((o) => o.status === "Pendente");

  const prontas = ordens.filter((o) => o.status === "Pronto");

  const canceladas = ordens.filter((o) => o.status === "Cancelado");

  return (
    <div
      className="
      min-h-screen
      bg-[#F9F7F4]
      flex
      flex-col
    "
    >
      <Header />

      <div
        className="
        p-6
        flex
        flex-col
        gap-8
      "
      >
        <Section
          title="Ordens em Produção"
          ordens={emProgresso}
          onEdit={abrirModal}
          onStatus={abrirModalStatus}
        />

        <Section
          title="Ordens Pendentes"
          ordens={pendentes}
          onEdit={abrirModal}
          onStatus={abrirModalStatus}
        />

        <Section
          title="Ordens Prontas"
          ordens={prontas}
          onEdit={abrirModal}
          onStatus={abrirModalStatus}
        />

        <Section
          title="Ordens Canceladas"
          ordens={canceladas}
          onEdit={abrirModal}
          onStatus={abrirModalStatus}
        />
      </div>

      {/* MODAL EDIÇÃO */}
      {modalOpen && (
        <ModalEdicao
          ordem={ordemSelecionada}
          onClose={fecharModal}
          onSuccess={carregar}
        />
      )}

      {/* MODAL STATUS */}
      {modalStatusOpen && (
        <ModalStatus
          ordem={ordemStatusSelecionada}
          statusOptions={statusOptions}
          onClose={() => setModalStatusOpen(false)}
          onConfirm={confirmarStatus}
        />
      )}
    </div>
  );
}

// COMPONENTE SECTION 
function Section({ title, ordens, onEdit, onStatus }) {
  if (ordens.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <h2
        className="
        text-xl
        font-bold
        text-[#4E342E]
      "
      >
        {title}
      </h2>

      <div
        className="
        flex
        flex-col
        gap-4
      "
      >
        {ordens.map((ordem) => (
          <Card key={ordem.pk_ordemID} title={`Ordem #${ordem.pk_ordemID}`}>
            <p className="text-sm text-black">Peça: {ordem.fk_pecaID}</p>

            <p className="text-sm text-black">Quantidade: {ordem.quantidade}</p>

            <p className="text-sm text-black">Status: {ordem.status}</p>

            <p className="text-sm text-black">
              Início: {new Date(ordem.dataInicio).toLocaleDateString()}
            </p>

            {(ordem.status === "Pronto" || ordem.status === "Cancelado") &&
              ordem.dataConclusao && (
                <p className="text-sm text-black">
                  Conclusão:{" "}
                  {new Date(ordem.dataConclusao).toLocaleDateString()}
                </p>
              )}

            <div
              className="
              flex
              gap-2
              mt-3
              flex-wrap
            "
            >
              <button
                onClick={() => onEdit(ordem)}
                className="
                  bg-blue-500
                  text-white
                  px-3
                  py-1
                  rounded
                  hover:bg-blue-600
                "
              >
                Editar
              </button>

              <button
                onClick={() => onStatus(ordem)}
                className="
                  bg-yellow-500
                  text-white
                  px-3
                  py-1
                  rounded
                  hover:bg-yellow-600
                "
              >
                Mudar Status
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
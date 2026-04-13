"use client";

import { useEffect, useState } from "react";

import Header from "../../components/Header";
import Card from "../../components/Card";
import ModalStatus from "../../components/modalStatus";
import ModalIncluir from "../../components/modalIncluir";

import {
  getOrdens,
  updateStatusOrdem,
  createOrdem
} from "../../services/orderService";

export default function OrdemServico() {

  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(true);

  // MODAL STATUS
  const [modalStatusOpen, setModalStatusOpen] = useState(false);
  const [ordemStatusSelecionada, setOrdemStatusSelecionada] = useState(null);

  // MODAL INCLUIR
  const [modalAddOpen, setModalAddOpen] = useState(false);

  // STATUS DISPONÍVEIS
  const statusOptions = [
    "Pendente",
    "Em Produção",
    "Pronto",
    "Cancelado"
  ];

  // CAMPOS DA ORDEM
  const ordemFields = [

    {
      name: "pecaID",
      label: "ID da Peça",
      type: "number"
    },

    {
      name: "quantidade",
      label: "Quantidade",
      type: "number"
    },

    {
      name: "dataInicio",
      label: "Data de Início",
      type: "date"
    },

    {
      name: "dataConclusao",
      label: "Data de Conclusão",
      type: "date"
    }

  ];

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

  // ABRIR MODAL STATUS
  function abrirModalStatus(ordem) {

    setOrdemStatusSelecionada(ordem);
    setModalStatusOpen(true);

  }

  // CONFIRMAR STATUS
  async function confirmarStatus(payload) {

    try {

      await updateStatusOrdem(
        payload.id,
        payload.status
      );

      setModalStatusOpen(false);

      await carregar();

    } catch (err) {

      console.error(
        "Erro ao atualizar status:",
        err
      );

    }

  }

  // CRIAR NOVA ORDEM
  async function handleCreateOrdem(data) {

    try {

      const payload = {

        ...data,

        dataConclusao:
          data.dataConclusao || null

      };

      await createOrdem(payload);

      setModalAddOpen(false);

      await carregar();

    } catch (err) {

      console.error(
        "Erro ao criar ordem:",
        err
      );

    }

  }

  if (loading) {

    return (
      <p className="p-6">
        Carregando ordens...
      </p>
    );

  }

  const emProgresso =
    ordens.filter(
      (o) => o.status === "Em Produção"
    );

  const pendentes =
    ordens.filter(
      (o) => o.status === "Pendente"
    );

  const prontas =
    ordens.filter(
      (o) => o.status === "Pronto"
    );

  const canceladas =
    ordens.filter(
      (o) => o.status === "Cancelado"
    );

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
          onStatus={abrirModalStatus}
        />

        <Section
          title="Ordens Pendentes"
          ordens={pendentes}
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

      {/* BOTÃO FLUTUANTE */}
      <button
        onClick={() =>
          setModalAddOpen(true)
        }
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

      {/* MODAL STATUS */}
      {modalStatusOpen && (

        <ModalStatus
          ordem={ordemStatusSelecionada}
          statusOptions={statusOptions}
          onClose={() =>
            setModalStatusOpen(false)
          }
          onConfirm={confirmarStatus}
        />

      )}

      {/* MODAL INCLUIR */}
      {modalAddOpen && (

        <ModalIncluir
          title="Nova Ordem de Produção"
          fields={ordemFields}
          onSubmit={handleCreateOrdem}
          onClose={() =>
            setModalAddOpen(false)
          }
        />

      )}

    </div>

  );

}

// COMPONENTE SECTION
function Section({
  title,
  ordens,
  onStatus
}) {

  if (ordens.length === 0)
    return null;

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

          <Card
            key={ordem.pk_ordemID}
            title={`Ordem #${ordem.pk_ordemID}`}
          >

            <p className="text-sm text-black">
              Peça: {ordem.fk_pecaID}
            </p>

            <p className="text-sm text-black">
              Quantidade: {ordem.quantidade}
            </p>

            <p className="text-sm text-black">
              Status: {ordem.status}
            </p>

            <p className="text-sm text-black">
              Início:{" "}
              {new Date(
                ordem.dataInicio
              ).toLocaleDateString("pt-BR")}
            </p>

            {(ordem.status === "Pronto" ||
              ordem.status === "Cancelado") &&
              ordem.dataConclusao && (

                <p className="text-sm text-black">

                  Conclusão:{" "}

                  {new Date(
                    ordem.dataConclusao
                  ).toLocaleDateString("pt-BR")}

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
                onClick={() =>
                  onStatus(ordem)
                }
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
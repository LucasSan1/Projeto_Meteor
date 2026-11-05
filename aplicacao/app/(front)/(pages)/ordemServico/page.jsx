"use client";

import { useEffect, useState } from "react";

import Header from "../../components/Header";
import Card from "../../components/Card";
import ModalStatus from "../../components/modalStatus";
import ModalIncluir from "../../components/modalIncluir";
import ModalDesativados from "../../components/modalDesativados";
import {
  formatDataHora,
  paraInputDatetime,
} from "../../../utils/Datetime";

import Swal from "sweetalert2";

import {
  getOrdens,
  updateStatusOrdem,
  updateOrdem,
  createOrdem,
  getPecas,
} from "../../services/orderService";
import { getProfissionais } from "../../services/profissionalService";

export default function OrdemServico() {
  const [ordens, setOrdens] = useState([]);
  const [pecas, setPecas] = useState([]);
  const [operadores, setOperadores] = useState([]);
  const [loading, setLoading] = useState(true);

  // MODAIS
  const [modalStatusOpen, setModalStatusOpen] = useState(false);
  const [ordemStatusSelecionada, setOrdemStatusSelecionada] = useState(null);

  const [modalAddOpen, setModalAddOpen] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [ordemEditSelecionada, setOrdemEditSelecionada] = useState(null);

  const [showConcluidas, setShowConcluidas] = useState(false);
  const [showCanceladas, setShowCanceladas] = useState(false);

  // Status disponíveis no fluxo novo do DDL
  const statusOptions = ["Pendente", "Em Produção", "Concluída", "Cancelada"];

  // O backend valida o fluxo; aqui só escondemos as opções inválidas
  const transicoesStatus = {
    Pendente: ["Em Produção", "Cancelada"],
    "Em Produção": ["Concluída", "Cancelada"],
    Concluída: [],
    Cancelada: [],
  };

  const opcoesStatusSelecionada = ordemStatusSelecionada
    ? [
        ordemStatusSelecionada.status,
        ...(transicoesStatus[ordemStatusSelecionada.status] || []),
      ]
    : statusOptions;

  // Campos modal ordem
  const ordemFields = [
    {
      name: "codigo",
      label: "Código da Ordem",
      type: "text",
    },
    {
      name: "pecaID",
      label: "Peça",
      type: "select",
      options: pecas,
    },
    {
      name: "quantidadePlanejada",
      label: "Quantidade Planejada",
      type: "number",
    },
    {
      name: "especializacao",
      label: "Especialização Exigida",
      type: "text",
    },
    {
      name: "operadorID",
      label: "Operador",
      type: "select",
      options: operadores,
    },
    {
      name: "inicioPlanejado",
      label: "Início Planejado",
      type: "datetime-local",
    },
    {
      name: "terminoPlanejado",
      label: "Término Planejado",
      type: "datetime-local",
    },
  ];

  async function carregar() {
    try {
      const [ordensRes, pecasRes, profissionaisRes] = await Promise.all([
        getOrdens(),
        getPecas(),
        getProfissionais(),
      ]);

      if (ordensRes) {
        setOrdens(ordensRes.data);
      }

      if (pecasRes) {
        setPecas(
          pecasRes.data
            .filter((p) => p.status === "Ativo")
            .map((p) => ({
              value: p.pk_pecaID,
              label: p.peca,
            })),
        );
      }

      if (profissionaisRes) {
        setOperadores(
          profissionaisRes.data
            .filter((p) => p.status === "Ativo" && p.ehOperador)
            .map((p) => ({
              value: p.pk_profissionalID,
              label: `${p.nome}${p.especializacao ? ` (${p.especializacao})` : ""}`,
            })),
        );
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

      const response = await updateStatusOrdem(payload.id, payload.status);

      if (!response) return;

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
    }
  }

  async function handleCreateOrdem(data) {
    try {
      const payload = {
        ...data,
        pecaID: Number(data.pecaID),
        operadorID: Number(data.operadorID),
        quantidadePlanejada: Number(data.quantidadePlanejada),
      };

      const response = await createOrdem(payload);

      if (!response) return;

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
    }
  }

  async function handleEditOrdem(data) {
    try {
      const payload = {
        ...data,
        pecaID: Number(data.pecaID),
        operadorID: Number(data.operadorID),
        quantidadePlanejada: Number(data.quantidadePlanejada),
      };

      const response = await updateOrdem(
        ordemEditSelecionada.pk_ordemID,
        payload,
      );

      if (!response) return;

      setModalEditOpen(false);
      setOrdemEditSelecionada(null);

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Ordem atualizada!",
        showConfirmButton: false,
        timer: 2500,
      });

      await carregar();
    } catch (err) {
      console.error("Erro ao editar ordem:", err);
    }
  }

  function abrirEdicao(ordem) {
    setOrdemEditSelecionada({
      ...ordem,
      pecaID: ordem.fk_pecaID,
      operadorID: ordem.fk_operadorID,
      inicioPlanejado: paraInputDatetime(ordem.inicioPlanejado),
      terminoPlanejado: paraInputDatetime(ordem.terminoPlanejado),
    });
    setModalEditOpen(true);
  }

  if (loading) {
    return <p className="p-6">Carregando ordens...</p>;
  }

  // FILTROS
  const pendentes = ordens
    .filter((o) => o.status === "Pendente")
    .sort((a, b) => new Date(a.inicioPlanejado) - new Date(b.inicioPlanejado));

  const emProgresso = ordens
    .filter((o) => o.status === "Em Produção")
    .sort((a, b) => new Date(a.inicioPlanejado) - new Date(b.inicioPlanejado));

  const concluidas = ordens
    .filter((o) => o.status === "Concluída")
    .sort((a, b) => new Date(b.conclusaoEfetiva) - new Date(a.conclusaoEfetiva));

  const canceladas = ordens
    .filter((o) => o.status === "Cancelada")
    .sort((a, b) => new Date(b.inicioPlanejado) - new Date(a.inicioPlanejado));

  return (
    <div className="min-h-screen bg-[#F9F7F4] flex flex-col">
      <Header />

      <div className="p-6 flex flex-col gap-6">
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setShowConcluidas(true)}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Ver Concluídas
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
          onEdit={abrirEdicao}
          allowStatusChange={true}
          allowEdit={true}
        />

        <Section
          title="Ordens em Produção"
          ordens={emProgresso}
          onStatus={abrirModalStatus}
          onEdit={abrirEdicao}
          allowStatusChange={true}
          allowEdit={false}
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
          statusOptions={opcoesStatusSelecionada}
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

      {modalEditOpen && ordemEditSelecionada && (
        <ModalIncluir
          title="Editar Ordem de Produção"
          fields={ordemFields}
          initialData={ordemEditSelecionada}
          onSubmit={handleEditOrdem}
          onClose={() => {
            setModalEditOpen(false);
            setOrdemEditSelecionada(null);
          }}
        />
      )}

      {showConcluidas && (
        <ModalDesativados
          title="Ordens Concluídas"
          items={concluidas}
          displayFields={[
            { label: "Código", value: "codigo" },
            { label: "Peça", value: "nomePeca" },
            { label: "Quantidade", value: "quantidadePlanejada" },
            { label: "Operador", value: "operador" },
            { label: "Conclusão", value: "conclusaoEfetiva", type: "datetime" },
          ]}
          showActivateButton={false}
          idField="pk_ordemID"
          onActivate={() => {}}
          onClose={() => setShowConcluidas(false)}
        />
      )}

      {showCanceladas && (
        <ModalDesativados
          title="Ordens Canceladas"
          items={canceladas}
          displayFields={[
            { label: "Código", value: "codigo" },
            { label: "Peça", value: "nomePeca" },
            { label: "Quantidade", value: "quantidadePlanejada" },
            { label: "Operador", value: "operador" },
            { label: "Início Planejado", value: "inicioPlanejado", type: "datetime" },
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
function Section({
  title,
  ordens,
  onStatus,
  onEdit,
  allowStatusChange,
  allowEdit,
}) {
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
            <Card key={ordem.pk_ordemID} title={ordem.codigo}>
              <p className="text-sm text-black">Peça: {ordem.nomePeca}</p>

              <p className="text-sm text-black">
                Quantidade planejada: {ordem.quantidadePlanejada}
              </p>

              <p className="text-sm text-black">
                Especialização: {ordem.especializacao}
              </p>

              <p className="text-sm text-black">
                Operador: {ordem.operador}
              </p>

              <p className="text-sm text-black">
                Início planejado: {formatDataHora(ordem.inicioPlanejado)}
              </p>

              <p className="text-sm text-black">
                Término planejado: {formatDataHora(ordem.terminoPlanejado)}
              </p>

              {ordem.inicioEfetivo && (
                <p className="text-sm text-black">
                  Início efetivo: {formatDataHora(ordem.inicioEfetivo)}
                </p>
              )}

              <p className="text-sm text-black">Status: {ordem.status}</p>

              <div className="flex gap-2 mt-3 flex-wrap">
                {allowStatusChange && (
                  <button
                    onClick={() => onStatus(ordem)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                  >
                    Mudar Status
                  </button>
                )}

                {allowEdit && (
                  <button
                    onClick={() => onEdit(ordem)}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    Editar
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

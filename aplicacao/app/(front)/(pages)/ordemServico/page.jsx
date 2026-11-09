"use client";

import { useEffect, useState } from "react";

import Header from "../../components/Header";
import Card from "../../components/Card";
import ModalStatus from "../../components/modalStatus";
import ModalDesativados from "../../components/modalDesativados";
import ModalOrdemProducao from "../../components/modalOrdemProducao";
import ModalConclusaoProducao from "../../components/modalConclusaoProducao";
import {
  formatData,
  formatDataHora,
  paraInputDate,
} from "../../../utils/Datetime";
import { gerarProximoCodigoOrdem } from "../../../utils/codigoOrdem";

import Swal from "sweetalert2";

import {
  getOrdens,
  updateStatusOrdem,
  updateOrdem,
  createOrdem,
  getPecas,
} from "../../services/orderService";
import { getProfissionais } from "../../services/profissionalService";
import { getMateriasPrimas } from "../../services/materiaPrimaService";

export default function OrdemServico() {
  const [ordens, setOrdens] = useState([]);
  const [pecas, setPecas] = useState([]);
  const [operadores, setOperadores] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cargo, setCargo] = useState(null);

  // MODAIS
  const [modalStatusOpen, setModalStatusOpen] = useState(false);
  const [ordemStatusSelecionada, setOrdemStatusSelecionada] = useState(null);

  const [modalAddOpen, setModalAddOpen] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [modalConclusaoOpen, setModalConclusaoOpen] = useState(false);
  const [ordemEditSelecionada, setOrdemEditSelecionada] = useState(null);

  const [showConcluidas, setShowConcluidas] = useState(false);
  const [showCanceladas, setShowCanceladas] = useState(false);

  // Status disponíveis no fluxo novo do DDL
  const statusOptions = ["Pendente", "Em Produção", "Concluída", "Cancelada"];

  const isGestor = cargo === "gerente";
  const isOperador = cargo === "operador";

  // O backend valida o fluxo; aqui só escondemos as opções inválidas
  // Cancelar só existe a partir de Pendente
  const transicoesGestor = {
    Pendente: ["Em Produção", "Cancelada"],
    "Em Produção": ["Concluída"],
    Concluída: [],
    Cancelada: [],
  };

  const transicoesOperador = {
    Pendente: ["Em Produção"],
    "Em Produção": ["Concluída"],
    Concluída: [],
    Cancelada: [],
  };

  const transicoesStatus = isOperador
    ? transicoesOperador
    : transicoesGestor;

  const opcoesStatusSelecionada = ordemStatusSelecionada
    ? [
        ordemStatusSelecionada.status,
        ...(transicoesStatus[ordemStatusSelecionada.status] || []),
      ]
    : statusOptions;

  async function carregar() {
    try {
      const cargoAtual = localStorage.getItem("cargo");
      const ehGestor = cargoAtual === "gerente";

      const ordensRes = await getOrdens();

      if (ordensRes) {
        setOrdens(ordensRes.data);
      }

      // Só o gestor cria/edita ordem, então só ele precisa dos catálogos
      if (ehGestor) {
        const [pecasRes, profissionaisRes, materiasRes] = await Promise.all([
          getPecas(),
          getProfissionais(),
          getMateriasPrimas(),
        ]);

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

        if (materiasRes) {
          setMaterias(
            materiasRes.data
              .filter((m) => m.status === "Ativo")
              .map((m) => ({
                value: m.pk_materiaID,
                label: `${m.materia} (${m.unidadeMedida}) — disp. ${m.quantidadeEstoque}`,
              })),
          );
        }
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setCargo(localStorage.getItem("cargo"));
    carregar();
  }, []);

  function abrirModalStatus(ordem) {
    setOrdemStatusSelecionada(ordem);
    setModalStatusOpen(true);
  }

  async function confirmarStatus(payload) {
    // Conclusão tem formulário próprio (consumo, produção e qualidade)
    if (payload.status === "Concluída") {
      setModalStatusOpen(false);
      setModalConclusaoOpen(true);
      return;
    }

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

      const response = await updateStatusOrdem(payload.id, payload);

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

  async function handleConcluir(data) {
    try {
      const response = await updateStatusOrdem(
        ordemStatusSelecionada.pk_ordemID,
        data,
      );

      if (!response) return;

      setModalConclusaoOpen(false);
      setOrdemStatusSelecionada(null);

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Ordem concluída e inspeção registrada!",
        showConfirmButton: false,
        timer: 3000,
      });

      await carregar();
    } catch (err) {
      console.error("Erro ao concluir ordem:", err);
    }
  }

  async function handleCreateOrdem(data) {
    try {
      const response = await createOrdem(data);

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
      const response = await updateOrdem(
        ordemEditSelecionada.pk_ordemID,
        data,
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
      inicioPlanejado: paraInputDate(ordem.inicioPlanejado),
      terminoPlanejado: paraInputDate(ordem.terminoPlanejado),
      materiais: ordem.materiais || [],
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

  // O gestor só vê o botão de criar, então a lista completa já basta pro próximo código
  const proximoCodigo = gerarProximoCodigoOrdem(ordens);

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
          allowEdit={isGestor}
          modoOperador={isOperador}
        />

        <Section
          title="Ordens em Produção"
          ordens={emProgresso}
          onStatus={abrirModalStatus}
          onEdit={abrirEdicao}
          allowStatusChange={true}
          allowEdit={false}
          modoOperador={isOperador}
        />
      </div>

      {isGestor && (
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
      )}

      {modalStatusOpen && ordemStatusSelecionada && (
        <ModalStatus
          ordem={ordemStatusSelecionada}
          statusOptions={opcoesStatusSelecionada}
          permitirAntecipacao={isOperador}
          onClose={() => setModalStatusOpen(false)}
          onConfirm={confirmarStatus}
        />
      )}

      {modalConclusaoOpen && ordemStatusSelecionada && (
        <ModalConclusaoProducao
          ordem={ordemStatusSelecionada}
          onClose={() => {
            setModalConclusaoOpen(false);
            setOrdemStatusSelecionada(null);
          }}
          onConfirm={handleConcluir}
        />
      )}

      {modalAddOpen && (
        <ModalOrdemProducao
          title="Nova Ordem de Produção"
          pecas={pecas}
          operadores={operadores}
          materias={materias}
          codigoInicial={proximoCodigo}
          onSubmit={handleCreateOrdem}
          onClose={() => setModalAddOpen(false)}
        />
      )}

      {modalEditOpen && ordemEditSelecionada && (
        <ModalOrdemProducao
          title="Editar Ordem de Produção"
          pecas={pecas}
          operadores={operadores}
          materias={materias}
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
            { label: "Início Planejado", value: "inicioPlanejado", type: "date" },
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
  modoOperador,
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
                Início planejado: {formatData(ordem.inicioPlanejado)}
              </p>

              <p className="text-sm text-black">
                Término planejado: {formatData(ordem.terminoPlanejado)}
              </p>

              {ordem.inicioEfetivo && (
                <p className="text-sm text-black">
                  Início efetivo: {formatDataHora(ordem.inicioEfetivo)}
                </p>
              )}

              <p className="text-sm text-black">Status: {ordem.status}</p>

              {ordem.atrasada && (
                <p className="text-sm text-red-600 font-semibold">
                  {ordem.status === "Pendente"
                    ? "Prazo vencido: reprograme a ordem para poder iniciar."
                    : "Ordem em atraso: conclua quando a execução terminar."}
                </p>
              )}

              {ordem.materiais?.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-semibold text-[#4E342E]">
                    Materiais
                  </p>

                  {ordem.materiais.map((material) => (
                    <p
                      key={material.fk_materiaID}
                      className="text-sm text-black"
                    >
                      {material.materia}: {material.quantidadePrevista}{" "}
                      {material.unidadeMedida}
                      {material.quantidadeConsumida !== null
                        ? ` (consumido: ${material.quantidadeConsumida})`
                        : ""}
                    </p>
                  ))}
                </div>
              )}

              <div className="flex gap-2 mt-3 flex-wrap">
                {allowStatusChange && (
                  <button
                    onClick={() => onStatus(ordem)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                  >
                    {modoOperador
                      ? ordem.status === "Pendente"
                        ? "Iniciar"
                        : "Concluir"
                      : "Mudar Status"}
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

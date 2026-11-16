"use client";

import { useEffect, useState } from "react";

import Header from "../../components/Header";
import PageTitle from "../../components/pageTitle";
import Card from "../../components/Card";
import ModalIncluir from "../../components/modalIncluir";
import ModalDesativados from "../../components/modalDesativados";
import ModalConclusaoManutencao from "../../components/modalConclusaoManutencao";
import {
  formatDataHora,
  paraInputDatetime,
} from "../../../utils/Datetime";

import Swal from "sweetalert2";

import {
  getManutencoes,
  createManutencao,
  updateManutencao,
  updateStatusManutencao,
  cancelarManutencao,
} from "../../services/manutencaoService";

import { getEquipamento } from "../../services/equipamentoService";
import { getMaquina } from "../../services/maquinasService";
import { getProfissionais } from "../../services/profissionalService";

export default function ManutencoesProgramadas() {
  const [manutencoes, setManutencoes] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [mecanicos, setMecanicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cargo, setCargo] = useState(null);

  const [modalAddOpen, setModalAddOpen] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [modalConclusaoOpen, setModalConclusaoOpen] = useState(false);

  const [showConcluidas, setShowConcluidas] = useState(false);
  const [showCanceladas, setShowCanceladas] = useState(false);

  const [manutencaoSelecionada, setManutencaoSelecionada] = useState(null);

  const manutencaoFields = [
    {
      name: "equipamento",
      label: "Equipamento",
      type: "select",
      options: equipamentos,
    },
    {
      name: "maquina",
      label: "Máquina (opcional)",
      type: "select",
      options: [{ value: "", label: "Sem máquina específica" }, ...maquinas],
    },
    {
      name: "tipoManutencao",
      label: "Tipo de Manutenção",
      type: "text",
    },
    {
      name: "descricao",
      label: "Descrição",
      type: "textarea",
    },
    {
      name: "especializacao",
      label: "Especialização Exigida",
      type: "text",
    },
    {
      name: "mecanico",
      label: "Mecânico",
      type: "select",
      options: mecanicos,
    },
    {
      name: "inicioPrevisto",
      label: "Início Previsto",
      type: "datetime-local",
    },
    {
      name: "terminoPrevisto",
      label: "Término Previsto",
      type: "datetime-local",
    },
  ];

  async function carregar() {
    try {
      const [manutencoesRes, equipamentosRes, maquinasRes, mecanicosRes] =
        await Promise.all([
          getManutencoes(),
          getEquipamento(),
          getMaquina(),
          getProfissionais(),
        ]);

      if (manutencoesRes) setManutencoes(manutencoesRes.data);

      if (equipamentosRes) {
        setEquipamentos(
          equipamentosRes.data
            .filter((e) => e.status === "Ativo")
            .map((e) => ({
              value: e.pk_equipamentoID,
              label: e.nomeEquipamento,
            })),
        );
      }

      if (maquinasRes) {
        setMaquinas(
          maquinasRes.data
            .filter((m) => m.status === "Ativo")
            .map((m) => ({
              value: m.pk_maquinaID,
              label: m.nomeMaquina,
            })),
        );
      }

      if (mecanicosRes) {
        setMecanicos(
          mecanicosRes.data
            .filter((p) => p.status === "Ativo" && p.ehMecanico)
            .map((p) => ({
              value: p.pk_profissionalID,
              label: `${p.nome}${p.especializacao ? ` (${p.especializacao})` : ""}`,
            })),
        );
      }
    } catch (err) {
      console.error("Erro ao carregar manutenções:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setCargo(localStorage.getItem("cargo"));
    carregar();
  }, []);

  async function handleCreate(data) {
    try {
      const payload = {
        ...data,
        equipamento: Number(data.equipamento),
        maquina: data.maquina ? Number(data.maquina) : null,
        mecanico: Number(data.mecanico),
      };

      const response = await createManutencao(payload);

      if (!response) return;

      setModalAddOpen(false);

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Manutenção programada!",
        showConfirmButton: false,
        timer: 2500,
      });

      await carregar();
    } catch (err) {
      console.error("Erro ao criar manutenção:", err);
    }
  }

  async function handleEdit(data) {
    try {
      const payload = {
        ...data,
        equipamento: Number(data.equipamento),
        maquina: data.maquina ? Number(data.maquina) : null,
        mecanico: Number(data.mecanico),
      };

      const response = await updateManutencao(
        manutencaoSelecionada.pk_manutencaoID,
        payload,
      );

      if (!response) return;

      setModalEditOpen(false);
      setManutencaoSelecionada(null);

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Manutenção atualizada!",
        showConfirmButton: false,
        timer: 2500,
      });

      await carregar();
    } catch (err) {
      console.error("Erro ao editar manutenção:", err);
    }
  }

  async function confirmarAcao(manutencao, status, extra = {}) {
    const response = await updateStatusManutencao(
      manutencao.pk_manutencaoID,
      { status, ...extra },
    );

    if (!response) return;

    setModalConclusaoOpen(false);
    setManutencaoSelecionada(null);

    await Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Status atualizado!",
      showConfirmButton: false,
      timer: 2000,
    });

    await carregar();
  }

  async function handleIniciar(manutencao) {
    const inicioPrevisto = new Date(manutencao.inicioPrevisto);
    const antecipado =
      !Number.isNaN(inicioPrevisto.getTime()) && new Date() < inicioPrevisto;

    const result = await Swal.fire({
      title: "Iniciar manutenção?",
      text: antecipado
        ? `Iniciar "${manutencao.descricao}" antes do previsto? Justifique abaixo.`
        : `Iniciar "${manutencao.descricao}"?`,
      icon: "question",
      // Início antecipado exige uma observação, igual à regra do operador
      input: antecipado ? "textarea" : undefined,
      inputLabel: antecipado ? "Observação (obrigatória)" : undefined,
      inputPlaceholder: antecipado
        ? "Explique o motivo do início antecipado"
        : undefined,
      inputValidator: antecipado
        ? (value) =>
            value?.trim() ? undefined : "Informe a observação para continuar!"
        : undefined,
      showCancelButton: true,
      confirmButtonText: "Sim, iniciar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#eab308",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) return;

    await confirmarAcao(
      manutencao,
      "Em Execução",
      antecipado ? { observacoes: result.value } : {},
    );
  }

  async function handleConcluir(data) {
    try {
      await confirmarAcao(manutencaoSelecionada, "Concluída", data);
    } catch (err) {
      console.error("Erro ao concluir manutenção:", err);
    }
  }

  async function handleCancelar(manutencao) {
    const result = await Swal.fire({
      title: "Cancelar manutenção?",
      text: `Cancelar "${manutencao.descricao}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim, cancelar",
      cancelButtonText: "Voltar",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) return;

    const response = await cancelarManutencao(manutencao.pk_manutencaoID);

    if (!response) return;

    await carregar();

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Manutenção cancelada!",
      showConfirmButton: false,
      timer: 2000,
    });
  }

  function abrirEdicao(manutencao) {
    setManutencaoSelecionada({
      ...manutencao,
      equipamento: manutencao.fk_equipamentoID,
      maquina: manutencao.fk_maquinaID || "",
      mecanico: manutencao.fk_mecanicoID,
      inicioPrevisto: paraInputDatetime(manutencao.inicioPrevisto),
      terminoPrevisto: paraInputDatetime(manutencao.terminoPrevisto),
    });
    setModalEditOpen(true);
  }

  if (loading) {
    return <p className="p-6 text-[#697385]">Carregando manutenções...</p>;
  }

  const isGestor = cargo === "gerente";

  const programadas = manutencoes.filter((m) => m.status === "Programada");
  const emExecucao = manutencoes.filter((m) => m.status === "Em Execução");
  const concluidas = manutencoes.filter((m) => m.status === "Concluída");
  const canceladas = manutencoes.filter((m) => m.status === "Cancelada");

  return (
    <div className="min-h-screen bg-[#EBECF7] flex flex-col">
      <Header />

      <div className="w-full max-w-6xl mx-auto p-4 md:p-6 flex flex-col gap-6">
        <PageTitle title="Manutenções Programadas" subtitle="Intervenções preventivas e corretivas">
          <button
            onClick={() => setShowConcluidas(true)}
            className="px-4 py-2 rounded bg-[#334E7F] text-white hover:bg-[#28406b]"
          >
            Ver Concluídas
          </button>

          <button
            onClick={() => setShowCanceladas(true)}
            className="px-4 py-2 rounded border border-[#334E7F]/30 bg-white text-[#334E7F] font-semibold hover:bg-[#334E7F]/10 transition-colors"
          >
            Ver Canceladas
          </button>
        </PageTitle>

        {/* O mecânico só enxerga as manutenções atribuídas a ele */}
        {!isGestor && (
          <p className="text-sm text-[#697385]">
            Você está vendo apenas as manutenções atribuídas a você.
          </p>
        )}

        <Section
          title="Manutenções Programadas"
          manutencoes={programadas}
          onIniciar={handleIniciar}
          onEditar={abrirEdicao}
          onCancelar={handleCancelar}
          podeIniciar={!isGestor}
          podeEditar={isGestor}
          podeCancelar={isGestor}
        />

        <Section
          title="Manutenções em Execução"
          manutencoes={emExecucao}
          onIniciar={handleIniciar}
          onEditar={abrirEdicao}
          onCancelar={handleCancelar}
          podeIniciar={false}
          podeEditar={false}
          podeCancelar={false}
          onConcluir={(manutencao) => {
            setManutencaoSelecionada(manutencao);
            setModalConclusaoOpen(true);
          }}
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
          title="Nova Manutenção Programada"
          fields={manutencaoFields}
          // Mecânico só agenda pra si mesmo; já deixa o campo preenchido
          initialData={
            !isGestor ? { mecanico: mecanicos[0]?.value ?? "" } : null
          }
          onSubmit={handleCreate}
          onClose={() => setModalAddOpen(false)}
        />
      )}

      {modalEditOpen && manutencaoSelecionada && (
        <ModalIncluir
          title="Editar Manutenção"
          fields={manutencaoFields}
          initialData={manutencaoSelecionada}
          onSubmit={handleEdit}
          onClose={() => {
            setModalEditOpen(false);
            setManutencaoSelecionada(null);
          }}
        />
      )}

      {modalConclusaoOpen && manutencaoSelecionada && (
        <ModalConclusaoManutencao
          manutencao={manutencaoSelecionada}
          onClose={() => {
            setModalConclusaoOpen(false);
            setManutencaoSelecionada(null);
          }}
          onConfirm={handleConcluir}
        />
      )}

      {showConcluidas && (
        <ModalDesativados
          title="Manutenções Concluídas"
          items={concluidas}
          displayFields={[
            { label: "Equipamento", value: "equipamento" },
            { label: "Descrição", value: "descricao" },
            { label: "Mecânico", value: "mecanico" },
            { label: "Conclusão", value: "conclusaoEfetiva", type: "datetime" },
            { label: "Serviços", value: "servicosRealizados" },
          ]}
          showActivateButton={false}
          idField="pk_manutencaoID"
          onActivate={() => {}}
          onClose={() => setShowConcluidas(false)}
        />
      )}

      {showCanceladas && (
        <ModalDesativados
          title="Manutenções Canceladas"
          items={canceladas}
          displayFields={[
            { label: "Equipamento", value: "equipamento" },
            { label: "Descrição", value: "descricao" },
            { label: "Mecânico", value: "mecanico" },
          ]}
          showActivateButton={false}
          idField="pk_manutencaoID"
          onActivate={() => {}}
          onClose={() => setShowCanceladas(false)}
        />
      )}
    </div>
  );
}

function Section({
  title,
  manutencoes,
  onIniciar,
  onEditar,
  onCancelar,
  onConcluir,
  podeIniciar,
  podeEditar,
  podeCancelar,
}) {
  const [open, setOpen] = useState(true);

  if (manutencoes.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <h2 className="text-xl font-bold text-[#11284F]">
          {title} ({manutencoes.length})
        </h2>

        <span className="w-7 h-7 rounded-full bg-white border border-[#334E7F]/15 text-[#334E7F] flex items-center justify-center text-base leading-none">{open ? "-" : "+"}</span>
      </div>

      {open && (
        <div className="flex flex-col gap-4">
          {manutencoes.map((manutencao) => (
            <Card
              key={manutencao.pk_manutencaoID}
              title={manutencao.equipamento}
            >
              <p className="text-sm text-[#334E7F]">
                Máquina: {manutencao.maquina || "-"}
              </p>

              <p className="text-sm text-[#334E7F]">
                Tipo: {manutencao.tipoManutencao || "-"}
              </p>

              <p className="text-sm text-[#334E7F]">
                Descrição: {manutencao.descricao}
              </p>

              <p className="text-sm text-[#334E7F]">
                Especialização: {manutencao.especializacao}
              </p>

              <p className="text-sm text-[#334E7F]">
                Mecânico: {manutencao.mecanico}
              </p>

              <p className="text-sm text-[#334E7F]">
                Início previsto: {formatDataHora(manutencao.inicioPrevisto)}
              </p>

              <p className="text-sm text-[#334E7F]">
                Término previsto: {formatDataHora(manutencao.terminoPrevisto)}
              </p>

              <p className="text-sm text-[#334E7F]">Status: {manutencao.status}</p>

              {manutencao.atrasada && (
                <p className="text-sm text-red-600 font-semibold">
                  {manutencao.status === "Programada"
                    ? "Prazo vencido: reprograme antes de iniciar."
                    : "Intervenção em atraso: conclua quando o serviço terminar."}
                </p>
              )}

              <div className="flex gap-2 mt-3 flex-wrap">
                {podeIniciar && (
                  <button
                    onClick={() => onIniciar(manutencao)}
                    className="bg-[#4A48A8] text-white px-3 py-1 rounded font-semibold transition-colors hover:bg-[#3d3b8f]"
                  >
                    Iniciar
                  </button>
                )}

                {onConcluir && (
                  <button
                    onClick={() => onConcluir(manutencao)}
                    className="bg-[#2E9B5E] text-white px-3 py-1 rounded font-semibold transition-colors hover:bg-[#27844F]"
                  >
                    Concluir
                  </button>
                )}

                {podeEditar && (
                  <button
                    onClick={() => onEditar(manutencao)}
                    className="bg-[#334E7F] text-white px-3 py-1 rounded font-semibold transition-colors hover:bg-[#28406b]"
                  >
                    Editar
                  </button>
                )}

                {podeCancelar && (
                  <button
                    onClick={() => onCancelar(manutencao)}
                    className="bg-[#C94545] text-white px-3 py-1 rounded font-semibold transition-colors hover:bg-[#AD3A3A]"
                  >
                    Cancelar
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

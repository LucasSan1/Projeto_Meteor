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
  getIndicadoresQualidade,
} from "../../services/inspecaoService";

import { getOrdens } from "../../services/orderService";
import { getProfissionais } from "../../services/profissionalService";

export default function Inspecoes() {
  const [inspecoes, setInspecoes] = useState([]);
  const [ordens, setOrdens] = useState([]);
  const [operadores, setOperadores] = useState([]);
  const [indicadores, setIndicadores] = useState(null);
  const [filtros, setFiltros] = useState({
    inicio: "",
    fim: "",
    operador: "",
  });
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

  async function carregarIndicadores(filtrosAtuais = filtros) {
    const params = {};

    if (filtrosAtuais.inicio) params.inicio = filtrosAtuais.inicio;
    if (filtrosAtuais.fim) params.fim = filtrosAtuais.fim;
    if (filtrosAtuais.operador) params.operador = filtrosAtuais.operador;

    const response = await getIndicadoresQualidade(params);

    if (response) {
      setIndicadores(response.data);
    }
  }

  async function carregar() {
    try {
      const [inspecoesRes, ordensRes, profissionaisRes] = await Promise.all([
        getInspecoes(),
        getOrdens(),
        getProfissionais(),
      ]);

      if (inspecoesRes) setInspecoes(inspecoesRes.data);

      if (ordensRes) {
        setOrdens(ordensRes.data);
      }

      if (profissionaisRes) {
        setOperadores(
          profissionaisRes.data
            .filter((p) => p.ehOperador)
            .map((p) => ({
              value: p.pk_profissionalID,
              label: p.nome,
            })),
        );
      }

      await carregarIndicadores();
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
        {/* INDICADORES */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-[#4E342E]">
            Indicadores de Qualidade
          </h2>

          <div className="flex flex-col md:flex-row md:items-end gap-3 bg-white p-4 rounded-xl shadow">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-black">De</label>
              <input
                type="date"
                value={filtros.inicio}
                onChange={(e) =>
                  setFiltros((prev) => ({ ...prev, inicio: e.target.value }))
                }
                className="border rounded p-2"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-black">Até</label>
              <input
                type="date"
                value={filtros.fim}
                onChange={(e) =>
                  setFiltros((prev) => ({ ...prev, fim: e.target.value }))
                }
                className="border rounded p-2"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-black">Operador</label>
              <select
                value={filtros.operador}
                onChange={(e) =>
                  setFiltros((prev) => ({ ...prev, operador: e.target.value }))
                }
                className="border rounded p-2"
              >
                <option value="">Todos</option>
                {operadores.map((operador) => (
                  <option key={operador.value} value={operador.value}>
                    {operador.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => carregarIndicadores()}
              className="px-4 py-2 rounded bg-[#4E342E] text-white hover:brightness-110"
            >
              Filtrar
            </button>

            <button
              onClick={() => {
                const limpos = { inicio: "", fim: "", operador: "" };
                setFiltros(limpos);
                carregarIndicadores(limpos);
              }}
              className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
            >
              Limpar
            </button>
          </div>

          {indicadores && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card
                  title="Inspecionadas"
                  value={indicadores.resumo.inspecionado}
                >
                  <p className="text-sm text-gray-500">Peças no período</p>
                </Card>

                <Card
                  title="Aprovadas"
                  value={indicadores.resumo.aprovadas}
                >
                  <p className="text-sm text-gray-500">Dentro da tolerância</p>
                </Card>

                <Card
                  title="Rejeitadas"
                  value={indicadores.resumo.rejeitadas}
                >
                  <p className="text-sm text-gray-500">Total rejeitado</p>
                </Card>

                <Card
                  title="Índice de rejeição"
                  value={
                    indicadores.resumo.indiceRejeicao === null
                      ? "não calculável"
                      : `${indicadores.resumo.indiceRejeicao}%`
                  }
                >
                  <p className="text-sm text-gray-500">
                    Rejeitadas / inspecionadas
                  </p>
                </Card>

                <Card title="Perdas" value={indicadores.resumo.perdas}>
                  <p className="text-sm text-gray-500">Refugo definitivo</p>
                </Card>

                <Card
                  title="Retrabalho"
                  value={indicadores.resumo.retrabalhos}
                >
                  <p className="text-sm text-gray-500">Peças recuperáveis</p>
                </Card>
              </div>

              <p className="text-sm text-gray-600">
                O índice usa a soma das rejeitadas dividida pela soma das
                inspecionadas, sem média simples entre ordens.
              </p>

              {indicadores.porOperador.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {indicadores.porOperador.map((operador) => (
                    <Card
                      key={operador.operadorID}
                      title={operador.operador}
                    >
                      <p className="text-sm text-black">
                        Ordens: {operador.ordens}
                      </p>
                      <p className="text-sm text-black">
                        Inspecionadas: {operador.inspecionado}
                      </p>
                      <p className="text-sm text-black">
                        Rejeitadas: {operador.rejeitadas}
                      </p>
                      <p className="text-sm text-black">
                        Índice:{" "}
                        {operador.indiceRejeicao === null
                          ? "não calculável"
                          : `${operador.indiceRejeicao}%`}
                      </p>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <h2 className="text-xl font-bold text-[#4E342E]">
          Inspeções Registradas
        </h2>

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
                  Operador: {inspecao.operador}
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

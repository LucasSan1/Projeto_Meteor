"use client";

import { useEffect, useState } from "react";

import Header from "../../components/Header";
import PageTitle from "../../components/pageTitle";
import Card from "../../components/Card";
import { formatDataHora } from "../../../utils/Datetime";

import {
  getInspecoes,
  getIndicadoresQualidade,
} from "../../services/inspecaoService";

import { getProfissionais } from "../../services/profissionalService";

export default function Inspecoes() {
  const [inspecoes, setInspecoes] = useState([]);
  const [operadores, setOperadores] = useState([]);
  const [indicadores, setIndicadores] = useState(null);
  const [filtros, setFiltros] = useState({
    inicio: "",
    fim: "",
    operador: "",
  });
  const [loading, setLoading] = useState(true);

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
      const [inspecoesRes, profissionaisRes] = await Promise.all([
        getInspecoes(),
        getProfissionais(),
      ]);

      if (inspecoesRes) setInspecoes(inspecoesRes.data);

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

  if (loading) {
    return <p className="p-6 text-[#697385]">Carregando inspeções...</p>;
  }

  return (
    <div className="min-h-screen bg-[#EBECF7] flex flex-col">
      <Header />

      <div className="w-full max-w-6xl mx-auto p-4 md:p-6 flex flex-col gap-6">
        <PageTitle title="Inspeções de Qualidade" subtitle="Indicadores e histórico de inspeções" />

        {/* INDICADORES */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-[#11284F]">
            Indicadores de Qualidade
          </h2>

          <div className="flex flex-col md:flex-row md:items-end gap-3 bg-white p-4 rounded-xl border border-[#334E7F]/10">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">De</label>
              <input
                type="date"
                value={filtros.inicio}
                onChange={(e) =>
                  setFiltros((prev) => ({ ...prev, inicio: e.target.value }))
                }
                className="campo"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Até</label>
              <input
                type="date"
                value={filtros.fim}
                onChange={(e) =>
                  setFiltros((prev) => ({ ...prev, fim: e.target.value }))
                }
                className="campo"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Operador</label>
              <select
                value={filtros.operador}
                onChange={(e) =>
                  setFiltros((prev) => ({ ...prev, operador: e.target.value }))
                }
                className="campo"
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
              className="px-4 py-2 rounded bg-[#334E7F] text-white font-semibold hover:bg-[#28406b] transition-colors"
            >
              Filtrar
            </button>

            <button
              onClick={() => {
                const limpos = { inicio: "", fim: "", operador: "" };
                setFiltros(limpos);
                carregarIndicadores(limpos);
              }}
              className="btn-secundario"
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
                  <p className="text-sm text-[#697385]">Peças no período</p>
                </Card>

                <Card
                  title="Aprovadas"
                  value={indicadores.resumo.aprovadas}
                >
                  <p className="text-sm text-[#697385]">Dentro da tolerância</p>
                </Card>

                <Card
                  title="Rejeitadas"
                  value={indicadores.resumo.rejeitadas}
                >
                  <p className="text-sm text-[#697385]">Total rejeitado</p>
                </Card>

                <Card
                  title="Índice de rejeição"
                  value={
                    indicadores.resumo.indiceRejeicao === null
                      ? "não calculável"
                      : `${indicadores.resumo.indiceRejeicao}%`
                  }
                >
                  <p className="text-sm text-[#697385]">
                    Rejeitadas / inspecionadas
                  </p>
                </Card>

                <Card title="Perdas" value={indicadores.resumo.perdas}>
                  <p className="text-sm text-[#697385]">Refugo definitivo</p>
                </Card>

                <Card
                  title="Retrabalho"
                  value={indicadores.resumo.retrabalhos}
                >
                  <p className="text-sm text-[#697385]">Peças recuperáveis</p>
                </Card>
              </div>

              <p className="text-sm text-[#697385]">
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
                      <p className="text-sm text-[#334E7F]">
                        Ordens: {operador.ordens}
                      </p>
                      <p className="text-sm text-[#334E7F]">
                        Inspecionadas: {operador.inspecionado}
                      </p>
                      <p className="text-sm text-[#334E7F]">
                        Rejeitadas: {operador.rejeitadas}
                      </p>
                      <p className="text-sm text-[#334E7F]">
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

        <h2 className="text-xl font-bold text-[#11284F]">
          Inspeções Registradas
        </h2>

        <p className="text-sm text-[#697385]">
          As inspeções são geradas automaticamente na conclusão das ordens e
          ficam aqui apenas como histórico.
        </p>

        {inspecoes.length === 0 ? (
          <p className="text-[#697385] text-center">
            Nenhuma inspeção registrada
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {inspecoes.map((inspecao) => (
              <Card
                key={inspecao.pk_inspecaoID}
                title={`${inspecao.ordem} - ${inspecao.peca}`}
              >
                <p className="text-sm text-[#334E7F]">
                  Total produzido: {inspecao.totalProduzido}
                </p>

                <p className="text-sm text-[#334E7F]">
                  Operador: {inspecao.operador}
                </p>

                <p className="text-sm text-[#334E7F]">
                  Aprovadas: {inspecao.aprovadas}
                </p>

                <p className="text-sm text-[#334E7F]">
                  Rejeitadas: {inspecao.rejeitadas}
                </p>

                <p className="text-sm text-[#334E7F]">
                  Data: {formatDataHora(inspecao.dataInspecao)}
                </p>

                <p className="text-sm text-[#334E7F]">
                  Observações: {inspecao.observacoes || "-"}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

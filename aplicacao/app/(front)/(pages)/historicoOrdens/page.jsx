"use client";

import { useEffect, useState } from "react";

import Header from "../../components/Header";
import PageTitle from "../../components/pageTitle";
import Card from "../../components/Card";
import { formatData, formatDataHora } from "../../../utils/Datetime";

import { getHistoricoOrdens } from "../../services/historicoOrdemService";

export default function HistoricoOrdens() {
  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    try {
      const response = await getHistoricoOrdens();

      if (response) {
        setOrdens(response.data);
      }
    } catch (err) {
      console.error("Erro ao carregar histórico de ordens:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  if (loading) {
    return <p className="p-6 text-[#697385]">Carregando histórico de ordens...</p>;
  }

  return (
    <div className="min-h-screen bg-[#EBECF7] flex flex-col">
      <Header />

      <div className="w-full max-w-6xl mx-auto p-4 md:p-6 flex flex-col gap-6">
        <PageTitle
          title="Histórico de Ordens"
          subtitle="Ordens, materiais e mudanças de status em um só lugar"
        />

        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-[#11284F]">
            Ordens ({ordens.length})
          </h2>

          {ordens.length === 0 ? (
            <p className="text-[#697385] text-center">
              Nenhuma ordem registrada
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {ordens.map((ordem) => (
                <Card
                  key={ordem.pk_ordemID}
                  title={`${ordem.codigo} — ${ordem.peca}`}
                >
                  <p className="text-sm text-[#334E7F]">
                    Operador: {ordem.operador}
                  </p>

                  <p className="text-sm text-[#334E7F]">
                    Quantidade planejada: {ordem.quantidadePlanejada}
                  </p>

                  <p className="text-sm text-[#334E7F]">
                    Especialização: {ordem.especializacao}
                  </p>

                  <p className="text-sm text-[#334E7F]">
                    Início planejado: {formatData(ordem.inicioPlanejado)}
                  </p>

                  <p className="text-sm text-[#334E7F]">
                    Término planejado: {formatData(ordem.terminoPlanejado)}
                  </p>

                  {ordem.inicioEfetivo && (
                    <p className="text-sm text-[#334E7F]">
                      Início efetivo: {formatDataHora(ordem.inicioEfetivo)}
                    </p>
                  )}

                  {ordem.conclusaoEfetiva && (
                    <p className="text-sm text-[#334E7F]">
                      Conclusão efetiva: {formatDataHora(ordem.conclusaoEfetiva)}
                    </p>
                  )}

                  <p className="text-sm text-[#334E7F]">
                    Status: <span className="font-semibold">{ordem.status}</span>
                  </p>

                  {/* Consumo de materiais da ordem */}
                  <div className="mt-3 border-t border-[#334E7F]/10 pt-3">
                    <p className="text-sm font-semibold text-[#11284F]">
                      Materiais
                    </p>

                    {ordem.materiais.length === 0 ? (
                      <p className="text-sm text-[#697385]">
                        Nenhum material vinculado
                      </p>
                    ) : (
                      ordem.materiais.map((material) => (
                        <p
                          key={`${ordem.pk_ordemID}-${material.materia}`}
                          className="text-sm text-[#334E7F]"
                        >
                          {material.materia}: previsto{" "}
                          {material.quantidadePrevista}{" "}
                          {material.unidadeMedida}
                          {material.quantidadeConsumida !== null
                            ? ` / consumido ${material.quantidadeConsumida} ${material.unidadeMedida}`
                            : " / ainda não consumido"}
                        </p>
                      ))
                    )}
                  </div>

                  {/* Linha do tempo de status da ordem */}
                  <div className="mt-3 border-t border-[#334E7F]/10 pt-3">
                    <p className="text-sm font-semibold text-[#11284F]">
                      Histórico de status
                    </p>

                    {ordem.historico.length === 0 ? (
                      <p className="text-sm text-[#697385]">
                        Nenhuma alteração de status registrada
                      </p>
                    ) : (
                      ordem.historico.map((evento) => (
                        <p
                          key={evento.pk_historicoID}
                          className="text-sm text-[#334E7F]"
                        >
                          <span className="text-[#697385]">
                            {formatDataHora(evento.dataAlteracao)} —{" "}
                          </span>
                          {evento.statusAnterior || "—"} → {evento.statusNovo}
                          {evento.usuario ? ` (por ${evento.usuario})` : ""}
                          {evento.observacao ? ` — ${evento.observacao}` : ""}
                        </p>
                      ))
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

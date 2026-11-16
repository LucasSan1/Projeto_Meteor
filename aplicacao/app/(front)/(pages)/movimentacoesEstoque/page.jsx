"use client";

import { useEffect, useState } from "react";

import Header from "../../components/Header";
import PageTitle from "../../components/pageTitle";
import Card from "../../components/Card";
import { formatDataHora } from "../../../utils/Datetime";

import { getMovimentacoes } from "../../services/movimentacaoService";

export default function MovimentacoesEstoque() {
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    try {
      const movRes = await getMovimentacoes();

      if (movRes) setMovimentacoes(movRes.data);
    } catch (err) {
      console.error("Erro ao carregar movimentações:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  if (loading) {
    return <p className="p-6 text-[#697385]">Carregando movimentações...</p>;
  }

  return (
    <div className="min-h-screen bg-[#EBECF7] flex flex-col">
      <Header />

      <div className="w-full max-w-6xl mx-auto p-4 md:p-6 flex flex-col gap-6">
        <PageTitle title="Movimentações de Estoque" subtitle="Entradas e saídas do estoque" />

        <p className="text-sm text-[#697385]">
          Histórico de entradas e saídas do estoque. As entradas são lançadas
          na tela de matérias-primas e as saídas são geradas automaticamente
          na conclusão das ordens de produção.
        </p>

        {movimentacoes.length === 0 ? (
          <p className="text-[#697385] text-center">
            Nenhuma movimentação registrada
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {movimentacoes.map((mov) => (
              <Card
                key={mov.pk_movimentacaoID}
                title={`${mov.tipo} - ${mov.materia}`}
              >
                <p className="text-sm text-[#334E7F]">
                  Quantidade: {mov.quantidade} {mov.unidadeMedida}
                </p>

                <p className="text-sm text-[#334E7F]">
                  Responsável: {mov.usuario}
                </p>

                <p className="text-sm text-[#334E7F]">
                  Ordem: {mov.ordem || "-"}
                </p>

                <p className="text-sm text-[#334E7F]">
                  Data: {formatDataHora(mov.dataMovimentacao)}
                </p>

                <p className="text-sm text-[#334E7F]">
                  Observação: {mov.observacao || "-"}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

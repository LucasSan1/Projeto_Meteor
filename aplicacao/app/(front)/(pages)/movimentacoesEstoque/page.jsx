"use client";

import { useEffect, useState } from "react";

import Header from "../../components/Header";
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
    return <p className="p-6">Carregando movimentações...</p>;
  }

  return (
    <div className="min-h-screen bg-[#F9F7F4] flex flex-col">
      <Header />

      <div className="p-6 flex flex-col gap-6">
        <p className="text-sm text-gray-600">
          Histórico de entradas e saídas do estoque. As entradas são lançadas
          na tela de matérias-primas e as saídas são geradas automaticamente
          na conclusão das ordens de produção.
        </p>

        {movimentacoes.length === 0 ? (
          <p className="text-gray-500 text-center">
            Nenhuma movimentação registrada
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {movimentacoes.map((mov) => (
              <Card
                key={mov.pk_movimentacaoID}
                title={`${mov.tipo} - ${mov.materia}`}
              >
                <p className="text-sm text-black">
                  Quantidade: {mov.quantidade} {mov.unidadeMedida}
                </p>

                <p className="text-sm text-black">
                  Responsável: {mov.usuario}
                </p>

                <p className="text-sm text-black">
                  Ordem: {mov.ordem || "-"}
                </p>

                <p className="text-sm text-black">
                  Data: {formatDataHora(mov.dataMovimentacao)}
                </p>

                <p className="text-sm text-black">
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

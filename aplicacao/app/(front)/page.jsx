"use client";

import { useEffect, useState } from "react";

import Header from "./components/Header";
import {
  IconeAlerta,
  IconeCheck,
  IconeEquipamento,
  IconeFornecedor,
  IconeGauge,
  IconeMaquina,
  IconeMateria,
  IconeOrdem,
  IconePeca,
  IconePessoa,
  IconeRelogio,
  IconeTendencia,
} from "./components/icones";

import { apiFetch } from "./services/api";

// Tons das caixinhas de KPI, no mesmo espírito do painel do Cosmo
const TONS = {
  amber: "bg-amber-50 border-amber-200 text-amber-700",
  navy: "bg-blue-50 border-blue-200 text-blue-800",
  green: "bg-green-50 border-green-200 text-green-700",
  red: "bg-red-50 border-red-200 text-red-700",
  slate: "bg-slate-50 border-slate-200 text-slate-600",
  indigo: "bg-[#EFEEFA] border-[#C9C8EC] text-[#4A48A8]",
};

function Kpi({ titulo, valor, dica, tom = "navy", Icone }) {
  return (
    <div className={`rounded-xl border p-4 ${TONS[tom]}`}>
      <div className="w-9 h-9 rounded-lg bg-white/70 flex items-center justify-center mb-3">
        <Icone size={18} />
      </div>

      <div className="text-2xl font-bold leading-tight">{valor}</div>

      <div className="text-xs text-[#697385] mt-1 leading-snug">{titulo}</div>

      {dica && (
        <p className="text-[11px] text-[#697385]/80 mt-1 leading-snug">
          {dica}
        </p>
      )}
    </div>
  );
}

function Secao({ titulo, children }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="w-1 h-5 rounded-full bg-[#4A48A8]" />
        <h2 className="text-lg font-bold text-[#11284F]">{titulo}</h2>
      </div>

      {children}
    </section>
  );
}

export default function Home() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  async function carregarDashboard() {
    try {
      // O apiFetch centraliza o tratamento de 401
      const response = await apiFetch("/api/dashboard");

      if (response) {
        setDashboard(response.data);
      }
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  if (loading) {
    return <p className="p-6 text-[#697385]">Carregando dashboard...</p>;
  }

  if (!dashboard) {
    return <p className="p-6 text-[#697385]">Erro ao carregar dashboard.</p>;
  }

  return (
    <div className="min-h-screen bg-[#EBECF7] flex flex-col">
      <Header />

      <div className="w-full max-w-6xl mx-auto p-4 md:p-6 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-[#11284F]">Dashboard</h1>
          <p className="text-sm text-[#697385]">
            Visão geral da produção, do patrimônio e da qualidade
          </p>
        </div>

        {/* Resumo do clima da fábrica */}
        <div className="bg-[#11284F] text-white rounded-xl p-4 md:p-5 flex gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
            <IconeGauge size={20} className="text-[#c9c8ec]" />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#c9c8ec] mb-1">
              Leitura do momento
            </p>
            <p className="text-sm leading-relaxed text-white/90">
              Acompanhe ordens em andamento, disponibilidade de máquinas e o
              desempenho da qualidade em um só lugar.
            </p>
          </div>
        </div>

        {/* ORDENS */}
        <Secao titulo="Ordens de Produção">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi
              tom="amber"
              Icone={IconeRelogio}
              titulo="Ordens Pendentes"
              valor={dashboard.ordens.pendentes}
              dica="Aguardando início"
            />

            <Kpi
              tom="navy"
              Icone={IconeOrdem}
              titulo="Em Produção"
              valor={dashboard.ordens.producao}
              dica="Atualmente em fabricação"
            />

            <Kpi
              tom="green"
              Icone={IconeCheck}
              titulo="Finalizadas"
              valor={dashboard.ordens.finalizadas}
              dica="Produções concluídas"
            />

            <Kpi
              tom="red"
              Icone={IconeAlerta}
              titulo="Atrasadas"
              valor={dashboard.ordens.atrasadas}
              dica="Pendentes ou em produção com prazo vencido"
            />
          </div>
        </Secao>

        {/* PROFISSIONAIS */}
        <Secao titulo="Profissionais">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Kpi
              tom="navy"
              Icone={IconePessoa}
              titulo="Operadores"
              valor={dashboard.profissionais.operadores}
              dica="Aptos para produção"
            />

            <Kpi
              tom="indigo"
              Icone={IconePessoa}
              titulo="Mecânicos"
              valor={dashboard.profissionais.mecanicos}
              dica="Aptos para manutenção"
            />
          </div>
        </Secao>

        {/* MÁQUINAS */}
        <Secao titulo="Máquinas">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi
              tom="green"
              Icone={IconeMaquina}
              titulo="Ativas"
              valor={dashboard.maquinas.ativas}
              dica="Em operação"
            />

            <Kpi
              tom="slate"
              Icone={IconeMaquina}
              titulo="Desativadas"
              valor={dashboard.maquinas.desativadas}
              dica="Fora de uso"
            />

            <Kpi
              tom="amber"
              Icone={IconeAlerta}
              titulo="Manutenções em aberto"
              valor={dashboard.maquinas.manutencaoPendente}
              dica="Programadas ou em execução"
            />

            <Kpi
              tom="red"
              Icone={IconeAlerta}
              titulo="Manutenções atrasadas"
              valor={dashboard.maquinas.manutencoesAtrasadas}
              dica="Passaram do término previsto"
            />
          </div>
        </Secao>

        {/* ESTOQUE */}
        <Secao titulo="Cadastros">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <Kpi
              tom="navy"
              Icone={IconeMateria}
              titulo="Matérias-primas"
              valor={dashboard.estoque.materias}
              dica="Itens ativos"
            />

            <Kpi
              tom="red"
              Icone={IconeAlerta}
              titulo="Estoque baixo"
              valor={dashboard.estoque.estoqueBaixo}
              dica="Abaixo do mínimo"
            />

            <Kpi
              tom="indigo"
              Icone={IconePeca}
              titulo="Peças"
              valor={dashboard.estoque.pecas}
              dica="Peças ativas"
            />

            <Kpi
              tom="navy"
              Icone={IconeEquipamento}
              titulo="Equipamentos"
              valor={dashboard.estoque.equipamentos}
              dica="Equipamentos ativos"
            />

            <Kpi
              tom="green"
              Icone={IconeFornecedor}
              titulo="Fornecedores"
              valor={dashboard.estoque.fornecedores}
              dica="Fornecedores ativos"
            />
          </div>
        </Secao>

        {/* QUALIDADE */}
        <Secao titulo="Qualidade">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Kpi
              tom="navy"
              Icone={IconeCheck}
              titulo="Inspeções"
              valor={dashboard.qualidade.inspecoes}
              dica="Ordens inspecionadas"
            />

            <Kpi
              tom="indigo"
              Icone={IconePeca}
              titulo="Peças inspecionadas"
              valor={dashboard.qualidade.inspecionado}
              dica="Total produzido e conferido"
            />

            <Kpi
              tom="red"
              Icone={IconeTendencia}
              titulo="Índice de rejeição"
              valor={
                dashboard.qualidade.indiceRejeicao === null
                  ? "não calculável"
                  : `${dashboard.qualidade.indiceRejeicao}%`
              }
              dica="Rejeitadas ÷ inspecionadas"
            />

            <Kpi
              tom="green"
              Icone={IconeCheck}
              titulo="Peças aprovadas"
              valor={dashboard.qualidade.aprovadas}
              dica="Dentro da tolerância"
            />

            <Kpi
              tom="red"
              Icone={IconeAlerta}
              titulo="Peças rejeitadas"
              valor={dashboard.qualidade.rejeitadas}
              dica="Total rejeitado nas inspeções"
            />

            <Kpi
              tom="amber"
              Icone={IconeTendencia}
              titulo="Perdas x retrabalho"
              valor={`${dashboard.qualidade.perdas} / ${dashboard.qualidade.retrabalhos}`}
              dica="Refugo definitivo x peças recuperáveis"
            />
          </div>
        </Secao>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

import Header from "./components/Header";
import Card from "./components/Card";

import Swal from "sweetalert2";

export default function Home() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  async function carregarDashboard() {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/dashboard", {
        headers: {
          Authorization: token
            ? `Bearer ${token}`
            : "",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setDashboard(data.data);

    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);

      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível carregar o dashboard.",
      });

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  if (loading) {
    return <p className="p-6">Carregando dashboard...</p>;
  }

  if (!dashboard) {
    return <p className="p-6">Erro ao carregar dashboard.</p>;
  }

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
        gap-6
      "
      >
        <h1
          className="
          text-2xl
          font-bold
          text-[#4E342E]
        "
        >
          Dashboard
        </h1>

        {/* ORDENS */}
        <div>
          <h2 className="text-xl font-bold text-[#4E342E] mb-3">
            Ordens de Produção
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
              title="Ordens Pendentes"
              value={dashboard.ordens.pendentes}
            >
              <p className="text-sm text-gray-500">
                Aguardando início
              </p>
            </Card>

            <Card
              title="Em Produção"
              value={dashboard.ordens.producao}
            >
              <p className="text-sm text-gray-500">
                Atualmente em fabricação
              </p>
            </Card>

            <Card
              title="Finalizadas"
              value={dashboard.ordens.finalizadas}
            >
              <p className="text-sm text-gray-500">
                Produções concluídas
              </p>
            </Card>

            <Card
              title="Atrasadas"
              value={dashboard.ordens.atrasadas}
            >
              <p className="text-sm text-gray-500">
                Implementação futura
              </p>
            </Card>
          </div>
        </div>

        {/* OPERADORES */}
        <div>
          <h2 className="text-xl font-bold text-[#4E342E] mb-3">
            Operadores
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card
              title="Disponíveis"
              value={dashboard.operadores.disponiveis}
            >
              <p className="text-sm text-gray-500">
                Aptos para produção
              </p>
            </Card>

            <Card
              title="Indisponíveis"
              value={dashboard.operadores.indisponiveis}
            >
              <p className="text-sm text-gray-500">
                Fora de operação
              </p>
            </Card>
          </div>
        </div>

        {/* MÁQUINAS */}
        <div>
          <h2 className="text-xl font-bold text-[#4E342E] mb-3">
            Máquinas
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card
              title="Ativas"
              value={dashboard.maquinas.ativas}
            >
              <p className="text-sm text-gray-500">
                Em operação
              </p>
            </Card>

            <Card
              title="Desativadas"
              value={dashboard.maquinas.desativadas}
            >
              <p className="text-sm text-gray-500">
                Fora de uso
              </p>
            </Card>

            <Card
              title="Manutenção"
              value={dashboard.maquinas.manutencaoPendente}
            >
              <p className="text-sm text-gray-500">
                Implementação futura
              </p>
            </Card>
          </div>
        </div>

        {/* ESTOQUE */}
        <div>
          <h2 className="text-xl font-bold text-[#4E342E] mb-3">
            Cadastros
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card
              title="Peças"
              value={dashboard.estoque.pecas}
            >
              <p className="text-sm text-gray-500">
                Peças ativas
              </p>
            </Card>

            <Card
              title="Equipamentos"
              value={dashboard.estoque.equipamentos}
            >
              <p className="text-sm text-gray-500">
                Equipamentos ativos
              </p>
            </Card>

            <Card
              title="Fornecedores"
              value={dashboard.estoque.fornecedores}
            >
              <p className="text-sm text-gray-500">
                Fornecedores ativos
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
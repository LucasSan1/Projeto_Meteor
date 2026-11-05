"use client";

import { useEffect, useState } from "react";

import Header from "../../components/Header";
import ListaRegistros from "../../components/listaRegistros";

import { getHistoricoOrdens } from "../../services/historicoOrdemService";

export default function HistoricoOrdens() {
  const [historicos, setHistoricos] = useState([]);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    try {
      const response = await getHistoricoOrdens();

      if (response) {
        setHistoricos(response.data);
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
    return <p className="p-6">Carregando histórico de ordens...</p>;
  }

  return (
    <div className="min-h-screen bg-[#F9F7F4] flex flex-col">
      <Header />

      <div className="p-6 flex flex-col gap-6">
        <ListaRegistros
          title="Histórico de Ordens"
          items={historicos}
          idField="pk_historicoID"
          getTitle={(item) => `${item.ordem} - ${item.dataAlteracao}`}
          emptyMessage="Nenhuma alteração de status registrada"
          fields={[
            { label: "Ordem", value: "ordem" },
            { label: "Peça", value: "peca" },
            { label: "Status anterior", value: "statusAnterior" },
            { label: "Status novo", value: "statusNovo" },
            { label: "Alterado por", value: "usuario" },
            { label: "Data", value: "dataAlteracao", type: "datetime" },
            { label: "Observação", value: "observacao" },
          ]}
        />
      </div>
    </div>
  );
}

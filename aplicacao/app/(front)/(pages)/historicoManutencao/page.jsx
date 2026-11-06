"use client";

import { useEffect, useState } from "react";

import Header from "../../components/Header";
import ListaRegistros from "../../components/listaRegistros";

import { getHistoricoManutencao } from "../../services/historicoManutencaoService";

export default function HistoricoManutencao() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    try {
      const response = await getHistoricoManutencao();

      if (response) {
        setRegistros(response.data);
      }
    } catch (err) {
      console.error("Erro ao carregar histórico de manutenção:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  if (loading) {
    return <p className="p-6">Carregando histórico de manutenção...</p>;
  }

  return (
    <div className="min-h-screen bg-[#F9F7F4] flex flex-col">
      <Header />

      <div className="p-6 flex flex-col gap-6">
        <ListaRegistros
          title="Histórico de Manutenção"
          items={registros}
          idField="historicoID"
          getTitle={(item) => `${item.equipamento} - ${item.manutencaoRealizada}`}
          emptyMessage="Nenhuma manutenção concluída"
          fields={[
            { label: "Equipamento", value: "equipamento" },
            { label: "Manutenção realizada", value: "manutencaoRealizada" },
            { label: "Mecânico", value: "mecanico" },
            { label: "Data", value: "dataManutencao", type: "date" },
            { label: "Início efetivo", value: "inicioEfetivo", type: "datetime" },
            { label: "Término efetivo", value: "terminoEfetivo", type: "datetime" },
            { label: "Custos", value: "custos" },
            { label: "Observações", value: "observacoes" },
          ]}
        />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

import Header from "../../components/Header";
import ListaRegistros from "../../components/listaRegistros";

import { getAuditoria } from "../../services/auditoriaService";

export default function Auditoria() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    try {
      const response = await getAuditoria();

      if (response) {
        setRegistros(response.data);
      }
    } catch (err) {
      console.error("Erro ao carregar auditoria:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  if (loading) {
    return <p className="p-6">Carregando auditoria...</p>;
  }

  return (
    <div className="min-h-screen bg-[#F9F7F4] flex flex-col">
      <Header />

      <div className="p-6 flex flex-col gap-6">
        <ListaRegistros
          title="Auditoria"
          items={registros}
          idField="pk_auditoriaID"
          getTitle={(item) => `${item.entidade} #${item.entidadeID} - ${item.acao}`}
          emptyMessage="Nenhuma ação auditada"
          fields={[
            { label: "Usuário", value: "usuario" },
            { label: "Entidade", value: "entidade" },
            { label: "ID da entidade", value: "entidadeID" },
            { label: "Ação", value: "acao" },
            { label: "Dados anteriores", value: "dadosAnteriores", type: "json" },
            { label: "Dados novos", value: "dadosNovos", type: "json" },
            { label: "Observação", value: "observacao" },
            { label: "Data", value: "dataAcao", type: "datetime" },
          ]}
        />
      </div>
    </div>
  );
}

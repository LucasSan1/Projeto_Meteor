"use client";

import { useEffect, useState } from "react";

import Header from "../../components/Header";
import PageTitle from "../../components/pageTitle";
import ListaRegistros from "../../components/listaRegistros";

import { getOrdemMateriais } from "../../services/ordemMaterialService";

export default function OrdemMateriais() {
  const [materiais, setMateriais] = useState([]);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    try {
      const response = await getOrdemMateriais();

      if (response) {
        setMateriais(response.data);
      }
    } catch (err) {
      console.error("Erro ao carregar materiais das ordens:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  if (loading) {
    return <p className="p-6 text-[#697385]">Carregando materiais das ordens...</p>;
  }

  return (
    <div className="min-h-screen bg-[#EBECF7] flex flex-col">
      <Header />

      <div className="w-full max-w-6xl mx-auto p-4 md:p-6 flex flex-col gap-6">
        <PageTitle title="Materiais por Ordem" subtitle="Consumo previsto e realizado por ordem" />

        <ListaRegistros
          title="Materiais por Ordem"
          items={materiais}
          idField="pk_ordemMaterialID"
          getTitle={(item) => `${item.ordem} - ${item.materia}`}
          emptyMessage="Nenhum material vinculado a ordens"
          fields={[
            { label: "Ordem", value: "ordem" },
            { label: "Peça", value: "peca" },
            { label: "Material", value: "materia" },
            { label: "Unidade", value: "unidadeMedida" },
            { label: "Quantidade prevista", value: "quantidadePrevista" },
            { label: "Quantidade consumida", value: "quantidadeConsumida" },
          ]}
        />
      </div>
    </div>
  );
}

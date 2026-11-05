"use client";

import { useEffect, useState } from "react";

import Header from "../../components/Header";
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
    return <p className="p-6">Carregando materiais das ordens...</p>;
  }

  return (
    <div className="min-h-screen bg-[#F9F7F4] flex flex-col">
      <Header />

      <div className="p-6 flex flex-col gap-6">
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

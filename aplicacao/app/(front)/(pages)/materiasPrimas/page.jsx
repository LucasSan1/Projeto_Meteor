"use client";

import { useEffect, useState } from "react";

import Header from "../../components/Header";
import Card from "../../components/Card";
import ModalIncluir from "../../components/modalIncluir";
import ModalDesativados from "../../components/modalDesativados";
import { formatData } from "../../../utils/Datetime";

import Swal from "sweetalert2";

import {
  getMateriasPrimas,
  createMateriaPrima,
  updateMateriaPrima,
  deleteMateriaPrima,
  activateMateriaPrima,
} from "../../services/materiaPrimaService";

import { getFornecedore } from "../../services/fornecedoreServices";

export default function MateriasPrimas() {
  const [materias, setMaterias] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalAddOpen, setModalAddOpen] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [showDesativados, setShowDesativados] = useState(false);

  const [materiaSelecionada, setMateriaSelecionada] = useState(null);

  const materiaFields = [
    {
      name: "materia",
      label: "Matéria-prima",
      type: "text",
    },
    {
      name: "fornecedor",
      label: "Fornecedor",
      type: "select",
      options: fornecedores,
    },
    {
      name: "unidadeMedida",
      label: "Unidade de Medida (kg, m, un...)",
      type: "text",
    },
    {
      name: "estoqueMinimo",
      label: "Estoque Mínimo",
      type: "number",
      step: "0.001",
    },
    {
      name: "quantidadeEstoque",
      label: "Quantidade em Estoque",
      type: "number",
      step: "0.001",
    },
    {
      name: "dataUltimaCompra",
      label: "Data da Última Compra",
      type: "date",
    },
  ];

  async function carregar() {
    try {
      const [materiasRes, fornecedoresRes] = await Promise.all([
        getMateriasPrimas(),
        getFornecedore(),
      ]);

      if (materiasRes) {
        setMaterias(materiasRes.data);
      }

      if (fornecedoresRes) {
        setFornecedores(
          fornecedoresRes.data
            .filter((f) => f.status === "Ativo")
            .map((f) => ({
              value: f.pk_fornecedorID,
              label: f.nomeFornecedor,
            })),
        );
      }
    } catch (err) {
      console.error("Erro ao carregar matérias-primas:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleCreateMateria(data) {
    try {
      const response = await createMateriaPrima(data);

      if (!response) return;

      setModalAddOpen(false);

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Matéria-prima cadastrada!",
        showConfirmButton: false,
        timer: 2500,
      });

      await carregar();
    } catch (err) {
      console.error("Erro ao criar matéria-prima:", err);
    }
  }

  async function handleEditMateria(data) {
    try {
      const response = await updateMateriaPrima(
        materiaSelecionada.pk_materiaID,
        data,
      );

      if (!response) return;

      setModalEditOpen(false);
      setMateriaSelecionada(null);

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Matéria-prima atualizada!",
        showConfirmButton: false,
        timer: 2500,
      });

      await carregar();
    } catch (err) {
      console.error("Erro ao editar matéria-prima:", err);
    }
  }

  async function handleDeleteMateria(materia) {
    const result = await Swal.fire({
      title: "Desativar matéria-prima?",
      text: `Deseja desativar "${materia.materia}"?`,
      icon: "warning",

      showCancelButton: true,

      confirmButtonText: "Sim, desativar",
      cancelButtonText: "Cancelar",

      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await deleteMateriaPrima(materia.pk_materiaID);

      if (!response) return;

      await carregar();

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Matéria-prima desativada!",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (err) {
      console.error("Erro ao desativar matéria-prima:", err);
    }
  }

  async function handleActivateMateria(id) {
    try {
      const response = await activateMateriaPrima(id);

      if (!response) return;

      await carregar();

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Matéria-prima ativada!",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (err) {
      console.error("Erro ao ativar matéria-prima:", err);
    }
  }

  function abrirEdicao(materia) {
    setMateriaSelecionada({
      ...materia,
      fornecedor: materia.fk_fornecedor,
    });
    setModalEditOpen(true);
  }

  if (loading) {
    return <p className="p-6">Carregando matérias-primas...</p>;
  }

  const ativas = materias.filter((m) => m.status === "Ativo");
  const inativas = materias.filter((m) => m.status === "Desativado");

  return (
    <div className="min-h-screen bg-[#F9F7F4] flex flex-col">
      <Header />

      <div className="p-6 flex flex-col gap-6">
        <div className="flex justify-end">
          <button
            onClick={() => setShowDesativados(true)}
            className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700"
          >
            Mostrar desativadas
          </button>
        </div>

        {ativas.length === 0 ? (
          <p className="text-gray-500 text-center">
            Nenhuma matéria-prima ativa encontrada
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {ativas.map((materia) => {
              const estoqueBaixo =
                Number(materia.quantidadeEstoque) <=
                Number(materia.estoqueMinimo);

              return (
                <Card key={materia.pk_materiaID} title={materia.materia}>
                  <p className="text-sm text-black">
                    Fornecedor: {materia.fornecedor}
                  </p>

                  <p className="text-sm text-black">
                    Unidade: {materia.unidadeMedida}
                  </p>

                  <p className="text-sm text-black">
                    Estoque: {materia.quantidadeEstoque} / mínimo{" "}
                    {materia.estoqueMinimo}
                  </p>

                  {estoqueBaixo && (
                    <p className="text-sm text-red-600 font-semibold">
                      Estoque abaixo do mínimo!
                    </p>
                  )}

                  <p className="text-sm text-black">
                    Última compra: {formatData(materia.dataUltimaCompra)}
                  </p>

                  <p className="text-sm text-black">Status: {materia.status}</p>

                  <div className="flex gap-2 mt-3 flex-wrap">
                    <button
                      onClick={() => abrirEdicao(materia)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => handleDeleteMateria(materia)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Desativar
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <button
        onClick={() => setModalAddOpen(true)}
        className="
          fixed
          bottom-6
          right-6
          w-14
          h-14
          bg-green-600
          text-white
          text-2xl
          rounded-full
          shadow-lg
          hover:bg-green-700
          flex
          items-center
          justify-center
          z-50
        "
      >
        +
      </button>

      {modalAddOpen && (
        <ModalIncluir
          title="Nova Matéria-prima"
          fields={materiaFields}
          onSubmit={handleCreateMateria}
          onClose={() => setModalAddOpen(false)}
        />
      )}

      {modalEditOpen && materiaSelecionada && (
        <ModalIncluir
          title="Editar Matéria-prima"
          fields={materiaFields}
          initialData={materiaSelecionada}
          onSubmit={handleEditMateria}
          onClose={() => {
            setModalEditOpen(false);
            setMateriaSelecionada(null);
          }}
        />
      )}

      {showDesativados && (
        <ModalDesativados
          title="Matérias-primas Desativadas"
          items={inativas}
          displayFields={[
            { label: "Matéria", value: "materia" },
            { label: "Fornecedor", value: "fornecedor" },
            { label: "Unidade", value: "unidadeMedida" },
          ]}
          idField="pk_materiaID"
          onActivate={handleActivateMateria}
          onClose={() => setShowDesativados(false)}
        />
      )}
    </div>
  );
}

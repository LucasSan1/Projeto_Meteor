"use client";

import { useEffect, useState } from "react";

import Header from "../../components/Header";
import Card from "../../components/Card";
import PageTitle from "../../components/pageTitle";
import ModalIncluir from "../../components/modalIncluir";
import ModalDesativados from "../../components/modalDesativados";

import Swal from "sweetalert2";

import {
  getFornecedore,
  createFornecedor,
  updateFornecedor,
  deleteFornecedor,
  activateFornecedor,
} from "../../services/fornecedoreServices";

export default function Fornecedores() {
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);

  // MODAIS
  const [modalAddOpen, setModalAddOpen] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [showDesativados, setShowDesativados] = useState(false);

  const [fornecedorSelecionado, setFornecedorSelecionado] = useState(null);

  // Campos modal
  const fornecedorFields = [
    {
      name: "nome",
      label: "Nome do Fornecedor",
      type: "text",
    },
    {
      name: "cnpj",
      label: "CNPJ (somente números)",
      type: "text",
    },
    {
      name: "endereco",
      label: "Endereço",
      type: "text",
    },
    {
      name: "contato",
      label: "Contato",
      type: "text",
    },
    {
      name: "avaliacao",
      label: "Avaliação (0 a 9.9)",
      type: "number",
      step: "0.1",
    },
  ];

  async function carregar() {
    try {
      const res = await getFornecedore();

      if (res) {
        setFornecedores(res.data);
      }
    } catch (err) {
      console.error("Erro ao carregar fornecedores:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  // Adicionar novo fornecedor
  async function handleCreateFornecedor(data) {
    try {
      const response = await createFornecedor(data);

      if (!response) return;

      setModalAddOpen(false);

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Fornecedor criado!",
        showConfirmButton: false,
        timer: 2500,
      });

      await carregar();
    } catch (err) {
      console.error(err);

      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível cadastrar.",
      });
    }
  }

  // Editar fornecedor
  async function handleEditFornecedor(data) {
    try {
      const response = await updateFornecedor(
        fornecedorSelecionado.pk_fornecedorID,
        data,
      );

      if (!response) return;

      setModalEditOpen(false);

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Fornecedor atualizado!",
        showConfirmButton: false,
        timer: 2500,
      });

      await carregar();
    } catch (err) {
      console.error(err);

      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível atualizar.",
      });
    }
  }

  // Deletar fornecedor (soft delete)
  async function handleDeleteFornecedor(fornecedor) {
    const result = await Swal.fire({
      title: "Desativar fornecedor?",
      text: `Deseja desativar "${fornecedor.nomeFornecedor}"?`,
      icon: "warning",

      showCancelButton: true,

      confirmButtonText: "Sim, desativar",
      cancelButtonText: "Cancelar",

      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await deleteFornecedor(fornecedor.pk_fornecedorID);

      // Se o backend barrou, o alerta já apareceu e não ta podendo deixar o toast de sucesso subir por baixo
      if (!response) return;

      await carregar();

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Fornecedor desativado!",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (err) {
      console.error(err);
    }
  }

  // Ativar fornecedor
  async function handleActivateFornecedor(fornecedor) {
    try {
      const response = await activateFornecedor(fornecedor.pk_fornecedorID);

      if (!response) return;

      await carregar();

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Fornecedor ativado!",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (err) {
      console.error(err);
    }
  }

  // Abrir edição
  function openEditModal(fornecedor) {
    setFornecedorSelecionado(fornecedor);
    setModalEditOpen(true);
  }

  if (loading) {
    return <p className="p-6 text-[#697385]">Carregando fornecedores...</p>;
  }

  // Filtros
  const fornecedoresAtivos = fornecedores.filter((f) => f.status === "Ativo");
  const fornecedoresInativos = fornecedores.filter(
    (f) => f.status === "Desativado",
  );

  return (
    <div className="min-h-screen bg-[#EBECF7] flex flex-col">
      <Header />

      <div className="w-full max-w-6xl mx-auto p-4 md:p-6 flex flex-col gap-8">
        <PageTitle
          title="Fornecedores"
          subtitle="Parceiros de matéria-prima e suprimentos"
        >
          <button
            onClick={() => setShowDesativados(true)}
            className="px-4 py-2 rounded border border-[#334E7F]/30 bg-white text-[#334E7F] font-semibold hover:bg-[#334E7F]/10 transition-colors"
          >
            Mostrar desativados
          </button>
        </PageTitle>

        <Section
          title="Fornecedores"
          fornecedores={fornecedoresAtivos}
          tipo="ativos"
          onDelete={handleDeleteFornecedor}
          onActivate={handleActivateFornecedor}
          onEdit={openEditModal}
        />
      </div>

      <button
        onClick={() => setModalAddOpen(true)}
        className="
          fixed
          bottom-6
          right-6
          w-14
          h-14
          bg-[#2E9B5E]
          text-white
          text-3xl
          leading-none
          rounded-full
          shadow-xl
          transition-all
          hover:scale-105
          hover:bg-[#27844F]
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
          title="Novo Fornecedor"
          fields={fornecedorFields}
          onSubmit={handleCreateFornecedor}
          onClose={() => setModalAddOpen(false)}
        />
      )}

      {modalEditOpen && (
        <ModalIncluir
          title="Editar Fornecedor"
          fields={fornecedorFields}
          initialData={{
            nome: fornecedorSelecionado.nomeFornecedor,
            cnpj: fornecedorSelecionado.cnpj,
            endereco: fornecedorSelecionado.endereco,
            contato: fornecedorSelecionado.contato,
            avaliacao: fornecedorSelecionado.avaliacao,
          }}
          onSubmit={handleEditFornecedor}
          onClose={() => setModalEditOpen(false)}
        />
      )}

      {showDesativados && (
        <ModalDesativados
          title="Fornecedores Desativados"
          items={fornecedoresInativos}
          displayFields={[
            {
              label: "Fornecedor",
              value: "nomeFornecedor"
            }, 
            {
              label: "CNPJ",
              value: "cnpj"
            },
            {
              label: "Endereço",
              value: "endereco"
            },
            {
              label: "Contato",
              value: "contato"
            }
          ]}
          idField="pk_fornecedorID"
          onActivate={(id) =>
            handleActivateFornecedor(
              fornecedores.find((f) => f.pk_fornecedorID === id),
            )
          }
          onClose={() => setShowDesativados(false)}
        />
      )}
    </div>
  );
}

function Section({ title, fornecedores, onDelete, onActivate, onEdit }) {
  const [open, setOpen] = useState(true);

  if (fornecedores.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <h2 className="text-xl font-bold text-[#11284F]">
          {title} ({fornecedores.length})
        </h2>
      </div>

      {open && (
        <div className="flex flex-col gap-4">
          {fornecedores.map((fornecedor) => (
            <Card
              key={fornecedor.pk_fornecedorID}
              title={fornecedor.nomeFornecedor}
            >
              <p className="text-sm text-[#334E7F]">
                CNPJ: {fornecedor.cnpj}
              </p>

              <p className="text-sm text-[#334E7F]">
                Endereço: {fornecedor.endereco}
              </p>

              <p className="text-sm text-[#334E7F]">
                Contato: {fornecedor.contato}
              </p>

              <p className="text-sm text-[#334E7F]">
                Avaliação: {fornecedor.avaliacao}
              </p>

              <p className="text-sm text-[#334E7F]">Status: {fornecedor.status}</p>

              <div className="flex gap-2 mt-3 flex-wrap">
                <button
                  onClick={() => onEdit(fornecedor)}
                  className="bg-[#334E7F] text-white px-3 py-1 rounded font-semibold transition-colors hover:bg-[#28406b]"
                >
                  Editar
                </button>

                <button
                  onClick={() => onDelete(fornecedor)}
                  className="bg-[#C94545] text-white px-3 py-1 rounded font-semibold transition-colors hover:bg-[#AD3A3A]"
                >
                  Desativar
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

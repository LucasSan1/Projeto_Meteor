"use client";

import { useEffect, useState } from "react";

import Header from "../../components/Header";
import Card from "../../components/Card";
import ModalIncluir from "../../components/modalIncluir";

import Swal from "sweetalert2";

import { getFornecedores, createFornecedor, updateFornecedor, deleteFornecedor, activateFornecedor } from "../../services/fornecedoresServices";

export default function Fornecedores() {
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);

  // MODAIS
  const [modalAddOpen, setModalAddOpen] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(false);

  const [fornecedorSelecionado, setFornecedorSelecionado] = useState(null);

  // Campos modal
  const fornecedorFields = [
    {
      name: "nome",
      label: "Nome do Fornecedor",
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
      label: "Avaliação",
      type: "number",
    },
  ];

  async function carregar() {
    try {
      const res = await getFornecedores();

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
      await createFornecedor(data);

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
      await updateFornecedor(fornecedorSelecionado.pk_fornecedorID, data);

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
      await deleteFornecedor(fornecedor.pk_fornecedorID);

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
      await activateFornecedor(fornecedor.pk_fornecedorID);

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
    return <p className="p-6">Carregando fornecedores...</p>;
  }

  // Filtros
  const ativos = fornecedores.filter((f) => f.status === "Ativo");
  const desativados = fornecedores.filter((f) => f.status === "Desativado");

  return (
    <div className="min-h-screen bg-[#F9F7F4] flex flex-col">
      <Header />

      <div className="p-6 flex flex-col gap-8">
        <Section
          title="Fornecedores Ativos"
          fornecedores={ativos}
          tipo="ativos"
          onDelete={handleDeleteFornecedor}
          onActivate={handleActivateFornecedor}
          onEdit={openEditModal}
        />

        <Section
          title="Fornecedores Desativados"
          fornecedores={desativados}
          tipo="desativados"
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
            endereco: fornecedorSelecionado.endereco,
            contato: fornecedorSelecionado.contato,
            avaliacao: fornecedorSelecionado.avaliacao,
          }}
          onSubmit={handleEditFornecedor}
          onClose={() => setModalEditOpen(false)}
        />
      )}
    </div>
  );
}

function Section({ title, fornecedores, tipo, onDelete, onActivate, onEdit }) {
  const [open, setOpen] = useState(true);

  if (fornecedores.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <h2 className="text-xl font-bold text-[#4E342E]">
          {title} ({fornecedores.length})
        </h2>

        <span className="text-lg text-black">{open ? "-" : "+"}</span>
      </div>

      {open && (
        <div className="flex flex-col gap-4">
          {fornecedores.map((fornecedor) => (
            <Card
              key={fornecedor.pk_fornecedorID}
              title={fornecedor.nomeFornecedor}
            >
              <p className="text-sm text-black">
                Endereço: {fornecedor.endereco}
              </p>

              <p className="text-sm text-black">
                Contato: {fornecedor.contato}
              </p>

              <p className="text-sm text-black">
                Avaliação: {fornecedor.avaliacao}
              </p>

              <p className="text-sm text-black">Status: {fornecedor.status}</p>

              <div className="flex gap-2 mt-3 flex-wrap">
                {tipo === "ativos" && (
                  <>
                    <button
                      onClick={() => onEdit(fornecedor)}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => onDelete(fornecedor)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Desativar
                    </button>
                  </>
                )}

                {tipo === "desativados" && (
                  <button
                    onClick={() => onActivate(fornecedor)}
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                  >
                    Reativar
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

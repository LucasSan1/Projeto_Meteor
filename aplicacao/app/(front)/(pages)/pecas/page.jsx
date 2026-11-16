"use client";

import { useEffect, useState } from "react";

import Header from "../../components/Header";
import PageTitle from "../../components/pageTitle";
import Card from "../../components/Card";
import ModalIncluir from "../../components/modalIncluir";
import ModalDesativados from "../../components/modalDesativados";

import Swal from "sweetalert2";

import {
  getPecas,
  createPeca,
  deletePeca,
  activatePeca,
  updatePeca,
} from "../../services/pecaService";

export default function Pecas() {
  const [pecas, setPecas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPeca, setEditingPeca] = useState(null);

  // MODAIS
  const [modalAddOpen, setModalAddOpen] = useState(false);
  const [showDesativadas, setShowDesativadas] = useState(false);

  // Campos modal
  const pecaFields = [
    {
      name: "peca",
      label: "Nome da Peça",
      type: "text",
    },
    {
      name: "peso",
      label: "Peso",
      type: "text",
    },
    {
      name: "dimensoes",
      label: "Dimensões",
      type: "text",
    },
  ];

  async function carregar() {
    try {
      const pecasRes = await getPecas();

      if (pecasRes) {
        setPecas(pecasRes.data);
      }
    } catch (err) {
      console.error("Erro ao carregar peças:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  // Criar nova peça
  async function handleCreatePeca(data) {
    try {
      await createPeca(data);

      setModalAddOpen(false);

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Peça criada com sucesso!",
        showConfirmButton: false,
        timer: 2500,
      });

      await carregar();
    } catch (err) {
      console.error("Erro ao criar peça:", err);

      Swal.fire({
        icon: "error",
        title: "Erro ao criar peça",
        text: "Não foi possível cadastrar a peça.",
      });
    }
  }

  // Desativar peça
  async function handleDeletePeca(peca) {
    const result = await Swal.fire({
      title: "Desativar peça?",
      text: `Deseja desativar "${peca.peca}"?`,
      icon: "warning",

      showCancelButton: true,

      confirmButtonText: "Sim, desativar",
      cancelButtonText: "Cancelar",

      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) return;

    try {
      await deletePeca(peca.pk_pecaID);

      await carregar();

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Peça desativada!",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (err) {
      console.error("Erro ao desativar peça:", err);

      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível desativar a peça.",
      });
    }
  }

  // Ativar peça
  async function handleActivatePeca(id) {
    try {
      await activatePeca(id);

      await carregar();

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Peça ativada!",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (err) {
      console.error("Erro ao ativar peça:", err);

      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível ativar a peça.",
      });
    }
  }

  // Atualizar Peça
  async function handleUpdatePeca(data) {
    try {
      await updatePeca(editingPeca.pk_pecaID, data);

      setEditingPeca(null);
      setModalAddOpen(false);

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Peça atualizada!",
        showConfirmButton: false,
        timer: 2500,
      });

      await carregar();
    } catch (err) {
      console.error("Erro ao atualizar peça:", err);

      Swal.fire({
        icon: "error",
        title: "Erro ao atualizar peça",
        text: "Não foi possível atualizar a peça.",
      });
    }
  }

  function abrirEdicao(peca) {
    setEditingPeca(peca);

    setModalAddOpen(true);
  }

  if (loading) {
    return <p className="p-6 text-[#697385]">Carregando peças...</p>;
  }

  // FILTROS
  const ativas = pecas.filter((p) => p.status === "Ativo");
  const desativadas = pecas.filter((p) => p.status === "Desativado");

  return (
    <div className="min-h-screen bg-[#EBECF7] flex flex-col">
      <Header />

      <div className="w-full max-w-6xl mx-auto p-4 md:p-6 flex flex-col gap-6">
        <PageTitle title="Peças" subtitle="Catálogo de peças fabricadas">
          <button
            onClick={() => setShowDesativadas(true)}
            className="px-4 py-2 rounded border border-[#334E7F]/30 bg-white text-[#334E7F] font-semibold hover:bg-[#334E7F]/10 transition-colors"
          >
            Ver Desativadas
          </button>
        </PageTitle>

        <Section
          title="Peças Ativas"
          pecas={ativas}
          onDelete={handleDeletePeca}
          onEdit={abrirEdicao}
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
          title={editingPeca ? "Editar Peça" : "Nova Peça"}
          fields={pecaFields}
          initialData={editingPeca}
          onSubmit={editingPeca ? handleUpdatePeca : handleCreatePeca}
          onClose={() => {
            setModalAddOpen(false);
            setEditingPeca(null);
          }}
        />
      )}

      {showDesativadas && (
        <ModalDesativados
          title="Peças Desativadas"
          items={desativadas}
          idField="pk_pecaID"
          displayFields={[
            {
              label: "Peça",
              value: "peca",
            },
            {
              label: "Peso",
              value: "peso",
            },
            {
              label: "Dimensões",
              value: "dimensoes",
            },
          ]}
          onActivate={handleActivatePeca}
          onClose={() => setShowDesativadas(false)}
        />
      )}
    </div>
  );
}

// SECTION
function Section({ title, pecas, onDelete, onEdit }) {
  const [open, setOpen] = useState(true);

  if (pecas.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <h2 className="text-xl font-bold text-[#11284F]">
          {title} ({pecas.length})
        </h2>

        <span className="w-7 h-7 rounded-full bg-white border border-[#334E7F]/15 text-[#334E7F] flex items-center justify-center text-base leading-none">{open ? "-" : "+"}</span>
      </div>

      {open && (
        <div className="flex flex-col gap-4">
          {pecas.map((peca) => (
            <Card key={peca.pk_pecaID} title={peca.peca}>
              {peca.peso && (
                <p className="text-sm text-[#334E7F]">Peso: {peca.peso}</p>
              )}

              {peca.dimensoes && (
                <p className="text-sm text-[#334E7F]">
                  Dimensões: {peca.dimensoes}
                </p>
              )}

              <p className="text-sm text-[#334E7F]">Status: {peca.status}</p>

              <div className="flex gap-2 mt-3 flex-wrap">
                <button
                  onClick={() => onEdit(peca)}
                  className="bg-[#334E7F] text-white px-3 py-1 rounded font-semibold transition-colors hover:bg-[#28406b]"
                >
                  Editar
                </button>

                <button
                  onClick={() => onDelete(peca)}
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

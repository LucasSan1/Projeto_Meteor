"use client";

import { useEffect, useState } from "react";

import Header from "../../components/Header";
import PageTitle from "../../components/pageTitle";
import Card from "../../components/Card";
import ModalIncluir from "../../components/modalIncluir";
import ModalDesativados from "../../components/modalDesativados";

import Swal from "sweetalert2";

import { getMaquina, createMaquina, getEquipamento, deleteMaquina, updateMaquina } from "../../services/maquinasService";

import { formatData } from "../../../utils/Datetime";

export default function Maquinas() {
  const [maquinas, setMaquinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [equipamentos, setEquipamentos] = useState([]);

  const [modalAddOpen, setModalAddOpen] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [showDesativados, setShowDesativados] = useState(false);

  const [maquinaSelecionada, setMaquinaSelecionada] = useState(null);

  const maquinaFields = [
    {
      name: "nomeMaquina",
      label: "Nome da Máquina",
      type: "text",
    },
    {
      name: "descricao",
      label: "Descrição",
      type: "text",
    },
    {
      name: "capacidadeMaxima",
      label: "Capacidade Máxima",
      type: "text",
    },
    {
      name: "ultimaManutencao",
      label: "Última Manutenção",
      type: "date",
    },
    {
      name: "equipamento",
      label: "Equipamento",
      type: "select",
      options: [{ value: "", label: "Selecione um equipamento" }, ...equipamentos]
      
    },
  ];

  async function carregar() {
    try {
      const [maquinasRes, equipamentosRes] = await Promise.all([
        getMaquina(),
        getEquipamento(),
      ]);

      if (maquinasRes) {
        setMaquinas(maquinasRes.data);
      }

      if (equipamentosRes) {
        const options = equipamentosRes.data
          .filter((e) => e.status === "Ativo")
          .map((e) => ({
            value: e.pk_equipamentoID,
            label: e.nomeEquipamento,
          }));

        setEquipamentos(options);
      }
    } catch (err) {
      console.error("Erro ao carregar máquinas:", err);

      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível carregar os dados.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleCreateMaquina(data) {
    try {
      await createMaquina(data);

      setModalAddOpen(false);

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Máquina cadastrada!",
        showConfirmButton: false,
        timer: 2500,
      });

      await carregar();
    } catch (err) {
      console.error("Erro ao criar máquina:", err);
    }
  }

  async function handleEditMaquina(data) {
    try {
      const response = await updateMaquina(maquinaSelecionada.pk_maquinaID, data);

      if (!response) return;

      setModalEditOpen(false);
      setMaquinaSelecionada(null);

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Máquina atualizada!",
        showConfirmButton: false,
        timer: 2500,
      });

      await carregar();
    } catch (err) {
      console.error("Erro ao editar máquina:", err);
    }
  }

  // IMPLEMENTAR DEPOIS
  async function handleDeleteMaquina(maquina) {
     const result = await Swal.fire({
          title: "Alterar status?",
          text: "Deseja alternar o status desta maquina?",
          icon: "question",
    
          showCancelButton: true,
    
          confirmButtonText: "Sim, alterar",
          cancelButtonText: "Cancelar",
    
          confirmButtonColor: "#f59e0b",
          cancelButtonColor: "#6b7280",
        });
    
        if (!result.isConfirmed) return;
    
        try {
          await deleteMaquina(maquina.pk_maquinaID);
    
          await Swal.fire({
            toast: true,
            position: "top-end",
    
            icon: "success",
            title: "Status alterado!",
    
            showConfirmButton: false,
            timer: 2000,
          });
    
          await carregar();
        } catch (err) {
          console.error("Erro ao alterar status: ", err);
    
          Swal.fire({
            icon: "error",
            title: "Erro ao alterar status",
            text: "Não foi possível alterar o status da maquina.",
          });
        }

  }

  // IMPLEMENTAR DEPOIS
  async function handleActivateMaquina(id) {

  }

  function openEditModal(maquina) {
    setMaquinaSelecionada(maquina);
    setModalEditOpen(true);
  }

  if (loading) {
    return <p className="p-6 text-[#697385]">Carregando máquinas...</p>;
  }

  const maquinasAtivas = maquinas.filter((m) => m.status === "Ativo");

  const maquinasInativas = maquinas.filter((m) => m.status === "Desativado");

  return (
    <div className="min-h-screen bg-[#EBECF7] flex flex-col">
      <Header />

      <div className="w-full max-w-6xl mx-auto p-4 md:p-6 flex flex-col gap-8">
        <PageTitle title="Máquinas" subtitle="Capacidade instalada e manutenções">
          <button
            onClick={() => setShowDesativados(true)}
            className="px-4 py-2 rounded border border-[#334E7F]/30 bg-white text-[#334E7F] font-semibold hover:bg-[#334E7F]/10 transition-colors"
          >
            Mostrar desativados
          </button>
        </PageTitle>

        <Section
          title="Máquinas"
          maquinas={maquinasAtivas}
          onEdit={openEditModal}
          onDelete={handleDeleteMaquina}
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
          title="Nova Máquina"
          fields={maquinaFields}
          onSubmit={handleCreateMaquina}
          onClose={() => setModalAddOpen(false)}
        />
      )}

      {modalEditOpen && maquinaSelecionada && (
        <ModalIncluir
          title="Editar Máquina"
          fields={maquinaFields}
          initialData={{
            ...maquinaSelecionada,
            equipamento: maquinaSelecionada.fk_equipamentoID,
            ultimaManutencao: maquinaSelecionada.ultimaManutencao
              ? String(maquinaSelecionada.ultimaManutencao).slice(0, 10)
              : "",
          }}
          onSubmit={handleEditMaquina}
          onClose={() => {
            setModalEditOpen(false);
            setMaquinaSelecionada(null);
          }}
        />
      )}

      {showDesativados && (
        <ModalDesativados
          title="Máquinas Desativadas"
          items={maquinasInativas}
          displayFields={[
            {
              label: "Máquina",
              value: "nomeMaquina",
            },
            {
              label: "Capacidade",
              value: "capacidadeMaxima",
            },
            {
              label: "Equipamento ID",
              value: "fk_equipamentoID",
            },
          ]}
          idField="pk_maquinaID"
          onActivate={(id) =>
            handleDeleteMaquina(
              maquinas.find((m) => m.pk_maquinaID === id),
            )
          }
          onClose={() => setShowDesativados(false)}
        />
      )}
    </div>
  );
}

function Section({ title, maquinas, onEdit, onDelete }) {
  const [open, setOpen] = useState(true);

  if (maquinas.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div
        onClick={() => setOpen(!open)}
        className="
          flex
          items-center
          justify-between
          cursor-pointer
          select-none
        "
      >
        <h2 className="text-xl font-bold text-[#11284F]">
          {title} ({maquinas.length})
        </h2>
      </div>

      {open && (
        <div className="flex flex-col gap-4">
          {maquinas.map((maquina) => (
            <Card key={maquina.pk_maquinaID} title={maquina.nomeMaquina}>
              <p className="text-sm text-[#334E7F]">
                Descrição: {maquina.descricao}
              </p>

              <p className="text-sm text-[#334E7F]">
                Capacidade Máxima: {maquina.capacidadeMaxima}
              </p>

              <p className="text-sm text-[#334E7F]">
                Equipamento ID: {maquina.fk_equipamentoID}
              </p>

              {maquina.ultimaManutencao && (
                <p className="text-sm text-[#334E7F]">
                  Última Manutenção: {formatData(maquina.ultimaManutencao)}
                </p>
              )}

              <p className="text-sm text-[#334E7F]">Status: {maquina.status}</p>

              <div className="flex gap-2 mt-3 flex-wrap">
                <button
                  onClick={() => onEdit(maquina)}
                  className="
                    bg-[#334E7F]
                    text-white
                    px-3
                    py-1
                    rounded
                    hover:bg-[#28406b]
                  "
                >
                  Editar
                </button>

                <button
                  onClick={() => onDelete(maquina)}
                  className="
                    bg-[#C94545]
                    text-white
                    px-3
                    py-1
                    rounded
                    hover:bg-[#AD3A3A]
                  "
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

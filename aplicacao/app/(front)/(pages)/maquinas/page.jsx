"use client";

import { useEffect, useState } from "react";

import Header from "../../components/Header";
import Card from "../../components/Card";
import ModalIncluir from "../../components/modalIncluir";
import ModalDesativados from "../../components/modalDesativados";

import Swal from "sweetalert2";

import { getMaquina, createMaquina, getEquipamento, deleteMaquina } from "../../services/maquinasService";

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
      options: [{ values: "", label: "Selecione um equipamento", }, ...equipamentos, ]
      
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

  // IMPLEMENTAR DEPOIS
  async function handleEditMaquina(data) {}

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
    return <p className="p-6">Carregando máquinas...</p>;
  }

  const maquinasAtivas = maquinas.filter((m) => m.status === "Ativo");

  const maquinasInativas = maquinas.filter((m) => m.status === "Desativado");

  return (
    <div className="min-h-screen bg-[#F9F7F4] flex flex-col">
      <Header />

      <div className="p-6 flex flex-col gap-8">
        <div className="flex justify-end">
          <button
            onClick={() => setShowDesativados(true)}
            className="
              px-4
              py-2
              rounded
              bg-gray-600
              text-white
              hover:bg-gray-700
            "
          >
            Mostrar desativados
          </button>
        </div>

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
          initialData={maquinaSelecionada}
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
          onActivate={handleDeleteMaquina}
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
        <h2 className="text-xl font-bold text-[#4E342E]">
          {title} ({maquinas.length})
        </h2>
      </div>

      {open && (
        <div className="flex flex-col gap-4">
          {maquinas.map((maquina) => (
            <Card key={maquina.pk_maquinaID} title={maquina.nomeMaquina}>
              <p className="text-sm text-black">
                Descrição: {maquina.descricao}
              </p>

              <p className="text-sm text-black">
                Capacidade Máxima: {maquina.capacidadeMaxima}
              </p>

              <p className="text-sm text-black">
                Equipamento ID: {maquina.fk_equipamentoID}
              </p>

              {maquina.ultimaManutencao && (
                <p className="text-sm text-black">
                  Última Manutenção: {formatData(maquina.ultimaManutencao)}
                </p>
              )}

              <p className="text-sm text-black">Status: {maquina.status}</p>

              <div className="flex gap-2 mt-3 flex-wrap">
                <button
                  onClick={() => onEdit(maquina)}
                  className="
                    bg-blue-600
                    text-white
                    px-3
                    py-1
                    rounded
                    hover:bg-blue-700
                  "
                >
                  Editar
                </button>

                <button
                  onClick={() => onDelete(maquina)}
                  className="
                    bg-red-500
                    text-white
                    px-3
                    py-1
                    rounded
                    hover:bg-red-600
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

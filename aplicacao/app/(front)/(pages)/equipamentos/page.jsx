"use client";

import { useEffect, useState } from "react";

import Header from "../../components/Header";
import Card from "../../components/Card";
import ModalIncluir from "../../components/modalIncluir";
import ModalDesativados from "../../components/modalDesativados";
import { formatData } from "../../../utils/Datetime";

import Swal from "sweetalert2";

import {
  getEquipamentos,
  createEquipamentos,
  updateEquipamentos,
  deleteEquipamento,
  activateEquipamento,
} from "../../services/equipamentosService";

export default function Equipamentos() {

  const [equipamentos, setEquipamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalAddOpen, setModalAddOpen] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [showDesativados, setShowDesativados] = useState(false);

  const [equipamentoSelecionado, setEquipamentoSelecionado] = useState(null);

  // Campos Modal
  const fieldsEquipamento = [
    {
      name: "nome",
      label: "Nome",
      type: "text",
    },
    {
      name: "descricao",
      label: "Descrição",
      type: "text",
    },
    {
      name: "dataAquisicao",
      label: "Data de Aquisição",
      type: "date",
    },
    {
      name: "vidaUtil",
      label: "Vida Útil (dias)",
      type: "number",
    },
  ];

  async function carregar() {
    try {

      const response = await getEquipamentos();

      if (response) {
        setEquipamentos(response.data);
      }

    } catch (err) {

      console.error("Erro ao carregar equipamentos:", err);

      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao carregar equipamentos",
      });

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  // Criar Equipamento
  async function handleCreateEquipamento(data) {

    try {

      await createEquipamentos(data);

      setModalAddOpen(false);

      await Swal.fire({
        toast: true,
        position: "top-end",

        icon: "success",
        title: "Equipamento criado com sucesso!",

        showConfirmButton: false,
        timer: 2500,
      });

      await carregar();

    } catch (err) {

      console.error("Erro ao criar equipamento:", err);

      Swal.fire({
        icon: "error",
        title: "Erro ao criar equipamento",
        text: "Não foi possível cadastrar o equipamento.",
      });

    }
  }

  // Desativar
  async function handleDeactivate(id) {

    const result = await Swal.fire({
      title: "Desativar equipamento?",
      text: "Deseja realmente desativar este equipamento?",
      icon: "warning",

      showCancelButton: true,

      confirmButtonText: "Sim, desativar",
      cancelButtonText: "Cancelar",

      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) return;

    try {

      await deleteEquipamento(id);

      await carregar();

      await Swal.fire({
        toast: true,
        position: "top-end",

        icon: "success",
        title: "Equipamento desativado!",

        showConfirmButton: false,
        timer: 2000,
      });

    } catch (err) {

      console.error("Erro ao desativar equipamento:", err);

      Swal.fire({
        icon: "error",
        title: "Erro ao desativar",
        text: "Não foi possível desativar o equipamento.",
      });

    }
  }

  // Ativar
  async function handleActivate(id) {

    const result = await Swal.fire({
      title: "Ativar equipamento?",
      text: "Deseja reativar este equipamento?",
      icon: "question",

      showCancelButton: true,

      confirmButtonText: "Sim, ativar",
      cancelButtonText: "Cancelar",

      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) return;

    try {

      await activateEquipamento(id);

      await Swal.fire({
        toast: true,
        position: "top-end",

        icon: "success",
        title: "Equipamento ativado!",

        showConfirmButton: false,
        timer: 2000,
      });

      await carregar();

    } catch (err) {

      console.error("Erro ao ativar equipamento:", err);

      Swal.fire({
        icon: "error",
        title: "Erro ao ativar",
        text: "Não foi possível ativar o equipamento.",
      });

    }
  }

  // Editar
  async function handleEditEquipamento(data) {

    try {

      await updateEquipamentos(
        equipamentoSelecionado.pk_equipamentoID,
        data
      );

      setModalEditOpen(false);
      setEquipamentoSelecionado(null);

      await Swal.fire({
        toast: true,
        position: "top-end",

        icon: "success",
        title: "Equipamento atualizado!",

        showConfirmButton: false,
        timer: 2500,
      });

      await carregar();

    } catch (err) {

      console.error("Erro ao editar equipamento:", err);

      Swal.fire({
        icon: "error",
        title: "Erro ao atualizar equipamento",
        text: "Não foi possível atualizar o equipamento.",
      });

    }
  }

  // Filtros
  const equipamentosAtivos =
    equipamentos.filter((e) => e.status === "Ativo");

  const equipamentosInativos =
    equipamentos.filter((e) => e.status === "Desativado");

  if (loading) {
    return <p className="p-6">Carregando equipamentos...</p>;
  }

  return (

    <div className="min-h-screen bg-[#F9F7F4] flex flex-col">

      <Header />

      <div className="p-6 flex flex-col gap-6">

        <div className="flex justify-end">

          <button
            onClick={() => setShowDesativados(true)}
            className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700"
          >
            Mostrar desativados
          </button>

        </div>

        {equipamentosAtivos.length === 0 ? (

          <p className="text-gray-500 text-center">
            Nenhum equipamento ativo encontrado
          </p>

        ) : (

          <div className="flex flex-col gap-4">

            {equipamentosAtivos.map((equip) => (

              <Card
                key={equip.pk_equipamentoID}
                title={equip.nomeEquipamento}
              >

                <p className="text-sm text-black">
                  Descrição: {equip.descricao}
                </p>

                <p className="text-sm text-black">
                  Data Aquisição: {formatData(equip.dataAquisicao)}
                </p>

                <p className="text-sm text-black">
                  Vida Útil: {equip.vidaUtilRestante} dias
                </p>

                <div className="flex gap-2 mt-3">

                  <button
                    onClick={() => {
                      setEquipamentoSelecionado(equip);
                      setModalEditOpen(true);
                    }}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() =>
                      handleDeactivate(equip.pk_equipamentoID)
                    }
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Desativar
                  </button>

                </div>

              </Card>

            ))}

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
          title="Novo Equipamento"
          fields={fieldsEquipamento}
          onSubmit={handleCreateEquipamento}
          onClose={() => setModalAddOpen(false)}
        />

      )}

      {modalEditOpen && equipamentoSelecionado && (

        <ModalIncluir
          title="Editar Equipamento"
          fields={fieldsEquipamento}
          onSubmit={handleEditEquipamento}
          onClose={() => {
            setModalEditOpen(false);
            setEquipamentoSelecionado(null);
          }}
         initialData={{
            nome: equipamentoSelecionado?.nomeEquipamento || "",
            descricao: equipamentoSelecionado?.descricao || "",
            dataAquisicao: equipamentoSelecionado?.dataAquisicao || "",
            vidaUtil: equipamentoSelecionado?.vidaUtilRestante || "",
            }}
        />

      )}

      {showDesativados && (

        <ModalDesativados
          title="Equipamentos Desativados"
          items={equipamentosInativos}
          displayFields={[
            {
              label: "Nome",
              value: "nomeEquipamento",
            },
            {
              label: "Descrição",
              value: "descricao",
            },
          ]}
          idField="pk_equipamentoID"
          onActivate={handleActivate}
          onClose={() => setShowDesativados(false)}
        />

      )}

    </div>

  );

}
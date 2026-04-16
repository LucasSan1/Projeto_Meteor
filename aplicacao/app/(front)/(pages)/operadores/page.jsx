"use client";

import { useEffect, useState } from "react";

import Header from "../../components/Header";
import Card from "../../components/Card";
import ModalIncluir from "../../components/modalIncluir";
import ModalDesativados from "../../components/modalDesativados";

import Swal from "sweetalert2";

import {
  getOperators,
  createOperator,
  deleteOperador,
  activateOperador,
} from "../../services/operadoresService";

export default function Operadores() {
  const [operadores, setOperadores] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalAddOpen, setModalAddOpen] = useState(false);
  const [showDesativados, setShowDesativados] = useState(false);

  // Campos modal
  const fieldsOperador = [
    {
      name: "nome",
      label: "Nome",
      type: "text",
    },
    {
      name: "especializacao",
      label: "Especialização",
      type: "text",
    },
  ];

  async function carregar() {
    try {
      const response = await getOperators();

      if (response) {
        setOperadores(response.data);
      }
    } catch (err) {
      console.error("Erro ao carregar operadores:", err);

      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao carregar operadores",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  // Criar novo Operador
  async function handleCreateOperador(data) {
    try {
      await createOperator(data);

      setModalAddOpen(false);

      await Swal.fire({
        toast: true,
        position: "top-end",

        icon: "success",
        title: "Operador criado com sucesso!",

        showConfirmButton: false,
        timer: 2500,
      });

      await carregar();
    } catch (err) {
      console.error("Erro ao criar operador:", err);

      Swal.fire({
        icon: "error",
        title: "Erro ao criar operador",
        text: "Não foi possível cadastrar o operador.",
      });
    }
  }

  // Desativar Operador
  async function handleDeactivate(id) {
    const result = await Swal.fire({
      title: "Desativar operador?",
      text: "Deseja realmente desativar este operador?",
      icon: "warning",

      showCancelButton: true,

      confirmButtonText: "Sim, desativar",
      cancelButtonText: "Cancelar",

      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) return;
    try {
      await deleteOperador(id);
      await carregar();

      await Swal.fire({
        toast: true,
        position: "top-end",

        icon: "success",
        title: "Operador desativado!",

        showConfirmButton: false,
        timer: 2000,
      });
    } catch (err) {
      console.error("Erro ao desativar operador:", err);

      Swal.fire({
        icon: "error",
        title: "Erro ao desativar",
        text: "Não foi possível desativar o operador.",
      });
    }
  }
  // Ativa o operador
  async function handleActivate(id) {
    const result = await Swal.fire({
      title: "Ativar operador?",
      text: "Deseja reativar este operador?",
      icon: "question",

      showCancelButton: true,

      confirmButtonText: "Sim, ativar",
      cancelButtonText: "Cancelar",

      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) return;

    try {
      await activateOperador(id);

      await Swal.fire({
        toast: true,
        position: "top-end",

        icon: "success",
        title: "Operador ativado!",

        showConfirmButton: false,
        timer: 2000,
      });

      await carregar();
    } catch (err) {
      console.error("Erro ao ativar operador:", err);

      Swal.fire({
        icon: "error",
        title: "Erro ao ativar",
        text: "Não foi possível ativar o operador.",
      });
    }
  }

  // Filtros
  const operadoresAtivos = operadores.filter((op) => op.status === "Ativo");
  const operadoresInativos = operadores.filter((op) => op.status === "Desativado");

  if (loading) {
    return <p className="p-6">Carregando operadores...</p>;
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

        {operadoresAtivos.length === 0 ? (
          <p className="text-gray-500 text-center">
            Nenhum operador ativo encontrado
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {operadoresAtivos.map((op) => (
              <Card key={op.pk_operadorID} title={op.nome}>
                <p className="text-sm text-black">
                  Especialização: {op.especializacao}
                </p>

                <p className="text-sm text-black">Status: {op.status}</p>

                <p className="text-sm text-black">
                  Disponibilidade: {op.disponibilidade}
                </p>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleDeactivate(op.pk_operadorID)}
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
          title="Novo Operador"
          fields={fieldsOperador}
          onSubmit={handleCreateOperador}
          onClose={() => setModalAddOpen(false)}
        />
      )}

      {showDesativados && (
        <ModalDesativados
          title="Operadores Desativados"
          items={operadoresInativos}
          displayFields={["nome", "especializacao"]}
          idField="pk_operadorID"
          onActivate={handleActivate}
          onClose={() => setShowDesativados(false)}
        />
      )}
    </div>
  );
}

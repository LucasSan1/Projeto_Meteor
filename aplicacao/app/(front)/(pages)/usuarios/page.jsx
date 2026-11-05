"use client";

import { useEffect, useState } from "react";

import Header from "../../components/Header";
import Card from "../../components/Card";
import ModalIncluir from "../../components/modalIncluir";
import ModalDesativados from "../../components/modalDesativados";

import Swal from "sweetalert2";

import {
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  activateUsuario,
} from "../../services/usuarioService";

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalAddOpen, setModalAddOpen] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [showDesativados, setShowDesativados] = useState(false);

  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);

  const usuarioFields = [
    {
      name: "nome",
      label: "Nome",
      type: "text",
    },
    {
      name: "email",
      label: "E-mail",
      type: "email",
    },
    {
      name: "cargo",
      label: "Cargo",
      type: "select",
      options: [
        { value: "gerente", label: "Gerente" },
        { value: "operador", label: "Operador" },
        { value: "mecanico", label: "Mecânico" },
      ],
    },
    {
      name: "senha",
      label: "Senha (deixe vazio pra manter na edição)",
      type: "password",
    },
  ];

  async function carregar() {
    try {
      const response = await getUsuarios();

      if (response) {
        setUsuarios(response.data);
      }
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleCreateUsuario(data) {
    try {
      const response = await createUsuario(data);

      if (!response) return;

      setModalAddOpen(false);

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Usuário criado com sucesso!",
        showConfirmButton: false,
        timer: 2500,
      });

      await carregar();
    } catch (err) {
      console.error("Erro ao criar usuário:", err);
    }
  }

  async function handleEditUsuario(data) {
    try {
      const response = await updateUsuario(usuarioSelecionado.id, data);

      if (!response) return;

      setModalEditOpen(false);
      setUsuarioSelecionado(null);

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Usuário atualizado!",
        showConfirmButton: false,
        timer: 2500,
      });

      await carregar();
    } catch (err) {
      console.error("Erro ao editar usuário:", err);
    }
  }

  async function handleDeleteUsuario(usuario) {
    const result = await Swal.fire({
      title: "Desativar usuário?",
      text: `Deseja desativar "${usuario.nome}"?`,
      icon: "warning",

      showCancelButton: true,

      confirmButtonText: "Sim, desativar",
      cancelButtonText: "Cancelar",

      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await deleteUsuario(usuario.id);

      if (!response) return;

      await carregar();

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Usuário desativado!",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (err) {
      console.error("Erro ao desativar usuário:", err);
    }
  }

  async function handleActivateUsuario(id) {
    try {
      const response = await activateUsuario(id);

      if (!response) return;

      await carregar();

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Usuário ativado!",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (err) {
      console.error("Erro ao ativar usuário:", err);
    }
  }

  function abrirEdicao(usuario) {
    setUsuarioSelecionado({
      ...usuario,
      senha: "",
    });
    setModalEditOpen(true);
  }

  if (loading) {
    return <p className="p-6">Carregando usuários...</p>;
  }

  const usuariosAtivos = usuarios.filter((u) => u.status === "Ativo");
  const usuariosInativos = usuarios.filter((u) => u.status === "Desativado");

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

        {usuariosAtivos.length === 0 ? (
          <p className="text-gray-500 text-center">
            Nenhum usuário ativo encontrado
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {usuariosAtivos.map((usuario) => (
              <Card key={usuario.id} title={usuario.nome}>
                <p className="text-sm text-black">E-mail: {usuario.email}</p>

                <p className="text-sm text-black">Cargo: {usuario.cargo}</p>

                <p className="text-sm text-black">Status: {usuario.status}</p>

                <div className="flex gap-2 mt-3 flex-wrap">
                  <button
                    onClick={() => abrirEdicao(usuario)}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => handleDeleteUsuario(usuario)}
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
          title="Novo Usuário"
          fields={usuarioFields}
          onSubmit={handleCreateUsuario}
          onClose={() => setModalAddOpen(false)}
        />
      )}

      {modalEditOpen && usuarioSelecionado && (
        <ModalIncluir
          title="Editar Usuário"
          fields={usuarioFields}
          initialData={usuarioSelecionado}
          onSubmit={handleEditUsuario}
          onClose={() => {
            setModalEditOpen(false);
            setUsuarioSelecionado(null);
          }}
        />
      )}

      {showDesativados && (
        <ModalDesativados
          title="Usuários Desativados"
          items={usuariosInativos}
          displayFields={[
            { label: "Nome", value: "nome" },
            { label: "E-mail", value: "email" },
            { label: "Cargo", value: "cargo" },
          ]}
          idField="id"
          onActivate={handleActivateUsuario}
          onClose={() => setShowDesativados(false)}
        />
      )}
    </div>
  );
}

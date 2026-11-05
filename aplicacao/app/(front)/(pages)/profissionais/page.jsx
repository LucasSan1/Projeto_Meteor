"use client";

import { useEffect, useState } from "react";

import Header from "../../components/Header";
import Card from "../../components/Card";
import ModalIncluir from "../../components/modalIncluir";
import ModalDesativados from "../../components/modalDesativados";

import Swal from "sweetalert2";

import {
  getProfissionais,
  createProfissional,
  updateProfissional,
  deleteProfissional,
  activateProfissional,
} from "../../services/profissionalService";

import { getUsuarios } from "../../services/usuarioService";

export default function Profissionais() {
  const [profissionais, setProfissionais] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalAddOpen, setModalAddOpen] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [showDesativados, setShowDesativados] = useState(false);

  const [profissionalSelecionado, setProfissionalSelecionado] = useState(null);

  const camposPerfil = [
    {
      name: "ehOperador",
      label: "É operador?",
      type: "select",
      options: [
        { value: "1", label: "Sim" },
        { value: "0", label: "Não" },
      ],
    },
    {
      name: "ehMecanico",
      label: "É mecânico?",
      type: "select",
      options: [
        { value: "1", label: "Sim" },
        { value: "0", label: "Não" },
      ],
    },
    {
      name: "especializacao",
      label: "Especialização",
      type: "text",
    },
    {
      name: "telefone",
      label: "Telefone",
      type: "text",
    },
  ];

  // Só entram na lista usuários que ainda não são profissionais
  const usuariosDisponiveis = usuarios
    .filter(
      (u) =>
        u.status === "Ativo" &&
        (u.cargo === "operador" || u.cargo === "mecanico") &&
        !profissionais.some((p) => p.fk_usuarioID === u.id),
    )
    .map((u) => ({
      value: u.id,
      label: `${u.nome} (${u.email})`,
    }));

  const camposCriacao = [
    {
      name: "usuario",
      label: "Usuário",
      type: "select",
      options: usuariosDisponiveis,
    },
    ...camposPerfil,
  ];

  async function carregar() {
    try {
      const [profissionaisRes, usuariosRes] = await Promise.all([
        getProfissionais(),
        getUsuarios(),
      ]);

      if (profissionaisRes) {
        setProfissionais(profissionaisRes.data);
      }

      if (usuariosRes) {
        setUsuarios(usuariosRes.data);
      }
    } catch (err) {
      console.error("Erro ao carregar profissionais:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleCreateProfissional(data) {
    try {
      const response = await createProfissional(data);

      if (!response) return;

      setModalAddOpen(false);

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Profissional cadastrado!",
        showConfirmButton: false,
        timer: 2500,
      });

      await carregar();
    } catch (err) {
      console.error("Erro ao criar profissional:", err);
    }
  }

  async function handleEditProfissional(data) {
    try {
      const response = await updateProfissional(
        profissionalSelecionado.pk_profissionalID,
        data,
      );

      if (!response) return;

      setModalEditOpen(false);
      setProfissionalSelecionado(null);

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Profissional atualizado!",
        showConfirmButton: false,
        timer: 2500,
      });

      await carregar();
    } catch (err) {
      console.error("Erro ao editar profissional:", err);
    }
  }

  async function handleDeleteProfissional(profissional) {
    const result = await Swal.fire({
      title: "Desativar profissional?",
      text: `Deseja desativar "${profissional.nome}"?`,
      icon: "warning",

      showCancelButton: true,

      confirmButtonText: "Sim, desativar",
      cancelButtonText: "Cancelar",

      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await deleteProfissional(
        profissional.pk_profissionalID,
      );

      if (!response) return;

      await carregar();

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Profissional desativado!",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (err) {
      console.error("Erro ao desativar profissional:", err);
    }
  }

  async function handleActivateProfissional(id) {
    try {
      const response = await activateProfissional(id);

      if (!response) return;

      await carregar();

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Profissional ativado!",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (err) {
      console.error("Erro ao ativar profissional:", err);
    }
  }

  function abrirEdicao(profissional) {
    setProfissionalSelecionado({
      ...profissional,
      ehOperador: profissional.ehOperador ? "1" : "0",
      ehMecanico: profissional.ehMecanico ? "1" : "0",
    });
    setModalEditOpen(true);
  }

  function descreverPapeis(profissional) {
    const papeis = [];

    if (profissional.ehOperador) papeis.push("Operador");
    if (profissional.ehMecanico) papeis.push("Mecânico");

    return papeis.join(" / ") || "-";
  }

  if (loading) {
    return <p className="p-6">Carregando profissionais...</p>;
  }

  const ativos = profissionais.filter((p) => p.status === "Ativo");
  const inativos = profissionais.filter((p) => p.status === "Desativado");

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

        {ativos.length === 0 ? (
          <p className="text-gray-500 text-center">
            Nenhum profissional ativo encontrado
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {ativos.map((profissional) => (
              <Card
                key={profissional.pk_profissionalID}
                title={profissional.nome}
              >
                <p className="text-sm text-black">
                  E-mail: {profissional.email}
                </p>

                <p className="text-sm text-black">
                  Papéis: {descreverPapeis(profissional)}
                </p>

                <p className="text-sm text-black">
                  Especialização: {profissional.especializacao || "-"}
                </p>

                <p className="text-sm text-black">
                  Telefone: {profissional.telefone || "-"}
                </p>

                <p className="text-sm text-black">
                  Status: {profissional.status}
                </p>

                <div className="flex gap-2 mt-3 flex-wrap">
                  <button
                    onClick={() => abrirEdicao(profissional)}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => handleDeleteProfissional(profissional)}
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
          title="Novo Profissional"
          fields={camposCriacao}
          onSubmit={handleCreateProfissional}
          onClose={() => setModalAddOpen(false)}
        />
      )}

      {modalEditOpen && profissionalSelecionado && (
        <ModalIncluir
          title="Editar Profissional"
          fields={camposPerfil}
          initialData={profissionalSelecionado}
          onSubmit={handleEditProfissional}
          onClose={() => {
            setModalEditOpen(false);
            setProfissionalSelecionado(null);
          }}
        />
      )}

      {showDesativados && (
        <ModalDesativados
          title="Profissionais Desativados"
          items={inativos}
          displayFields={[
            { label: "Nome", value: "nome" },
            { label: "E-mail", value: "email" },
            { label: "Especialização", value: "especializacao" },
          ]}
          idField="pk_profissionalID"
          onActivate={handleActivateProfissional}
          onClose={() => setShowDesativados(false)}
        />
      )}
    </div>
  );
}

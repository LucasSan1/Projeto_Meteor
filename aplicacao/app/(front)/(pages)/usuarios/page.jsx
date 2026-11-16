"use client";

import { useEffect, useState } from "react";

import Header from "../../components/Header";
import PageTitle from "../../components/pageTitle";
import Card from "../../components/Card";
import ModalUsuario from "../../components/modalUsuario";
import ModalDesativados from "../../components/modalDesativados";

import Swal from "sweetalert2";

import {
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  activateUsuario,
} from "../../services/usuarioService";

const CARGO_LABEL = {
  gerente: "Gestor",
  operador: "Operador",
  mecanico: "Mecânico",
};

function descreverPapeis(usuario) {
  const papeis = [];

  if (usuario.ehOperador) papeis.push("Operador");
  if (usuario.ehMecanico) papeis.push("Mecânico");

  return papeis.join(" / ") || "-";
}

function descreverDisponibilidade(usuario) {
  if (usuario.cargo === "gerente") return "-";
  if (usuario.statusProfissional !== "Ativo") return "Perfil desativado";
  if (usuario.emProducao) return "Em produção";
  if (usuario.emManutencao) return "Em manutenção";

  return "Disponível";
}

function classeDisponibilidade(usuario) {
  if (usuario.cargo === "gerente") return "text-[#334E7F]";
  if (usuario.statusProfissional !== "Ativo") return "text-[#697385]";
  if (usuario.emProducao || usuario.emManutencao) {
    return "text-[#C94545] font-semibold";
  }

  return "text-[#2E9B5E] font-semibold";
}

function SecaoUsuarios({
  titulo,
  usuarios,
  usuarioLogadoID,
  onEditar,
  onDesativar,
}) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-[#11284F]">
        {titulo} ({usuarios.length})
      </h2>

      {usuarios.length === 0 ? (
        <p className="text-[#697385] text-center">
          Nenhum registro ativo encontrado
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {usuarios.map((usuario) => (
            <Card key={usuario.id} title={usuario.nome}>
              <p className="text-sm text-[#334E7F]">E-mail: {usuario.email}</p>

              <p className="text-sm text-[#334E7F]">
                Cargo: {CARGO_LABEL[usuario.cargo] || usuario.cargo}
              </p>

              {usuario.cargo !== "gerente" && (
                <>
                  <p className="text-sm text-[#334E7F]">
                    Papéis: {descreverPapeis(usuario)}
                  </p>

                  <p className="text-sm text-[#334E7F]">
                    Especialização: {usuario.especializacao || "-"}
                  </p>

                  <p className="text-sm text-[#334E7F]">
                    Telefone: {usuario.telefone || "-"}
                  </p>

                  <p
                    className={`text-sm ${classeDisponibilidade(usuario)}`}
                  >
                    Disponibilidade: {descreverDisponibilidade(usuario)}
                  </p>
                </>
              )}

              <p className="text-sm text-[#334E7F]">Status: {usuario.status}</p>

              <div className="flex gap-2 mt-3 flex-wrap">
                <button
                  onClick={() => onEditar(usuario)}
                  className="bg-[#334E7F] text-white px-3 py-1 rounded font-semibold transition-colors hover:bg-[#28406b]"
                >
                  Editar
                </button>

                {Number(usuario.id) !== Number(usuarioLogadoID) && (
                  <button
                    onClick={() => onDesativar(usuario)}
                    className="bg-[#C94545] text-white px-3 py-1 rounded font-semibold transition-colors hover:bg-[#AD3A3A]"
                  >
                    Desativar
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

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [loading, setLoading] = useState(true);

  const [modalAddOpen, setModalAddOpen] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [showDesativados, setShowDesativados] = useState(false);

  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);

  async function carregar() {
    try {
      const response = await getUsuarios();

      if (response) {
        setUsuarios(response.data);
        setUsuarioLogado(response.usuarioLogado);
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
    setUsuarioSelecionado(usuario);
    setModalEditOpen(true);
  }

  if (loading) {
    return <p className="p-6 text-[#697385]">Carregando usuários...</p>;
  }

  const usuariosAtivos = usuarios.filter((u) => u.status === "Ativo");
  const usuariosInativos = usuarios.filter((u) => u.status === "Desativado");

  const gestores = usuariosAtivos.filter(
    (u) => u.cargo === "gerente" && Number(u.id) === Number(usuarioLogado?.id),
  );

  const operadores = usuariosAtivos.filter((u) => u.cargo === "operador");
  const mecanicos = usuariosAtivos.filter((u) => u.cargo === "mecanico");

  return (
    <div className="min-h-screen bg-[#EBECF7] flex flex-col">
      <Header />

      <div className="w-full max-w-6xl mx-auto p-4 md:p-6 flex flex-col gap-6">
        <PageTitle
          title="Usuários"
          subtitle="Contas, papéis e disponibilidade da equipe"
        >
          <button
            onClick={() => setShowDesativados(true)}
            className="px-4 py-2 rounded border border-[#334E7F]/30 bg-white text-[#334E7F] font-semibold hover:bg-[#334E7F]/10 transition-colors"
          >
            Mostrar desativados
          </button>
        </PageTitle>

        <SecaoUsuarios
          titulo="Gestores"
          usuarios={gestores}
          usuarioLogadoID={usuarioLogado?.id}
          onEditar={abrirEdicao}
          onDesativar={handleDeleteUsuario}
        />

        <SecaoUsuarios
          titulo="Operadores"
          usuarios={operadores}
          usuarioLogadoID={usuarioLogado?.id}
          onEditar={abrirEdicao}
          onDesativar={handleDeleteUsuario}
        />

        <SecaoUsuarios
          titulo="Mecânicos"
          usuarios={mecanicos}
          usuarioLogadoID={usuarioLogado?.id}
          onEditar={abrirEdicao}
          onDesativar={handleDeleteUsuario}
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
        <ModalUsuario
          title="Novo Usuário"
          onSubmit={handleCreateUsuario}
          onClose={() => setModalAddOpen(false)}
        />
      )}

      {modalEditOpen && usuarioSelecionado && (
        <ModalUsuario
          title="Editar Usuário"
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

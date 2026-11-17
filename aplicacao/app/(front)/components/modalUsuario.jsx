"use client";

import { useState } from "react";

import { IconeX } from "./icones";
import { mascararTelefone } from "../../utils/mascaras";

const CARGOS = [
  { value: "gerente", label: "Gerente" },
  { value: "operador", label: "Operador" },
  { value: "mecanico", label: "Mecânico" },
];

const SIM_NAO = [
  { value: "1", label: "Sim" },
  { value: "0", label: "Não" },
];

function textoFlag(valor) {
  return Number(valor) === 1 ? "1" : "0";
}

// Campo com rótulo, só pra não repetir a mesma estrutura em cada input
function Campo({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  );
}

// Cadastro único de usuário: conta + vínculo profissional no mesmo formulário
export default function ModalUsuario({
  title = "Usuário",
  initialData = null,
  onSubmit,
  onClose,
}) {
  const [formData, setFormData] = useState(() => ({
    nome: initialData?.nome ?? "",
    email: initialData?.email ?? "",
    cargo: initialData?.cargo ?? "operador",
    ehOperador: textoFlag(initialData?.ehOperador),
    ehMecanico: textoFlag(initialData?.ehMecanico),
    especializacao: initialData?.especializacao ?? "",
    telefone: mascararTelefone(initialData?.telefone),
  }));

  function handleChange(name, value) {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleCargo(cargo) {
    setFormData((prev) => ({
      ...prev,
      cargo,
      // O cargo já marca o papel principal; o outro fica livre pra quem acumula função
      ehOperador:
        cargo === "operador"
          ? "1"
          : cargo === "mecanico"
            ? "0"
            : prev.ehOperador,
      ehMecanico:
        cargo === "mecanico"
          ? "1"
          : cargo === "operador"
            ? "0"
            : prev.ehMecanico,
    }));
  }

  async function handleConfirm() {
    try {
      const payload = {
        nome: formData.nome,
        email: formData.email,
        cargo: formData.cargo,
      };

      if (formData.cargo !== "gerente") {
        payload.ehOperador = formData.ehOperador;
        payload.ehMecanico = formData.ehMecanico;
        payload.especializacao = formData.especializacao;
        payload.telefone = formData.telefone;
      }

      await onSubmit(payload);
    } catch (err) {
      console.error("Erro ao salvar usuário:", err);
    }
  }

  const ehGerente = formData.cargo === "gerente";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#334E7F]/10 flex-shrink-0">
          <h2 className="text-base font-semibold text-[#11284F]">{title}</h2>

          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-[#697385] hover:text-[#11284F] transition-colors"
          >
            <IconeX size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          <Campo label="Nome">
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
              className="campo"
            />
          </Campo>

          <Campo label="E-mail">
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="campo"
            />
          </Campo>

          <Campo label="Cargo">
            <select
              value={formData.cargo}
              onChange={(e) => handleCargo(e.target.value)}
              className="campo"
            >
              {CARGOS.map((cargo) => (
                <option key={cargo.value} value={cargo.value}>
                  {cargo.label}
                </option>
              ))}
            </select>
          </Campo>

          {!initialData && (
            <p className="text-xs text-[#697385]">
              A conta será criada com a senha padrão do sistema e poderá ser
              alterada depois.
            </p>
          )}

          {!ehGerente && (
            <>
              {formData.cargo === "operador" ? (
                <Campo label="Também atua como mecânico?">
                  <select
                    value={formData.ehMecanico}
                    onChange={(e) =>
                      handleChange("ehMecanico", e.target.value)
                    }
                    className="campo"
                  >
                    {SIM_NAO.map((opcao) => (
                      <option key={opcao.value} value={opcao.value}>
                        {opcao.label}
                      </option>
                    ))}
                  </select>
                </Campo>
              ) : (
                <Campo label="Também atua como operador?">
                  <select
                    value={formData.ehOperador}
                    onChange={(e) =>
                      handleChange("ehOperador", e.target.value)
                    }
                    className="campo"
                  >
                    {SIM_NAO.map((opcao) => (
                      <option key={opcao.value} value={opcao.value}>
                        {opcao.label}
                      </option>
                    ))}
                  </select>
                </Campo>
              )}

              <Campo label="Especialização">
                <input
                  type="text"
                  value={formData.especializacao}
                  onChange={(e) =>
                    handleChange("especializacao", e.target.value)
                  }
                  className="campo"
                />
              </Campo>

              <Campo label="Telefone">
                <input
                  type="text"
                  value={formData.telefone}
                  onChange={(e) =>
                    handleChange("telefone", mascararTelefone(e.target.value))
                  }
                  className="campo"
                />
              </Campo>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#334E7F]/10 flex-shrink-0">
          <button onClick={onClose} className="btn-secundario">
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded bg-[#4A48A8] text-white font-semibold hover:bg-[#3d3b8f] transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

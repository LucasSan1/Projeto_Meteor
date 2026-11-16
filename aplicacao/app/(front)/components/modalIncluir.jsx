"use client";

import { useState } from "react";

import { IconeX } from "./icones";

export default function ModalIncluir({
  title = "Incluir Registro",
  fields = [],
  onSubmit,
  onClose,
  initialData = null,
}) {
  // Inicializa os campos direto no state, sem efeito colateral
  // (o modal é montado do zero sempre que abre, então isso basta)
  const [formData, setFormData] = useState(() => {
    const data = {};

    fields.forEach((field) => {
      // Se tiver initialData, usa ela
      // Senão, deixa vazio (?? evita transformar 0 em "")
      data[field.name] = initialData?.[field.name] ?? "";
    });

    return data;
  });

  function handleChange(name, value) {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleConfirm() {
    try {
      console.log("Payload enviado:", formData);

      await onSubmit(formData);
    } catch (err) {
      console.error("Erro ao incluir:", err);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="
        bg-white
        rounded-xl
        shadow-2xl
        w-full
        max-w-md
        max-h-[90vh]
        flex
        flex-col
        overflow-hidden
      "
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#334E7F]/10 flex-shrink-0">
          <h2 className="text-base font-semibold text-[#11284F]">
            {title}
          </h2>

          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-[#697385] hover:text-[#11284F] transition-colors"
          >
            <IconeX size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          {/* CAMPOS DINÂMICOS */}
          {fields.map((field) => (
            <div key={field.name} className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                {field.label}
              </label>

              {/* SELECT */}
              {field.type === "select" ? (
                <select
                  value={formData[field.name] ?? ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="campo"
                >
                  {/* Só coloca o "Selecione" se a lista ainda não tiver um vazio */}
                  {!field.options?.some((option) => option.value === "") && (
                    <option value="">Selecione...</option>
                  )}

                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                /* Textarea pra observações e históricos, que não cabem numa linha */
                <textarea
                  value={formData[field.name] ?? ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  rows={field.rows || 3}
                  className="campo"
                />
              ) : (
                <input
                  type={field.type || "text"}
                  step={field.step}
                  value={formData[field.name] ?? ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="campo"
                />
              )}
            </div>
          ))}
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

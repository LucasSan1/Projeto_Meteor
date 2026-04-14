"use client";

import { useState, useEffect } from "react";

export default function ModalIncluir({
  title = "Incluir Registro",
  fields = [],
  onSubmit,
  onClose,
}) {
  const [formData, setFormData] = useState({});

  // Inicializa campos automaticamente
  useEffect(() => {
    const initialData = {};

    fields.forEach((field) => {
      initialData[field.name] = "";
    });

    setFormData(initialData);
  }, [fields]);

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
    <div
      className="
      fixed
      inset-0
      bg-black/40
      flex
      items-center
      justify-center
      z-50
    "
    >
      <div
        className="
        bg-white
        p-6
        rounded-xl
        shadow-lg
        w-full
        max-w-md
        flex
        flex-col
        gap-4
      
      "
      >
        <h2
          className="
          text-lg
          font-bold
          text-[#4E342E]
        "
        >
          {title}
        </h2>

        {/* CAMPOS DINÂMICOS */}
        {fields.map((field) => (
          <div key={field.name} className="flex flex-col gap-1">
            <label className="text-sm text-black">{field.label}</label>

            {/* SELECT */}
            {field.type === "select" ? (
              <select
                value={formData[field.name]}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className="
                  border
                  rounded
                  p-2
                "
              >
                <option value="">Selecione...</option>

                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type || "text"}
                value={formData[field.name]}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className="
                  border
                  rounded
                  p-2
                "
              />
            )}
          </div>
        ))}

        <div
          className="
          flex
          justify-end
          gap-2
          mt-4
        "
        >
          <button
            onClick={onClose}
            className="
              px-4
              py-2
              rounded
              bg-gray-300
              hover:bg-gray-400
            "
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            className="
              px-4
              py-2
              rounded
              bg-green-600
              text-white
              hover:bg-green-700
            "
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

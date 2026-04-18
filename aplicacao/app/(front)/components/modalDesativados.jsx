"use client";

import { formatData } from "../../utils/formatData";

export default function ModalDesativados({
  title = "Registros Desativados",
  items = [],
  idField = "id",
  displayFields = [],
  onActivate,
  onClose,
  showActivateButton = true,
}) {

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md flex flex-col gap-4">

        <h2 className="text-lg font-bold text-[#4E342E]">{title}</h2>

        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
          {items.length === 0 && (
            <p className="text-sm text-gray-500 text-center">
              Nenhum registro encontrado
            </p>
          )}

          {items.map((item) => (
            <div
              key={item[idField]}
              className="border rounded p-3 flex justify-between items-center"
            >
              {/* CAMPOS */}

              <div className="flex flex-col">
                {displayFields.map((field) => {
                  let valor = item[field.value];

                  if (field.type === "date") {
                    valor = formatData(valor);
                  }

                  return (
                    <span key={field.value} className="text-sm text-black">
                      {field.label}: {valor || "-"}
                    </span>
                  );
                })}
              </div>

              {/* BOTÃO OPCIONAL */}

              {showActivateButton && (
                <button
                  onClick={() => onActivate(item[idField])}
                  className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 text-sm"
                >
                  Ativar
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

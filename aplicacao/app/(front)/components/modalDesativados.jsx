"use client";

import { IconeX } from "./icones";
import { formatData, formatDataHora } from "../../utils/Datetime";

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

        <div className="p-5 flex flex-col gap-2 overflow-y-auto">
          {items.length === 0 && (
            <p className="text-sm text-[#697385] text-center py-6">
              Nenhum registro encontrado
            </p>
          )}

          {items.map((item) => (
            <div
              key={item[idField]}
              className="border border-[#334E7F]/10 bg-[#F7F8FC] rounded-lg p-3 flex justify-between items-center gap-3"
            >
              {/* CAMPOS */}

              <div className="flex flex-col gap-0.5 min-w-0">
                {displayFields.map((field) => {
                  let valor = item[field.value];

                  if (field.type === "date") {
                    valor = formatData(valor);
                  } else if (field.type === "datetime") {
                    valor = formatDataHora(valor);
                  }

                  return (
                    <span key={field.value} className="text-sm text-[#334E7F]">
                      <span className="text-[#697385]">{field.label}: </span>
                      {valor || "-"}
                    </span>
                  );
                })}
              </div>

              {/* BOTÃO OPCIONAL */}

              {showActivateButton && (
                <button
                  onClick={() => onActivate(item[idField])}
                  className="px-3 py-1.5 rounded bg-[#2E9B5E] text-white hover:bg-[#27844F] text-xs font-semibold transition-colors flex-shrink-0"
                >
                  Ativar
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end px-5 py-4 border-t border-[#334E7F]/10 flex-shrink-0">
          <button onClick={onClose} className="btn-secundario">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

import Card from "./Card";
import { IconeCaixa, IconeSeta } from "./icones";
import { formatData, formatDataHora } from "../../utils/Datetime";

// Lista genérica pra telas somente leitura (históricos, auditoria, vínculos)
// Mantém o visual de cards do resto do sistema sem repetir a mesma seção 4x
export default function ListaRegistros({
  title = "Registros",
  items = [],
  fields = [],
  idField = "id",
  getTitle,
  emptyMessage = "Nenhum registro encontrado",
}) {
  const [open, setOpen] = useState(true);

  function formatarValor(item, field) {
    let valor = item[field.value];

    if (field.type === "date") {
      valor = formatData(valor);
    } else if (field.type === "datetime") {
      valor = formatDataHora(valor);
    } else if (field.type === "boolean") {
      valor = valor ? "Sim" : "Não";
    }

    return valor === null || valor === undefined || valor === "" ? "-" : valor;
  }

  // Auditoria guarda JSON como objeto ou texto; formata com recuo pra dar pra ler
  function formatarJson(valor) {
    if (valor === null || valor === undefined || valor === "") return "-";

    try {
      const objeto = typeof valor === "string" ? JSON.parse(valor) : valor;

      return JSON.stringify(objeto, null, 2);
    } catch {
      return String(valor);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between cursor-pointer select-none group"
      >
        <h2 className="text-lg font-bold text-[#11284F]">
          {title}{" "}
          <span className="text-sm font-normal text-[#697385]">
            ({items.length})
          </span>
        </h2>

        <span className="text-[#697385] group-hover:text-[#11284F] transition-colors">
          <IconeSeta
            size={18}
            className={`transition-transform ${open ? "" : "-rotate-90"}`}
          />
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-4">
          {items.length === 0 && (
            <div className="py-14 text-center">
              <IconeCaixa size={30} className="mx-auto mb-2 text-[#C9CCDD]" />
              <p className="text-sm text-[#697385]">{emptyMessage}</p>
            </div>
          )}

          {items.map((item, index) => (
            <Card
              key={item[idField] ?? index}
              title={
                getTitle
                  ? getTitle(item)
                  : `${title} #${item[idField] ?? index + 1}`
              }
            >
              {fields.map((field) =>
                field.type === "json" ? (
                  <div key={field.value} className="text-sm">
                    <span className="font-semibold text-[#11284F]">
                      {field.label}:
                    </span>

                    <pre className="mt-1 bg-[#F3F4FB] border border-[#334E7F]/10 rounded-lg p-3 text-xs text-[#334E7F] whitespace-pre-wrap break-words overflow-x-auto">
                      {formatarJson(item[field.value])}
                    </pre>
                  </div>
                ) : (
                  <p key={field.value} className="text-sm text-[#334E7F]">
                    <span className="text-[#697385]">{field.label}: </span>
                    {formatarValor(item, field)}
                  </p>
                ),
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";

import Card from "./Card";
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
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <h2 className="text-xl font-bold text-[#4E342E]">
          {title} ({items.length})
        </h2>

        <span className="text-lg text-black">{open ? "-" : "+"}</span>
      </div>

      {open && (
        <div className="flex flex-col gap-4">
          {items.length === 0 && (
            <p className="text-gray-500 text-center">{emptyMessage}</p>
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
                  <div key={field.value} className="text-sm text-black">
                    <span className="font-semibold">{field.label}:</span>

                    <pre className="mt-1 bg-[#F9F7F4] border rounded p-2 text-xs whitespace-pre-wrap break-words overflow-x-auto">
                      {formatarJson(item[field.value])}
                    </pre>
                  </div>
                ) : (
                  <p key={field.value} className="text-sm text-black">
                    {field.label}: {formatarValor(item, field)}
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

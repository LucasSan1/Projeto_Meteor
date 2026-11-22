import { getDataBrasilia } from "../../app/utils/Datetime";

// Devolve o dia de Brasília deslocado em N dias, no formato YYYY-MM-DD
export function diaBrasilia(deslocamentoDias = 0) {
  const hoje = getDataBrasilia().slice(0, 10);
  const data = new Date(`${hoje}T12:00:00`);

  data.setDate(data.getDate() + deslocamentoDias);

  const pad = (n) => String(n).padStart(2, "0");

  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}`;
}

// Início do dia, que é o formato que as regras de janela esperam
export function horaBrasilia(deslocamentoDias = 0) {
  return `${diaBrasilia(deslocamentoDias)} 00:00:00`;
}

export function getDataBrasilia() {

  const now = new Date();

  const formatter = new Intl.DateTimeFormat(
    "sv-SE",
    {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }
  );

  return formatter
    .format(now)
    .replace("T", " ");

}

function partesData(data) {
  if (!data) return null;

  const texto = String(data).trim().replace("T", " ");
  const match = texto.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ ](\d{2}):(\d{2}))?/);

  if (match) {
    return {
      dia: `${match[1]}-${match[2]}-${match[3]}`,
      hora: match[4] ? `${match[4]}:${match[5]}` : "",
    };
  }

  const date = new Date(data);

  if (Number.isNaN(date.getTime())) return null;

  const pad = (n) => String(n).padStart(2, "0");

  return {
    dia: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    hora: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

export function formatData(data) {
    const partes = partesData(data);

    if (!partes) return "-";

    const [ano, mes, dia] = partes.dia.split("-");

    return `${dia}/${mes}/${ano}`;
}

// Mesma ideia da formatData, mas com hora junto pra logs e históricos
export function formatDataHora(data) {
    const partes = partesData(data);

    if (!partes) return "-";

    const [ano, mes, dia] = partes.dia.split("-");
    const dataFormatada = `${dia}/${mes}/${ano}`;

    return partes.hora
      ? `${dataFormatada} ${partes.hora}`
      : dataFormatada;
}

// Converte o valor que vem do banco/input pro formato aceito no datetime-local
export function paraInputDatetime(data) {
    const partes = partesData(data);

    if (!partes) return "";

    return `${partes.dia}T${partes.hora || "00:00"}`;
}

// Mesma ideia, mas só o dia, planejamento de ordem não exige horário
export function paraInputDate(data) {
    const partes = partesData(data);

    return partes ? partes.dia : "";
}

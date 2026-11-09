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

export function formatData(data) {
    if (!data) return "-";

    return new Date(data).toLocaleDateString(
      "pt-BR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
}

// Mesma ideia da formatData, mas com hora junto pra logs e históricos
export function formatDataHora(data) {
    if (!data) return "-";

    return new Date(data).toLocaleString(
      "pt-BR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
}

// Converte o valor que vem do MySQL/input pro formato aceito no datetime-local
export function paraInputDatetime(data) {
    if (!data) return "";

    const date = new Date(data);

    if (Number.isNaN(date.getTime())) return "";

    const pad = (n) => String(n).padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Mesma ideia, mas só o dia, planejamento de ordem não exige horário
export function paraInputDate(data) {
    if (!data) return "";

    // Se já veio só o dia, devolve direto pra não escorregar no fuso
    if (typeof data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
        return data;
    }

    const date = new Date(data);

    if (Number.isNaN(date.getTime())) return "";

    const pad = (n) => String(n).padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

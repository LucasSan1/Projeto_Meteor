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
// Normaliza o valor de um input datetime-local pro formato que o MySQL entende
export function toSqlDatetime(value) {
  if (!value) return null;

  const texto = String(value).trim().replace("T", " ");

  if (texto.length === 16) {
    return `${texto}:00`;
  }

  return texto;
}

export function toSqlDate(value) {
  if (!value) return null;

  // Date vindo do pg ou de alguma conta interna: usa os getters locais
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;

    const pad = (n) => String(n).padStart(2, "0");

    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }

  const texto = String(value).trim().replace("T", " ");
  const data = texto.match(/^\d{4}-\d{2}-\d{2}/);

  return data ? data[0] : texto;
}

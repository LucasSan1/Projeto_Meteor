// Normaliza o valor de um input datetime-local pro formato que o MySQL entende
export function toSqlDatetime(value) {
  if (!value) return null;

  const texto = String(value).trim().replace("T", " ");

  if (texto.length === 16) {
    return `${texto}:00`;
  }

  return texto;
}

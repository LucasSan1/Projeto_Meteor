export function somenteDigitos(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

export function mascararCnpj(valor) {
  const digitos = somenteDigitos(valor).slice(0, 14);

  return digitos
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function mascararTelefone(valor) {
  const digitos = somenteDigitos(valor).slice(0, 11);

  if (!digitos) return "";

  if (digitos.length <= 2) {
    return `(${digitos}`;
  }

  const ddd = digitos.slice(0, 2);
  const resto = digitos.slice(2);

  if (resto.length <= 4) {
    return `(${ddd}) ${resto}`;
  }

  // Celular tem 9 dígitos depois do DDD, fixo tem 8
  const corte = resto.length > 8 ? 5 : 4;

  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}


export function normalizarTelefone(valor) {
  return somenteDigitos(valor) || null;
}

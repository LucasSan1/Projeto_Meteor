// Monta o próximo código no padrão OP-<ano>-<sequencial>
// O sequencial é o maior já usado no ano + 1, então buracos no meio não atrapalham
const PREFIXO_ORDEM = "OP";

export function gerarProximoCodigoOrdem(
  ordens = [],
  ano = new Date().getFullYear(),
) {
  const prefixo = `${PREFIXO_ORDEM}-${ano}-`;

  const maiorSequencial = ordens.reduce((maior, ordem) => {
    const codigo = String(ordem?.codigo ?? "");

    if (!codigo.startsWith(prefixo)) return maior;

    const sequencial = Number(codigo.slice(prefixo.length));

    return Number.isInteger(sequencial) && sequencial > maior
      ? sequencial
      : maior;
  }, 0);

  return `${prefixo}${String(maiorSequencial + 1).padStart(3, "0")}`;
}

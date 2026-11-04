// Teto do DECIMAL(14,3): 11 dígitos inteiros + 3 casas decimais
const TETO_ESTOQUE = 99999999999.999;

// Converte e valida quantidades de estoque antes de chegar no MySQL
// Negativo ou valor gigante estoura o CHECK e vira um 500 sem graça
export function validarQuantidade(valor, nomeCampo) {
  const vazio = valor === undefined || valor === null || valor === "";

  const numero = vazio ? 0 : Number(valor);

  if (!Number.isFinite(numero)) {
    throw { status: 400, message: `${nomeCampo} inválido!` };
  }

  if (numero < 0) {
    throw { status: 400, message: `${nomeCampo} não pode ser negativo!` };
  }

  if (numero > TETO_ESTOQUE) {
    throw { status: 400, message: `${nomeCampo} acima do limite permitido!` };
  }

  return numero;
}

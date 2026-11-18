export const SENHA_MINIMA = 6;

export function regrasSenha(senha) {
  const texto = typeof senha === "string" ? senha : "";

  return {
    tamanho: texto.length >= SENHA_MINIMA,
    letra: /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(texto),
    numero: /\d/.test(texto),
    
    especial: /[^A-Za-zÀ-ÖØ-öø-ÿ0-9\s]/.test(texto),
  };
}


export function validarSenhaForte(senha) {
  if (typeof senha !== "string" || !senha) {
    return "Informe a nova senha!";
  }

  const regras = regrasSenha(senha);

  if (!regras.tamanho) {
    return `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres!`;
  }

  if (!regras.letra || !regras.numero || !regras.especial) {
    return "A senha precisa ter letra, número e caractere especial!";
  }

  return null;
}

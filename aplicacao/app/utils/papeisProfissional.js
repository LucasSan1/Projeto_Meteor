// Regras de papel compartilhadas entre as rotas de usuários
// O cargo é o papel principal; o outro papel é opcional pra quem faz os dois

export function normalizarFlag(valor, padrao = 0) {
  if (valor === undefined || valor === null || valor === "") return padrao;

  return String(valor) === "1" || valor === true ? 1 : 0;
}

export function papeisDoCargo(cargo, ehOperador, ehMecanico) {
  if (cargo === "operador") {
    return { operador: 1, mecanico: normalizarFlag(ehMecanico, 0) };
  }

  if (cargo === "mecanico") {
    return { operador: normalizarFlag(ehOperador, 0), mecanico: 1 };
  }

  return { operador: 0, mecanico: 0 };
}

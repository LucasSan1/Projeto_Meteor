// Ajusta o saldo da matéria-prima de acordo com o movimento
// multiplicador = 1 aplica o movimento, -1 desfaz (usado em edição/exclusão)
export async function ajustarEstoque(
  connection,
  fk_materiaID,
  tipo,
  quantidade,
  multiplicador = 1,
) {
  const [materia] = await connection.query(
    "SELECT quantidadeEstoque FROM materiasPrimas WHERE pk_materiaID = ? FOR UPDATE",
    [fk_materiaID],
  );

  if (materia.length === 0) {
    throw { status: 404, message: "Matéria-prima não encontrada!" };
  }

  const delta = tipo === "Entrada" ? Number(quantidade) : -Number(quantidade);
  const novoSaldo = Number(materia[0].quantidadeEstoque) + delta * multiplicador;

  if (novoSaldo < 0) {
    throw {
      status: 400,
      message: "Estoque insuficiente para essa saída!",
    };
  }

  await connection.query(
    "UPDATE materiasPrimas SET quantidadeEstoque = ? WHERE pk_materiaID = ?",
    [novoSaldo, fk_materiaID],
  );
}

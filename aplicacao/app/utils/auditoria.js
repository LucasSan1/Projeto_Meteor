// Centraliza a escrita na trilha de auditoria
export async function registrarAuditoria(
  executor,
  {
    usuarioID,
    entidade,
    entidadeID,
    acao,
    dadosAnteriores = null,
    dadosNovos = null,
    observacao = null,
  },
) {
  await executor.query(
    `INSERT INTO auditoria
      (fk_usuarioID, entidade, entidadeID, acao, dadosAnteriores, dadosNovos, observacao)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      usuarioID,
      entidade,
      entidadeID,
      acao,
      dadosAnteriores === null ? null : JSON.stringify(dadosAnteriores),
      dadosNovos === null ? null : JSON.stringify(dadosNovos),
      observacao,
    ],
  );
}

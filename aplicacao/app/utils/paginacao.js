export function lerPaginacao(request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit"));

  if (!Number.isInteger(limit) || limit <= 0) return null;

  const page = Number(searchParams.get("page"));
  const pagina = Number.isInteger(page) && page > 0 ? page : 1;

  // Teto pra ninguém pedir o banco inteiro numa tacada só e chamar de página
  const limite = Math.min(limit, 100);

  return { pagina, limite, offset: (pagina - 1) * limite };
}

// Emenda o LIMIT/OFFSET no SQL só quando a paginação foi pedida
export function comPaginacao(sql, paginacao) {
  return paginacao ? `${sql} LIMIT ? OFFSET ?` : sql;
}

export function paramsComPaginacao(params, paginacao) {
  return paginacao ? [...params, paginacao.limite, paginacao.offset] : params;
}

export function respostaLista(data, paginacao, total) {
  if (!paginacao) return { data };

  return {
    data,
    paginacao: {
      pagina: paginacao.pagina,
      limite: paginacao.limite,
      total,
      totalPaginas: Math.max(Math.ceil(total / paginacao.limite), 1),
    },
  };
}

// Conta as linhas com o mesmo FROM/WHERE da listagem
export async function contarLinhas(executor, sql, params = []) {
  const [linhas] = await executor.query(sql, params);

  return Number(linhas[0]?.total ?? 0);
}

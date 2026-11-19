import { NextResponse } from "next/server";
import pool from "../../lib/connSql";
import { checkAuthPosition } from "../../utils/authChecker";
import {
  comPaginacao,
  contarLinhas,
  lerPaginacao,
  paramsComPaginacao,
  respostaLista,
} from "../../utils/paginacao";

export async function GET(request) {
  try {
    await checkAuthPosition(request);

    const paginacao = lerPaginacao(request);

    const [result] = await pool.query(
      comPaginacao(
        `
      SELECT
        a.pk_auditoriaID,
        a.fk_usuarioID,
        a.entidade,
        a.entidadeID,
        a.acao,
        a.dadosAnteriores,
        a.dadosNovos,
        a.observacao,
        a.dataAcao,
        u.nome AS usuario
      FROM auditoria a
      INNER JOIN usuarios u ON a.fk_usuarioID = u.id
      ORDER BY a.dataAcao DESC, a.pk_auditoriaID DESC
    `,
        paginacao,
      ),
      paramsComPaginacao([], paginacao),
    );

    const total = paginacao
      ? await contarLinhas(pool, "SELECT COUNT(*) AS total FROM auditoria")
      : null;

    return NextResponse.json(respostaLista(result, paginacao, total), {
      status: 200,
    });
  } catch (err) {
    console.log("Auditoria GET : ", err);

    if (err.status) {
      return NextResponse.json(
        { message: err.message },
        { status: err.status },
      );
    }

    return NextResponse.json(
      { message: "Erro do servidor!" },
      { status: 500 },
    );
  }
}

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
        h.historicoID,
        h.fk_manutencaoID,
        h.fk_equipamentoID,
        h.fk_mecanicoID,
        h.manutencaoRealizada,
        h.dataManutencao,
        h.inicioEfetivo,
        h.terminoEfetivo,
        h.custos,
        h.observacoes,
        e.nomeEquipamento AS equipamento,
        u.nome AS mecanico
      FROM historicoManutencao h
      LEFT JOIN equipamentos e ON h.fk_equipamentoID = e.pk_equipamentoID
      LEFT JOIN profissionais prof ON h.fk_mecanicoID = prof.pk_profissionalID
      LEFT JOIN usuarios u ON prof.fk_usuarioID = u.id
      ORDER BY h.dataManutencao DESC, h.historicoID DESC
    `,
        paginacao,
      ),
      paramsComPaginacao([], paginacao),
    );

    const total = paginacao
      ? await contarLinhas(
          pool,
          "SELECT COUNT(*) AS total FROM historicoManutencao",
        )
      : null;

    return NextResponse.json(respostaLista(result, paginacao, total), {
      status: 200,
    });
  } catch (err) {
    console.log("HistoricoManutencao GET : ", err);

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

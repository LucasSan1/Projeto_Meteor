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

// Consulta dos materiais previstos/consumidos por ordem
export async function GET(request) {
  try {
    await checkAuthPosition(request);

    const paginacao = lerPaginacao(request);

    const [result] = await pool.query(
      comPaginacao(
        `
      SELECT
        om.pk_ordemMaterialID,
        om.fk_ordemID,
        om.fk_materiaID,
        om.quantidadePrevista,
        om.quantidadeConsumida,
        op.codigo AS ordem,
        p.peca,
        m.materia,
        m.unidadeMedida
      FROM ordemMateriais om
      INNER JOIN ordensProducao op ON om.fk_ordemID = op.pk_ordemID
      INNER JOIN pecas p ON op.fk_pecaID = p.pk_pecaID
      INNER JOIN materiasPrimas m ON om.fk_materiaID = m.pk_materiaID
      ORDER BY op.codigo, m.materia
    `,
        paginacao,
      ),
      paramsComPaginacao([], paginacao),
    );

    const total = paginacao
      ? await contarLinhas(
          pool,
          "SELECT COUNT(*) AS total FROM ordemMateriais",
        )
      : null;

    return NextResponse.json(respostaLista(result, paginacao, total), {
      status: 200,
    });
  } catch (err) {
    console.log("OrdemMateriais GET : ", err);

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

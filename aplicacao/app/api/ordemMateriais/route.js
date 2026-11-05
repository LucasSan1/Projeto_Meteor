import { NextResponse } from "next/server";
import pool from "../../lib/connSql";
import { checkAuthPosition } from "../../utils/authChecker";

// Consulta dos materiais previstos/consumidos por ordem
export async function GET(request) {
  try {
    await checkAuthPosition(request);

    const [result] = await pool.query(`
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
    `);

    return NextResponse.json({ data: result }, { status: 200 });
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

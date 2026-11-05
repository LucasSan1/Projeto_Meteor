import { NextResponse } from "next/server";
import pool from "../../lib/connSql";
import { checkAuthPosition } from "../../utils/authChecker";

export async function GET(request) {
  try {
    await checkAuthPosition(request);

    const [result] = await pool.query(`
      SELECT
        h.pk_historicoID,
        h.fk_ordemID,
        h.fk_usuarioID,
        h.statusAnterior,
        h.statusNovo,
        h.dataAlteracao,
        h.observacao,
        op.codigo AS ordem,
        p.peca,
        u.nome AS usuario
      FROM historicoOrdens h
      INNER JOIN ordensProducao op ON h.fk_ordemID = op.pk_ordemID
      INNER JOIN pecas p ON op.fk_pecaID = p.pk_pecaID
      INNER JOIN usuarios u ON h.fk_usuarioID = u.id
      ORDER BY h.dataAlteracao DESC, h.pk_historicoID DESC
    `);

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (err) {
    console.log("HistoricoOrdens GET : ", err);

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

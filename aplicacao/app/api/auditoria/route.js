import { NextResponse } from "next/server";
import pool from "../../lib/connSql";
import { checkAuth } from "../../utils/authChecker";

export async function GET(request) {
  try {
    checkAuth(request);

    const [result] = await pool.query(`
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
    `);

    return NextResponse.json({ data: result }, { status: 200 });
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

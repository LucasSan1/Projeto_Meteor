import { NextResponse } from "next/server";
import pool from "../../lib/connSql";
import { checkAuth, checkAuthPosition } from "../../utils/authChecker";

export async function POST(request) {
  const body = await request.json();
  const { peca, peso, dimensoes } = body;

  try {
    checkAuthPosition(request);

    if (!peca?.trim()) {
      throw { status: 400, message: "O nome da peça é obrigatório!" };
    }

    const [result] = await pool.query(
      "INSERT INTO pecas (peca, peso, dimensoes) VALUES (?,?,?)",
      [peca, peso, dimensoes],
    );

    return NextResponse.json({
      message: "Peça cadastrada com sucesso!",
      id: result.insertId,
    });
  } catch (err) {
    console.log("Peçãs POST : ", err);

    if (err.status) {
      return NextResponse.json(
        { message: err.message },
        { status: err.status },
      );
    }

    return NextResponse.json(
      { message: "Erro do servidor! " },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    checkAuth(request);

    const [result] = await pool.query(`
        SELECT
            p.pk_pecaID,
            p.peca,
            p.peso,
            p.dimensoes,
            p.status
        FROM pecas p
        ORDER BY p.peca
    `);

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (err) {
    console.log("Peçãs GET: ", err);

    if (err.status) {
      return NextResponse.json(
        { message: err.message },
        { status: err.status },
      );
    }

    return NextResponse.json(
      { message: "Erro do servidor! " },
      { status: 500 },
    );
  }
}

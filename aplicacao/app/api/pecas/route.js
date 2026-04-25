import { NextResponse } from "next/server";
import pool from "../../lib/connSql";
import { checkAuth, checkAuthPosition } from "../../utils/authChecker";

export async function POST(request) {
  const body = await request.json();
  const { peca, material, peso, Dimensoes } = body;

  try {
    checkAuthPosition(request);

    const [exist] = await pool.query(
      "SELECT * FROM materiasPrimas WHERE pk_materiaID = ? AND status = 'Ativo'",
      [material],
    );

    if (!exist || exist.length === 0) {
      throw { status: 404, message: "Material não existente ou inativo!" };
    }

    const [result] = await pool.query(
      "INSERT INTO pecas (peca, fk_material, peso, Dimensoes) VALUES (?,?,?,?)",
      [peca, material, peso, Dimensoes],
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
            p.fk_material,
            p.peso,
            p.Dimensoes,
            p.status,

            m.materia AS material

        FROM pecas p

        INNER JOIN materiasPrimas m
            ON p.fk_material = m.pk_materiaID
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

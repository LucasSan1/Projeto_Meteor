import { NextResponse } from "next/server";
import pool from "../../lib/connSql";
import { checkAuthPosition } from "../../utils/authChecker";

// Lista as inspeções com a ordem e a peça
export async function GET(request) {
  try {
    await checkAuthPosition(request);

    const [result] = await pool.query(`
      SELECT
        i.pk_inspecaoID,
        i.fk_ordemID,
        i.totalProduzido,
        i.aprovadas,
        i.rejeitadas,
        i.dataInspecao,
        i.observacoes,
        op.codigo AS ordem,
        p.peca,
        u.nome AS operador
      FROM inspecoes i
      INNER JOIN ordensProducao op ON i.fk_ordemID = op.pk_ordemID
      INNER JOIN pecas p ON op.fk_pecaID = p.pk_pecaID
      INNER JOIN profissionais prof ON op.fk_operadorID = prof.pk_profissionalID
      INNER JOIN usuarios u ON prof.fk_usuarioID = u.id
      ORDER BY i.dataInspecao DESC, i.pk_inspecaoID DESC
    `);

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (err) {
    console.log("Inspecoes GET : ", err);

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

export async function POST(request) {
  const body = await request.json();
  const { ordem, totalProduzido, aprovadas, rejeitadas, observacoes } = body;

  try {
    await checkAuthPosition(request);

    if (!ordem || totalProduzido === undefined || totalProduzido === "") {
      throw {
        status: 400,
        message: "Selecione a ordem e informe o total produzido!",
      };
    }

    const total = Number(totalProduzido);
    const aprov = Number(aprovadas || 0);
    const rejeit = Number(rejeitadas || 0);

    if (total < 0 || aprov < 0 || rejeit < 0) {
      throw { status: 400, message: "Os números não podem ser negativos!" };
    }

    if (aprov + rejeit !== total) {
      throw {
        status: 400,
        message: "Aprovadas + rejeitadas precisa bater com o total produzido!",
      };
    }

    const [os] = await pool.query(
      "SELECT * FROM ordensProducao WHERE pk_ordemID = ? AND status = 'Concluída'",
      [ordem],
    );

    if (os.length === 0) {
      throw {
        status: 404,
        message: "Ordem não encontrada ou ainda não concluída!",
      };
    }

    const [exist] = await pool.query(
      "SELECT pk_inspecaoID FROM inspecoes WHERE fk_ordemID = ?",
      [ordem],
    );

    if (exist.length > 0) {
      throw { status: 409, message: "Essa ordem já possui uma inspeção!" };
    }

    const [result] = await pool.query(
      `INSERT INTO inspecoes
        (fk_ordemID, totalProduzido, aprovadas, rejeitadas, observacoes)
       VALUES (?, ?, ?, ?, ?)`,
      [ordem, total, aprov, rejeit, observacoes || null],
    );

    return NextResponse.json({
      message: "Inspeção registrada com sucesso!",
      id: result.insertId,
    });
  } catch (err) {
    console.log("Inspecoes POST : ", err);

    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { message: "Essa ordem já possui uma inspeção!" },
        { status: 409 },
      );
    }

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

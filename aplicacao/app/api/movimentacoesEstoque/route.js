import { NextResponse } from "next/server";
import pool from "../../lib/connSql";
import { checkAuthPosition } from "../../utils/authChecker";
import { autorizarGestor } from "../../utils/authMiddleware";
import { ajustarEstoque } from "./estoque";

// Lista o livro-razão do estoque com os nomes já resolvidos
export async function GET(request) {
  try {
    await checkAuthPosition(request);

    const [result] = await pool.query(`
      SELECT
        mov.pk_movimentacaoID,
        mov.fk_materiaID,
        mov.tipo,
        mov.quantidade,
        mov.unidadeMedida,
        mov.fk_usuarioID,
        mov.fk_ordemID,
        mov.dataMovimentacao,
        mov.observacao,
        mat.materia,
        usu.nome AS usuario,
        op.codigo AS ordem
      FROM movimentacoesEstoque mov
      INNER JOIN materiasPrimas mat ON mov.fk_materiaID = mat.pk_materiaID
      INNER JOIN usuarios usu ON mov.fk_usuarioID = usu.id
      LEFT JOIN ordensProducao op ON mov.fk_ordemID = op.pk_ordemID
      ORDER BY mov.dataMovimentacao DESC, mov.pk_movimentacaoID DESC
    `);

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (err) {
    console.log("Movimentacoes GET : ", err);

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
  const { materia, tipo, quantidade, unidadeMedida, ordem, observacao } = body;

  let connection;

  try {
    const usuario = await autorizarGestor(request);

    connection = await pool.getConnection();

    if (!materia || !tipo || !quantidade || !unidadeMedida?.trim()) {
      throw {
        status: 400,
        message: "Preencha material, tipo, quantidade e unidade!",
      };
    }

    // Reposição é manual, consumo nasce da conclusão da ordem
    if (tipo !== "Entrada") {
      throw {
        status: 400,
        message:
          "Saídas de estoque são geradas automaticamente na conclusão da ordem!",
      };
    }

    if (Number(quantidade) <= 0) {
      throw { status: 400, message: "A quantidade deve ser maior que zero!" };
    }

    if (ordem) {
      throw {
        status: 400,
        message: "Entrada manual não pode ser vinculada a uma ordem!",
      };
    }

    const [mat] = await pool.query(
      "SELECT * FROM materiasPrimas WHERE pk_materiaID = ?",
      [materia],
    );

    if (mat.length === 0) {
      throw { status: 404, message: "Matéria-prima não encontrada!" };
    }

    if (mat[0].status !== "Ativo") {
      throw {
        status: 400,
        message: "Matéria-prima inativa não pode receber novas entradas!",
      };
    }

    if (mat[0].unidadeMedida !== unidadeMedida.trim()) {
      throw {
        status: 400,
        message: `A unidade da movimentação precisa ser "${mat[0].unidadeMedida}"!`,
      };
    }

    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO movimentacoesEstoque
        (fk_materiaID, tipo, quantidade, unidadeMedida, fk_usuarioID, fk_ordemID, observacao)
       VALUES (?, ?, ?, ?, ?, NULL, ?)`,
      [
        materia,
        tipo,
        quantidade,
        unidadeMedida.trim(),
        usuario.id,
        observacao || null,
      ],
    );

    await ajustarEstoque(connection, materia, tipo, quantidade, 1);

    await connection.commit();

    return NextResponse.json({
      message: "Entrada de estoque registrada com sucesso!",
      id: result.insertId,
    });
  } catch (err) {
    if (connection) await connection.rollback();

    console.log("Movimentacoes POST : ", err);

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
  } finally {
    if (connection) connection.release();
  }
}

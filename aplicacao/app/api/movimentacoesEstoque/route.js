import { NextResponse } from "next/server";
import pool from "../../lib/connSql";
import { checkAuthPosition } from "../../utils/authChecker";
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
  const { materia, tipo, quantidade, unidadeMedida, usuario, ordem, observacao } =
    body;

  let connection;

  try {
    connection = await pool.getConnection();

    await checkAuthPosition(request);

    if (!materia || !tipo || !quantidade || !unidadeMedida?.trim() || !usuario) {
      throw {
        status: 400,
        message: "Preencha material, tipo, quantidade, unidade e responsável!",
      };
    }

    if (!["Entrada", "Saida"].includes(tipo)) {
      throw { status: 400, message: "Tipo de movimentação inválido!" };
    }

    if (Number(quantidade) <= 0) {
      throw { status: 400, message: "A quantidade deve ser maior que zero!" };
    }

    // Saída só existe dentro de uma ordem, igual a regra do DDL
    if (tipo === "Saida" && !ordem) {
      throw {
        status: 400,
        message: "Saída de estoque precisa estar vinculada a uma ordem!",
      };
    }

    const [mat] = await pool.query(
      "SELECT * FROM materiasPrimas WHERE pk_materiaID = ?",
      [materia],
    );

    if (mat.length === 0) {
      throw { status: 404, message: "Matéria-prima não encontrada!" };
    }

    const [usu] = await pool.query("SELECT id FROM usuarios WHERE id = ?", [
      usuario,
    ]);

    if (usu.length === 0) {
      throw { status: 404, message: "Usuário responsável não encontrado!" };
    }

    if (ordem) {
      const [os] = await pool.query(
        "SELECT pk_ordemID FROM ordensProducao WHERE pk_ordemID = ?",
        [ordem],
      );

      if (os.length === 0) {
        throw { status: 404, message: "Ordem de produção não encontrada!" };
      }
    }

    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO movimentacoesEstoque
        (fk_materiaID, tipo, quantidade, unidadeMedida, fk_usuarioID, fk_ordemID, observacao)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        materia,
        tipo,
        quantidade,
        unidadeMedida,
        usuario,
        ordem || null,
        observacao || null,
      ],
    );

    await ajustarEstoque(connection, materia, tipo, quantidade, 1);

    await connection.commit();

    return NextResponse.json({
      message: "Movimentação registrada com sucesso!",
      id: result.insertId,
    });
  } catch (err) {
    if (connection) await connection.rollback();

    console.log("Movimentacoes POST : ", err);

    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        {
          message:
            "Já existe uma movimentação desse tipo para esse material nessa ordem!",
        },
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
  } finally {
    if (connection) connection.release();
  }
}

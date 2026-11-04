import { NextResponse } from "next/server";
import pool from "../../../lib/connSql";
import { checkAuthPosition } from "../../../utils/authChecker";
import { ajustarEstoque } from "../estoque";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const { tipo, quantidade, unidadeMedida, ordem, observacao } = body;

  let connection;

  try {
    connection = await pool.getConnection();

    checkAuthPosition(request);

    await connection.beginTransaction();

    const [exist] = await connection.query(
      "SELECT * FROM movimentacoesEstoque WHERE pk_movimentacaoID = ? FOR UPDATE",
      [id],
    );

    if (exist.length === 0) {
      throw { status: 404, message: "Movimentação não encontrada!" };
    }

    const atual = exist[0];

    const tipoFinal = tipo || atual.tipo;
    const quantidadeFinal =
      quantidade !== undefined && quantidade !== ""
        ? quantidade
        : atual.quantidade;
    const unidadeFinal = unidadeMedida?.trim()
      ? unidadeMedida
      : atual.unidadeMedida;
    const ordemFinal = ordem !== undefined ? ordem || null : atual.fk_ordemID;

    if (!["Entrada", "Saida"].includes(tipoFinal)) {
      throw { status: 400, message: "Tipo de movimentação inválido!" };
    }

    if (Number(quantidadeFinal) <= 0) {
      throw { status: 400, message: "A quantidade deve ser maior que zero!" };
    }

    if (tipoFinal === "Saida" && !ordemFinal) {
      throw {
        status: 400,
        message: "Saída de estoque precisa estar vinculada a uma ordem!",
      };
    }

    // Desfaz o efeito antigo antes de aplicar o novo
    await ajustarEstoque(
      connection,
      atual.fk_materiaID,
      atual.tipo,
      atual.quantidade,
      -1,
    );

    await ajustarEstoque(
      connection,
      atual.fk_materiaID,
      tipoFinal,
      quantidadeFinal,
      1,
    );

    const [result] = await connection.query(
      `UPDATE movimentacoesEstoque
       SET tipo = ?, quantidade = ?, unidadeMedida = ?, fk_ordemID = ?, observacao = ?
       WHERE pk_movimentacaoID = ?`,
      [
        tipoFinal,
        quantidadeFinal,
        unidadeFinal,
        ordemFinal,
        observacao ?? atual.observacao,
        id,
      ],
    );

    if (result.affectedRows === 0) {
      throw { status: 400, message: "Não foi possível atualizar a movimentação!" };
    }

    await connection.commit();

    return NextResponse.json(
      { message: "Movimentação atualizada!" },
      { status: 200 },
    );
  } catch (err) {
    if (connection) await connection.rollback();

    console.log("Movimentacoes PATCH : ", err);

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

export async function DELETE(request, { params }) {
  const { id } = await params;

  let connection;

  try {
    connection = await pool.getConnection();

    checkAuthPosition(request);

    await connection.beginTransaction();

    const [exist] = await connection.query(
      "SELECT * FROM movimentacoesEstoque WHERE pk_movimentacaoID = ? FOR UPDATE",
      [id],
    );

    if (exist.length === 0) {
      throw { status: 404, message: "Movimentação não encontrada!" };
    }

    const movimentacao = exist[0];

    // Remove o impacto da movimentação no saldo antes de apagar
    await ajustarEstoque(
      connection,
      movimentacao.fk_materiaID,
      movimentacao.tipo,
      movimentacao.quantidade,
      -1,
    );

    await connection.query(
      "DELETE FROM movimentacoesEstoque WHERE pk_movimentacaoID = ?",
      [id],
    );

    await connection.commit();

    return NextResponse.json(
      { message: "Movimentação excluída!" },
      { status: 200 },
    );
  } catch (err) {
    if (connection) await connection.rollback();

    console.log("Movimentacoes DELETE : ", err);

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

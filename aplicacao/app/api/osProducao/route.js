import { NextResponse } from "next/server";
import pool from "../../lib/connSql";
import { checkAuth, checkAuthPosition } from "../../utils/authChecker";
import { toSqlDatetime } from "../../utils/datetimeSql";

// Lista as ordens com peça e operador já resolvidos
export async function GET(request) {
  try {
    checkAuth(request);

    const [result] = await pool.query(`
      SELECT
        op.pk_ordemID,
        op.codigo,
        op.fk_pecaID,
        p.peca AS nomePeca,
        op.quantidadePlanejada,
        op.especializacao,
        op.fk_operadorID,
        u.nome AS operador,
        op.inicioPlanejado,
        op.terminoPlanejado,
        op.inicioEfetivo,
        op.conclusaoEfetiva,
        op.status
      FROM ordensProducao op
      INNER JOIN pecas p ON op.fk_pecaID = p.pk_pecaID
      INNER JOIN profissionais prof ON op.fk_operadorID = prof.pk_profissionalID
      INNER JOIN usuarios u ON prof.fk_usuarioID = u.id
      ORDER BY op.inicioPlanejado
    `);

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (err) {
    console.log("OS produção GET : ", err);

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
  const {
    codigo,
    pecaID,
    quantidadePlanejada,
    especializacao,
    operadorID,
    inicioPlanejado,
    terminoPlanejado,
  } = body;

  try {
    checkAuthPosition(request);

    if (
      !codigo?.trim() ||
      !pecaID ||
      !quantidadePlanejada ||
      !especializacao?.trim() ||
      !operadorID ||
      !inicioPlanejado ||
      !terminoPlanejado
    ) {
      throw { status: 400, message: "Preencha todos os campos da ordem!" };
    }

    if (Number(quantidadePlanejada) <= 0) {
      throw { status: 400, message: "A quantidade deve ser maior que zero!" };
    }

    const inicio = toSqlDatetime(inicioPlanejado);
    const termino = toSqlDatetime(terminoPlanejado);

    if (new Date(termino) <= new Date(inicio)) {
      throw {
        status: 400,
        message: "O término planejado deve ser depois do início!",
      };
    }

    const [peca] = await pool.query(
      "SELECT * FROM pecas WHERE pk_pecaID = ? AND status = 'Ativo'",
      [pecaID],
    );

    if (peca.length === 0) {
      throw { status: 404, message: "Peça não encontrada ou inativa!" };
    }

    const [operador] = await pool.query(
      `SELECT p.*, u.nome
       FROM profissionais p
       INNER JOIN usuarios u ON p.fk_usuarioID = u.id
       WHERE p.pk_profissionalID = ? AND p.status = 'Ativo' AND p.ehOperador = 1`,
      [operadorID],
    );

    if (operador.length === 0) {
      throw {
        status: 404,
        message: "Operador não encontrado, inativo ou sem perfil de operador!",
      };
    }

    const [codigoExist] = await pool.query(
      "SELECT pk_ordemID FROM ordensProducao WHERE codigo = ?",
      [codigo],
    );

    if (codigoExist.length > 0) {
      throw { status: 409, message: "Já existe uma ordem com esse código!" };
    }

    const [result] = await pool.query(
      `INSERT INTO ordensProducao
        (codigo, fk_pecaID, quantidadePlanejada, especializacao, fk_operadorID, inicioPlanejado, terminoPlanejado)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        codigo,
        pecaID,
        quantidadePlanejada,
        especializacao,
        operadorID,
        inicio,
        termino,
      ],
    );

    return NextResponse.json({
      message: "Ordem de produção cadastrada com sucesso!",
      id: result.insertId,
    });
  } catch (err) {
    console.log("OS produção POST : ", err);

    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { message: "Já existe uma ordem com esse código!" },
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

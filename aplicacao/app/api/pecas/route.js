import { NextResponse } from "next/server";
import pool from "../../lib/connSql";
import { checkAuthPosition } from "../../utils/authChecker";
import { registrarAuditoria } from "../../utils/auditoria";
import {
  comPaginacao,
  contarLinhas,
  lerPaginacao,
  paramsComPaginacao,
  respostaLista,
} from "../../utils/paginacao";

export async function POST(request) {
  const body = await request.json();
  const { peca, peso, dimensoes } = body;

  try {
    const usuario = await checkAuthPosition(request);

    if (!peca?.trim()) {
      throw { status: 400, message: "O nome da peça é obrigatório!" };
    }

    const [result] = await pool.query(
      "INSERT INTO pecas (peca, peso, dimensoes) VALUES (?,?,?)",
      [peca, peso, dimensoes],
    );

    await registrarAuditoria(pool, {
      usuarioID: usuario.id,
      entidade: "peca",
      entidadeID: result.insertId,
      acao: "criacao",
      dadosNovos: { peca, peso, dimensoes },
      observacao: "Peça cadastrada",
    });

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
    await checkAuthPosition(request);

    const paginacao = lerPaginacao(request);

    const [result] = await pool.query(
      comPaginacao(
        `
        SELECT
            p.pk_pecaID,
            p.peca,
            p.peso,
            p.dimensoes,
            p.status
        FROM pecas p
        ORDER BY p.peca
      `,
        paginacao,
      ),
      paramsComPaginacao([], paginacao),
    );

    const total = paginacao
      ? await contarLinhas(pool, "SELECT COUNT(*) AS total FROM pecas")
      : null;

    return NextResponse.json(respostaLista(result, paginacao, total), {
      status: 200,
    });
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

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

// Lista as rejeições com a inspeção/ordem/peça de origem
export async function GET(request) {
  try {
    await checkAuthPosition(request);

    const paginacao = lerPaginacao(request);

    const [result] = await pool.query(
      comPaginacao(
        `
      SELECT
        r.pk_rejeicaoID,
        r.fk_inspecaoID,
        r.quantidade,
        r.motivoRejeicao,
        r.tipo,
        r.acoesCorretivas,
        r.status,
        r.dataRejeicao,
        op.codigo AS ordem,
        p.peca,
        i.rejeitadas AS rejeitadasInspecao
      FROM rejeicoes r
      INNER JOIN inspecoes i ON r.fk_inspecaoID = i.pk_inspecaoID
      INNER JOIN ordensProducao op ON i.fk_ordemID = op.pk_ordemID
      INNER JOIN pecas p ON op.fk_pecaID = p.pk_pecaID
      ORDER BY r.dataRejeicao DESC, r.pk_rejeicaoID DESC
    `,
        paginacao,
      ),
      paramsComPaginacao([], paginacao),
    );

    const total = paginacao
      ? await contarLinhas(
          pool,
          `SELECT COUNT(*) AS total
             FROM rejeicoes r
             INNER JOIN inspecoes i ON r.fk_inspecaoID = i.pk_inspecaoID
             INNER JOIN ordensProducao op ON i.fk_ordemID = op.pk_ordemID
             INNER JOIN pecas p ON op.fk_pecaID = p.pk_pecaID`,
        )
      : null;

    return NextResponse.json(respostaLista(result, paginacao, total), {
      status: 200,
    });
  } catch (err) {
    console.log("Rejeicoes GET : ", err);

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
  const { inspecao, quantidade, motivoRejeicao, tipo, acoesCorretivas } = body;

  try {
    const usuario = await checkAuthPosition(request);

    if (!inspecao || !quantidade || !motivoRejeicao?.trim()) {
      throw {
        status: 400,
        message: "Selecione a inspeção, a quantidade e o motivo!",
      };
    }

    if (Number(quantidade) <= 0) {
      throw { status: 400, message: "A quantidade deve ser maior que zero!" };
    }

    if (tipo && !["Retrabalho", "Perda"].includes(tipo)) {
      throw { status: 400, message: "Tipo de rejeição inválido!" };
    }

    const [insp] = await pool.query(
      "SELECT * FROM inspecoes WHERE pk_inspecaoID = ?",
      [inspecao],
    );

    if (insp.length === 0) {
      throw { status: 404, message: "Inspeção não encontrada!" };
    }

    const [soma] = await pool.query(
      "SELECT COALESCE(SUM(quantidade), 0) AS total FROM rejeicoes WHERE fk_inspecaoID = ?",
      [inspecao],
    );

    if (Number(soma[0].total) + Number(quantidade) > Number(insp[0].rejeitadas)) {
      throw {
        status: 400,
        message: `A soma das rejeições passaria do total rejeitado na inspeção (${insp[0].rejeitadas})!`,
      };
    }

    const [result] = await pool.query(
      `INSERT INTO rejeicoes
        (fk_inspecaoID, quantidade, motivoRejeicao, tipo, acoesCorretivas)
       VALUES (?, ?, ?, ?, ?)`,
      [
        inspecao,
        quantidade,
        motivoRejeicao,
        tipo || "Perda",
        acoesCorretivas || null,
      ],
    );

    await registrarAuditoria(pool, {
      usuarioID: usuario.id,
      entidade: "rejeicao",
      entidadeID: result.insertId,
      acao: "criacao",
      dadosNovos: {
        inspecao,
        quantidade,
        motivoRejeicao,
        tipo: tipo || "Perda",
        acoesCorretivas: acoesCorretivas || null,
      },
      observacao: "Rejeição registrada",
    });

    return NextResponse.json({
      message: "Rejeição registrada com sucesso!",
      id: result.insertId,
    });
  } catch (err) {
    console.log("Rejeicoes POST : ", err);

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

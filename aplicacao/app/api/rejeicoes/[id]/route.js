import { NextResponse } from "next/server";
import pool from "../../../lib/connSql";
import { checkAuthPosition } from "../../../utils/authChecker";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const { quantidade, motivoRejeicao, tipo, acoesCorretivas } = body;

  try {
    await checkAuthPosition(request);

    const [exist] = await pool.query(
      "SELECT * FROM rejeicoes WHERE pk_rejeicaoID = ?",
      [id],
    );

    if (exist.length === 0) {
      throw { status: 404, message: "Rejeição não encontrada!" };
    }

    const atual = exist[0];

    const quantidadeFinal =
      quantidade !== undefined && quantidade !== ""
        ? Number(quantidade)
        : Number(atual.quantidade);

    if (quantidadeFinal <= 0) {
      throw { status: 400, message: "A quantidade deve ser maior que zero!" };
    }

    const tipoFinal = tipo || atual.tipo;

    if (!["Retrabalho", "Perda"].includes(tipoFinal)) {
      throw { status: 400, message: "Tipo de rejeição inválido!" };
    }

    const [insp] = await pool.query(
      "SELECT * FROM inspecoes WHERE pk_inspecaoID = ?",
      [atual.fk_inspecaoID],
    );

    if (insp.length === 0) {
      throw { status: 404, message: "Inspeção da rejeição não encontrada!" };
    }

    // Soma as outras rejeições da mesma inspeção 
    const [soma] = await pool.query(
      "SELECT COALESCE(SUM(quantidade), 0) AS total FROM rejeicoes WHERE fk_inspecaoID = ? AND pk_rejeicaoID <> ?",
      [atual.fk_inspecaoID, id],
    );

    if (Number(soma[0].total) + quantidadeFinal > Number(insp[0].rejeitadas)) {
      throw {
        status: 400,
        message: `A soma das rejeições passaria do total rejeitado na inspeção (${insp[0].rejeitadas})!`,
      };
    }

    const [result] = await pool.query(
      `UPDATE rejeicoes
       SET quantidade = ?, motivoRejeicao = ?, tipo = ?, acoesCorretivas = ?
       WHERE pk_rejeicaoID = ?`,
      [
        quantidadeFinal,
        motivoRejeicao?.trim() ? motivoRejeicao : atual.motivoRejeicao,
        tipoFinal,
        acoesCorretivas ?? atual.acoesCorretivas,
        id,
      ],
    );

    if (result.affectedRows === 0) {
      throw { status: 400, message: "Não foi possível atualizar a rejeição!" };
    }

    return NextResponse.json(
      { message: "Rejeição atualizada!" },
      { status: 200 },
    );
  } catch (err) {
    console.log("Rejeicoes PATCH : ", err);

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

export async function DELETE(request, { params }) {
  const { id } = await params;

  try {
    await checkAuthPosition(request);

    const [exist] = await pool.query(
      "SELECT * FROM rejeicoes WHERE pk_rejeicaoID = ?",
      [id],
    );

    if (exist.length === 0) {
      throw { status: 404, message: "Rejeição não encontrada!" };
    }

    await pool.query("DELETE FROM rejeicoes WHERE pk_rejeicaoID = ?", [id]);

    return NextResponse.json(
      { message: "Rejeição excluída!" },
      { status: 200 },
    );
  } catch (err) {
    console.log("Rejeicoes DELETE : ", err);

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

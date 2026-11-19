import { NextResponse } from "next/server";
import pool from "../../../lib/connSql";
import { checkAuthPosition } from "../../../utils/authChecker";
import { registrarAuditoria } from "../../../utils/auditoria";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const { totalProduzido, aprovadas, rejeitadas, observacoes } = body;

  try {
    const usuario = await checkAuthPosition(request);

    const [exist] = await pool.query(
      "SELECT * FROM inspecoes WHERE pk_inspecaoID = ?",
      [id],
    );

    if (exist.length === 0) {
      throw { status: 404, message: "Inspeção não encontrada!" };
    }

    const atual = exist[0];

    const total =
      totalProduzido !== undefined && totalProduzido !== ""
        ? Number(totalProduzido)
        : Number(atual.totalProduzido);

    const aprov =
      aprovadas !== undefined && aprovadas !== ""
        ? Number(aprovadas)
        : Number(atual.aprovadas);

    const rejeit =
      rejeitadas !== undefined && rejeitadas !== ""
        ? Number(rejeitadas)
        : Number(atual.rejeitadas);

    if (total < 0 || aprov < 0 || rejeit < 0) {
      throw { status: 400, message: "Os números não podem ser negativos!" };
    }

    if (aprov + rejeit !== total) {
      throw {
        status: 400,
        message: "Aprovadas + rejeitadas precisa bater com o total produzido!",
      };
    }

    // Se já existem rejeições lançadas, o total rejeitado não pode encolher
    // abaixo da soma delas (senão o detalhe fica maior que o cabeçalho)
    const [somaRejeicoes] = await pool.query(
      "SELECT COALESCE(SUM(quantidade), 0) AS total FROM rejeicoes WHERE fk_inspecaoID = ?",
      [id],
    );

    if (rejeit < Number(somaRejeicoes[0].total)) {
      throw {
        status: 400,
        message: `Já existem ${somaRejeicoes[0].total} rejeições lançadas; o total rejeitado não pode ser menor!`,
      };
    }

    const [result] = await pool.query(
      `UPDATE inspecoes
       SET totalProduzido = ?, aprovadas = ?, rejeitadas = ?, observacoes = ?
       WHERE pk_inspecaoID = ?`,
      [
        total,
        aprov,
        rejeit,
        observacoes ?? atual.observacoes,
        id,
      ],
    );

    if (result.affectedRows === 0) {
      throw { status: 400, message: "Não foi possível atualizar a inspeção!" };
    }

    await registrarAuditoria(pool, {
      usuarioID: usuario.id,
      entidade: "inspecao",
      entidadeID: id,
      acao: "edicao",
      dadosAnteriores: {
        totalProduzido: atual.totalProduzido,
        aprovadas: atual.aprovadas,
        rejeitadas: atual.rejeitadas,
        observacoes: atual.observacoes,
      },
      dadosNovos: {
        totalProduzido: total,
        aprovadas: aprov,
        rejeitadas: rejeit,
        observacoes: observacoes ?? atual.observacoes,
      },
      observacao: "Edição da inspeção",
    });

    return NextResponse.json(
      { message: "Inspeção atualizada!" },
      { status: 200 },
    );
  } catch (err) {
    console.log("Inspecoes PATCH : ", err);

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
    const usuario = await checkAuthPosition(request);

    const [exist] = await pool.query(
      "SELECT * FROM inspecoes WHERE pk_inspecaoID = ?",
      [id],
    );

    if (exist.length === 0) {
      throw { status: 404, message: "Inspeção não encontrada!" };
    }

    // Rejeição aponta pra inspeção, então não dá pra sair apagando tudo
    const [rejeicoes] = await pool.query(
      "SELECT pk_rejeicaoID FROM rejeicoes WHERE fk_inspecaoID = ? LIMIT 1",
      [id],
    );

    if (rejeicoes.length > 0) {
      throw {
        status: 409,
        message: "Exclua as rejeições dessa inspeção antes de removê-la!",
      };
    }

    await pool.query("DELETE FROM inspecoes WHERE pk_inspecaoID = ?", [id]);

    await registrarAuditoria(pool, {
      usuarioID: usuario.id,
      entidade: "inspecao",
      entidadeID: id,
      acao: "exclusao",
      dadosAnteriores: {
        ordem: exist[0].fk_ordemID,
        totalProduzido: exist[0].totalProduzido,
        aprovadas: exist[0].aprovadas,
        rejeitadas: exist[0].rejeitadas,
        observacoes: exist[0].observacoes,
      },
      observacao: "Exclusão da inspeção",
    });

    return NextResponse.json(
      { message: "Inspeção excluída!" },
      { status: 200 },
    );
  } catch (err) {
    console.log("Inspecoes DELETE : ", err);

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

import { NextResponse } from "next/server";
import pool from "../../../lib/connSql";
import { checkAuthPosition } from "../../../utils/authChecker";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const { ehOperador, ehMecanico, especializacao, telefone } = body;

  try {
    await checkAuthPosition(request);

    const [exist] = await pool.query(
      "SELECT * FROM profissionais WHERE pk_profissionalID = ?",
      [id],
    );

    if (exist.length === 0) {
      throw { status: 404, message: "Profissional não encontrado!" };
    }

    const profissional = exist[0];

    const operador =
      ehOperador === undefined || ehOperador === ""
        ? profissional.ehOperador
        : String(ehOperador) === "1" || ehOperador === true
          ? 1
          : 0;

    const mecanico =
      ehMecanico === undefined || ehMecanico === ""
        ? profissional.ehMecanico
        : String(ehMecanico) === "1" || ehMecanico === true
          ? 1
          : 0;

    if (!operador && !mecanico) {
      throw {
        status: 400,
        message: "O profissional precisa ser operador e/ou mecânico!",
      };
    }

    // Tirar a função de alguém com atividade aberta deixa a operação órfã
    if (profissional.ehOperador && !operador) {
      const [ordensAbertas] = await pool.query(
        `SELECT codigo FROM ordensProducao
         WHERE fk_operadorID = ? AND status IN ('Pendente', 'Em Produção')
         LIMIT 1`,
        [id],
      );

      if (ordensAbertas.length > 0) {
        throw {
          status: 409,
          message: `O profissional ainda tem a ordem ${ordensAbertas[0].codigo} aberta. Resolva antes de remover o perfil de operador!`,
        };
      }
    }

    if (profissional.ehMecanico && !mecanico) {
      const [manutencoesAbertas] = await pool.query(
        `SELECT descricao FROM manutencoesProgramadas
         WHERE fk_mecanicoID = ? AND status IN ('Programada', 'Em Execução')
         LIMIT 1`,
        [id],
      );

      if (manutencoesAbertas.length > 0) {
        throw {
          status: 409,
          message: `O profissional ainda tem a manutenção "${manutencoesAbertas[0].descricao}" aberta. Resolva antes de remover o perfil de mecânico!`,
        };
      }
    }

    const espFinal =
      especializacao !== undefined ? especializacao : profissional.especializacao;

    const telFinal = telefone !== undefined ? telefone : profissional.telefone;

    const [result] = await pool.query(
      "UPDATE profissionais SET ehOperador = ?, ehMecanico = ?, especializacao = ?, telefone = ? WHERE pk_profissionalID = ?",
      [operador, mecanico, espFinal, telFinal, id],
    );

    if (result.affectedRows === 0) {
      throw { status: 400, message: "Não foi possível atualizar o profissional!" };
    }

    return NextResponse.json(
      { message: "Profissional atualizado!" },
      { status: 200 },
    );
  } catch (err) {
    console.log("Profissionais PATCH : ", err);

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
      "SELECT * FROM profissionais WHERE pk_profissionalID = ?",
      [id],
    );

    if (exist.length === 0) {
      throw { status: 404, message: "Profissional não encontrado!" };
    }

    // Não dá pra desativar quem ainda tem compromisso em aberto
    const [ordensAbertas] = await pool.query(
      `SELECT codigo FROM ordensProducao
       WHERE fk_operadorID = ? AND status IN ('Pendente', 'Em Produção')
       LIMIT 1`,
      [id],
    );

    if (ordensAbertas.length > 0) {
      throw {
        status: 409,
        message: `O profissional ainda tem a ordem ${ordensAbertas[0].codigo} aberta. Conclua ou reprograme antes de desativar!`,
      };
    }

    const [manutencoesAbertas] = await pool.query(
      `SELECT descricao FROM manutencoesProgramadas
       WHERE fk_mecanicoID = ? AND status IN ('Programada', 'Em Execução')
       LIMIT 1`,
      [id],
    );

    if (manutencoesAbertas.length > 0) {
      throw {
        status: 409,
        message: `O profissional ainda tem a manutenção "${manutencoesAbertas[0].descricao}" aberta. Conclua ou cancele antes de desativar!`,
      };
    }

    const [result] = await pool.query(
      "UPDATE profissionais SET status = 'Desativado' WHERE pk_profissionalID = ? AND status = 'Ativo'",
      [id],
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: "Profissional já desativado!" },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { message: "Profissional desativado com sucesso!" },
      { status: 200 },
    );
  } catch (err) {
    console.log("Profissionais DELETE : ", err);

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

export async function PUT(request, { params }) {
  const { id } = await params;

  try {
    await checkAuthPosition(request);

    const [exist] = await pool.query(
      "SELECT * FROM profissionais WHERE pk_profissionalID = ?",
      [id],
    );

    if (exist.length === 0) {
      throw { status: 404, message: "Profissional não encontrado!" };
    }

    const [result] = await pool.query(
      "UPDATE profissionais SET status = 'Ativo' WHERE pk_profissionalID = ? AND status = 'Desativado'",
      [id],
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: "Profissional já ativo!" },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { message: "Profissional ativado com sucesso!" },
      { status: 200 },
    );
  } catch (err) {
    console.log("Profissionais PUT : ", err);

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

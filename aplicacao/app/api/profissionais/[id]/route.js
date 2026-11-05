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

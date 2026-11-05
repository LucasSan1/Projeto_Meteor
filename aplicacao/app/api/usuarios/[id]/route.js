import { NextResponse } from "next/server";
import pool from "../../../lib/connSql";
import { checkAuthPosition } from "../../../utils/authChecker";
import { hashPass } from "../../../utils/hash";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const { nome, email, cargo, senha, status } = body;

  try {
    await checkAuthPosition(request);

    const [exist] = await pool.query(
      "SELECT * FROM usuarios WHERE id = ?",
      [id],
    );

    if (exist.length === 0) {
      throw { status: 404, message: "Usuário não encontrado!" };
    }

    const usuario = exist[0];

    const nomeFinal = nome?.trim() ? nome : usuario.nome;
    const emailFinal = email?.trim() ? email : usuario.email;
    const cargoFinal = cargo || usuario.cargo;
    const statusFinal = status || usuario.status;

    // Senha só muda se vier algo; senão mantém o hash atual
    const senhaFinal = senha?.trim()
      ? await hashPass(senha)
      : usuario.senha;

    const [result] = await pool.query(
      "UPDATE usuarios SET nome = ?, email = ?, cargo = ?, senha = ?, status = ? WHERE id = ?",
      [nomeFinal, emailFinal, cargoFinal, senhaFinal, statusFinal, id],
    );

    if (result.affectedRows === 0) {
      throw { status: 400, message: "Não foi possível atualizar o usuário!" };
    }

    return NextResponse.json(
      { message: `Usuário ${nomeFinal} atualizado!` },
      { status: 200 },
    );
  } catch (err) {
    console.log("Usuarios PATCH : ", err);

    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { message: "Já existe um usuário com esse e-mail!" },
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

export async function DELETE(request, { params }) {
  const { id } = await params;

  try {
    await checkAuthPosition(request);

    const [exist] = await pool.query(
      "SELECT * FROM usuarios WHERE id = ?",
      [id],
    );

    if (exist.length === 0) {
      throw { status: 404, message: "Usuário não encontrado!" };
    }

    const [result] = await pool.query(
      "UPDATE usuarios SET status = 'Desativado' WHERE id = ? AND status = 'Ativo'",
      [id],
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: "Usuário já desativado!" },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { message: "Usuário desativado com sucesso!" },
      { status: 200 },
    );
  } catch (err) {
    console.log("Usuarios DELETE : ", err);

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
      "SELECT * FROM usuarios WHERE id = ?",
      [id],
    );

    if (exist.length === 0) {
      throw { status: 404, message: "Usuário não encontrado!" };
    }

    const [result] = await pool.query(
      "UPDATE usuarios SET status = 'Ativo' WHERE id = ? AND status = 'Desativado'",
      [id],
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: "Usuário já ativo!" },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { message: "Usuário ativado com sucesso!" },
      { status: 200 },
    );
  } catch (err) {
    console.log("Usuarios PUT : ", err);

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

import { NextResponse } from "next/server";
import pool from "../../../lib/connSql";
import { checkAuthPosition } from "../../../utils/authChecker";
import { hashPass } from "../../../utils/hash";

// Conta desativada não pode deixar ordem/manutenção aberta pra trás
async function garantirSemAtividadesAbertas(fkUsuarioID) {
  const [profissionais] = await pool.query(
    "SELECT pk_profissionalID FROM profissionais WHERE fk_usuarioID = ?",
    [fkUsuarioID],
  );

  if (profissionais.length === 0) return;

  const profissionalID = profissionais[0].pk_profissionalID;

  const [ordensAbertas] = await pool.query(
    `SELECT codigo FROM ordensProducao
     WHERE fk_operadorID = ? AND status IN ('Pendente', 'Em Produção')
     LIMIT 1`,
    [profissionalID],
  );

  if (ordensAbertas.length > 0) {
    throw {
      status: 409,
      message: `O usuário ainda tem a ordem ${ordensAbertas[0].codigo} aberta. Resolva antes de desativar!`,
    };
  }

  const [manutencoesAbertas] = await pool.query(
    `SELECT descricao FROM manutencoesProgramadas
     WHERE fk_mecanicoID = ? AND status IN ('Programada', 'Em Execução')
     LIMIT 1`,
    [profissionalID],
  );

  if (manutencoesAbertas.length > 0) {
    throw {
      status: 409,
      message: `O usuário ainda tem a manutenção "${manutencoesAbertas[0].descricao}" aberta. Resolva antes de desativar!`,
    };
  }
}

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

    if (usuario.status === "Ativo" && statusFinal === "Desativado") {
      await garantirSemAtividadesAbertas(id);
    }

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

    if (exist[0].status === "Ativo") {
      await garantirSemAtividadesAbertas(id);
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

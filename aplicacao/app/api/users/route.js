import { NextResponse } from "next/server";
import  pool  from "../../lib/connSql";

export async function POST(request) {
  try {
    const body = await request.json();

    const { nome, email, senha } = body;

    const [result] = await pool.query(
      "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)",
      [nome, email, senha]
    );

    return NextResponse.json({
      message: "Usuário inserido com sucesso",
      id: result.insertId
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Erro ao inserir usuário" },
      { status: 500 }
    );
  }
}
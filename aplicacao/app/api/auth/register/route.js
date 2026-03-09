import { NextResponse } from "next/server";
import  pool  from "../../../lib/connSql";

import { hashPass } from "../../../utils/hash"

export async function POST(request) {
  try {
    const body = await request.json();

    const { nome, email, cargo } = body;
    
    if(!nome || !email || !cargo){
      return NextResponse.json(
        { message: "Dados invalidos" },
        { status: 400 }
      )
    }

    const senha = "meteor@2026";
    const senhaCript = await hashPass(senha); 

    const [result] = await pool.query(
      "INSERT INTO usuarios (nome, email, cargo, senha) VALUES (?, ?, ?, ?)",
      [nome, email, cargo, senhaCript]
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
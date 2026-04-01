import { NextResponse } from "next/server";
import  pool  from "../../../lib/connSql";

import { hashPass } from "../../../utils/hash"

// Rota para adicionar novos usuarios
export async function POST(request) {
  try {
    const body = await request.json();

    const { nome, email, cargo } = body;
    
    if(!nome || !email || !cargo){
      return NextResponse.json(
        { message: "Dados invalidos!" },
        { status: 400 }
      )
    }

    const senha = process.env.PATTERN_PASS;
    const senhaCript = await hashPass(senha); 

    const [result] = await pool.query(
      "INSERT INTO usuarios (nome, email, cargo, senha) VALUES (?, ?, ?, ?)",
      [nome, email, cargo, senhaCript]
    );

    return NextResponse.json({
      message: "Usuário inserido com sucesso!",
      id: result.insertId
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Erro do lado do servidor para registrar usuarios!" },
      { status: 500 }
    );
  }
}
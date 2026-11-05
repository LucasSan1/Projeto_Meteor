import { NextResponse } from "next/server";
import pool from "../../lib/connSql";
import { checkAuthPosition } from "../../utils/authChecker";
import { hashPass } from "../../utils/hash";

// Lista os usuários do sistema 
export async function GET(request) {
  try {
    await checkAuthPosition(request);

    const [result] = await pool.query(
      "SELECT id, nome, email, cargo, status FROM usuarios ORDER BY nome",
    );

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (err) {
    console.log("Usuarios GET : ", err);

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

// Cria um usuário novo com a senha já criptografada
export async function POST(request) {
  const body = await request.json();
  const { nome, email, cargo, senha } = body;

  try {
    await checkAuthPosition(request);

    if (!nome?.trim() || !email?.trim() || !cargo || !senha?.trim()) {
      throw { status: 400, message: "Preencha todos os campos!" };
    }

    const [exist] = await pool.query(
      "SELECT id FROM usuarios WHERE email = ?",
      [email],
    );

    if (exist.length > 0) {
      throw { status: 409, message: "Já existe um usuário com esse e-mail!" };
    }

    const senhaCript = await hashPass(senha);

    const [result] = await pool.query(
      "INSERT INTO usuarios (nome, email, cargo, senha) VALUES (?, ?, ?, ?)",
      [nome, email, cargo, senhaCript],
    );

    return NextResponse.json({
      message: "Usuário cadastrado com sucesso!",
      id: result.insertId,
    });
  } catch (err) {
    console.log("Usuarios POST : ", err);

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

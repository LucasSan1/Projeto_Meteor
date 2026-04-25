import { NextResponse } from "next/server";
import pool from "../../lib/connSql"
import { checkAuth, checkAuthPosition } from "../../utils/authChecker";

export async function POST(request) {
  const body = await request.json();

  const { nome, descricao, dataAquisicao, vidaUtil } = body;

  try{
    checkAuthPosition(request)

    if(!nome.trim() || !descricao.trim() || !dataAquisicao.trim()){
      throw { status: 400, message: "Os campos não devem estar vazio!" }
    }

    const [result] = await pool.query(
      "INSERT INTO equipamentos (nomeEquipamento, descricao, dataAquisicao, vidaUtilRestante) VALUES (?,?,?,?)",
      [nome, descricao, dataAquisicao, vidaUtil]
    )

    return NextResponse.json({
      message: "Equipamento cadastrado com sucesso!",
      id: result.insertId,
    });

  } catch (err) {
    console.log("Equipamento POST : ", err);

    if (err.status) {
      return NextResponse.json(
        { message: err.message },
        { status: err.status },
      );
    }

    return NextResponse.json(
      { message: "Erro do servidor! " },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try{
    checkAuthPosition(request)

    const [result] = await pool.query(
      "SELECT * FROM equipamentos"
    )

    return NextResponse.json({ data: result }, { status: 200 })

  }catch (err) {
    console.log("Equipamento GET : ", err);

    if (err.status) {
      return NextResponse.json(
        { message: err.message },
        { status: err.status },
      );
    }

    return NextResponse.json(
      { message: "Erro do servidor! " },
      { status: 500 },
    );
  }
}
import { NextResponse } from "next/server";
import pool from "../../lib/connSql"
import { checkAuth, checkAuthPosition } from "../../utils/authChecker";

export async function POST(request) {
    const body = await request.json();
    const {nome, especializacao } = body;

    try{
        checkAuthPosition(request)

        if(!nome?.trim() || !especializacao?.trim()){
            throw { status: 400, message: "Preencha todos os campos"}
        }

        const [result] = await pool.query(
            "INSERT INTO operadores (nome, especializacao) VALUES (?, ?) ",
            [nome, especializacao],
        )
        
        return NextResponse.json({
            message: "Operador cadastrado com sucesso!",
            id: result.insertId,
        })

    } catch (err) {
    console.log("Operadores POST: ", err);

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
            "SELECT * FROM operadores"
        );

        return NextResponse.json({ data: result }, { status: 200 })

    } catch (err) {
    console.log("Operadores GET: ", err);

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

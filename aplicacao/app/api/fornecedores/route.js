import { NextResponse } from "next/server";
import pool from "../../lib/connSql"
import { isvalid } from "../../utils/jwt";

export async function POST(request){
    try{
        const authHeader = request.headers.get("authorization");
        const token = authHeader.replace("Bearer ", "");

        const payload = isvalid(token)

        if(payload.cargo !== "gerente"){
            return NextResponse.json(
                { message: "Acesso negado" },
                { status: 403 }
            )
        }
        
        const body = await request.json();
        const { nome, endereco, contato, avaliacao } = body;

        if (!nome || !endereco || !contato ){
            return NextResponse.json(
                { message: "Nome endereco e contato não devem estar vazios!"},
                { status: 400}
            )
        }

        const aval = avaliacao ? avaliacao : 0

        const [result] = await pool.query(
            "INSERT INTO fornecedores (nomeFornecedor, endereco, contato, avaliacao) VALUES (?, ?, ?, ?)",
            [nome, endereco, contato, aval]
        ) 

        return NextResponse.json({
            message: "Fornecedor inserido com sucesso!",
            id: result.insertId
        });



    } catch(err){
        console.log("Fornecedores: ", err)

        return NextResponse.json(
            { message: "Erro do lado do servidor para fornecedores "},
            { status: 500 }
        )
    }
}
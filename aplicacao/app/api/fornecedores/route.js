import { NextResponse } from "next/server";
import pool from "../../lib/connSql"
import { isvalid } from "../../utils/jwt";

export async function POST(request){
    try{
        const authHeader = request.headers.get("authorization");
        const token = authHeader.split("")[1];

        const payload = isvalid(token)

        console.log("pay ", payload)
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


    } catch(err){
        console.log("Fornecedores: ", err)

        return NextResponse.json(
            { message: "Erro do lado do servidor para fornecedores "},
            { status: 500 }
        )
    }
}
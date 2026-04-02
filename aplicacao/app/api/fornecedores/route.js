import { NextResponse } from "next/server";
import pool from "../../lib/connSql"
import { checkAuth } from "../../../utils/authChecker";

// Função para salvar um novo fornecedor no banco
export async function POST(request){
    try{

        // Verifica o token
        checkAuth(request)

        // Extrai o json e valida os campos
        const body = await request.json();
        const { nome, endereco, contato, avaliacao } = body;

        if (!nome || !endereco || !contato ){
            return NextResponse.json(
                { message: "Nome endereco e contato não devem estar vazios!"},
                { status: 400}
            )
        }

        // Se não tiver avaliacao no json ela vira 0
        const aval = avaliacao ? avaliacao : 0

        // Insere informaçoes no banco
        const [result] = await pool.query(
            "INSERT INTO fornecedores (nomeFornecedor, endereco, contato, avaliacao) VALUES (?, ?, ?, ?)",
            [nome, endereco, contato, aval]
        ) 

        return NextResponse.json({
            message: "Fornecedor inserido com sucesso!",
            id: result.insertId
        });

    } catch(err){
        console.log("Fornecedores POST : ", err)

        if(err.status){
            return NextResponse.json(
                { message: err.message },
                { status: err.status }
            )
        }

        return NextResponse.json(
            { message: "Erro do lado do servidor para fornecedores! "},
            { status: 500 }
        )
    }
}

// Função para retornar todos os fornecedores cadastrados
export async function GET(request){
    try{

        const authHeader = request.headers.get("authorization")
    
        const payload = isvalid(authHeader)

        if(payload === "Token expirado!"){
            return NextResponse.json(
                { message: "Token expirado, por favor logue novamente!"},
                { status: 401}
            )
        }

        const [result] = await pool.query(
            "SELECT * FROM fornecedores WHERE fstatus = 'Ativado' "
        )

        return NextResponse.json(
            { data: result },
            { status: 200 }
        )

    } catch(err){
        console.log("Fornecedores GET: ", err)

        return NextResponse.json(
            { message: "Erro do lado do servidor para fornecedores! "},
            { status: 500 }
        )

    }
}

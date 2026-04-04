import { NextResponse } from "next/server";
import pool from "../../lib/connSql"
import { checkAuthPosition, checkAuth } from "../../utils/authChecker";

// Função para salvar um novo fornecedor no banco
export async function POST(request){
    try{

        // Verifica o token com base no cargo
        checkAuthPosition(request)

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
            message: "Fornecedor cadastrado com sucesso!",
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
            { message: "Erro do servidor! "},
            { status: 500 }
        )
    }
}

// Função para retornar todos os fornecedores cadastrados
export async function GET(request){
    try{

        // Apenas verifica se o token é valido e não expirou, ignorando o cargo
        checkAuth(request)

        const [result] = await pool.query(
            "SELECT * FROM fornecedores WHERE status = 'Ativo' "
        )

        return NextResponse.json(
            { data: result },
            { status: 200 }
        )

    } catch(err){
        console.log("Fornecedores GET: ", err)

        if(err.status){
            return NextResponse.json(
                { message: err.message },
                { status: err.status }
            )
        }

        return NextResponse.json(
            { message: "Erro do servidor! "},
            { status: 500 }
        )

    }
}

import { NextResponse } from "next/server";
import pool from "../../../lib/connSql"
import { checkAuthPosition } from "../../../utils/authChecker";


// Função para atualizar cadastro de um fornecedor
export async function PATCH(request, { params }){

    const { id } = await params;
    const body = await request.json();
    let { nome, endereco, contato, avaliacao } = body;

    try{ 
        checkAuthPosition(request)

        // Verifica se o fornecedor existe
        const [exist] = await pool.query(
            "SELECT * FROM fornecedores WHERE pk_fornecedorID = ?",
            [id]
        ) 

        if(exist.length === 0){
            return NextResponse.json(
                { message: "Fornecedor não encontrado!" },
                { status: 404 }
            )
        }

        const fornecedor = exist[0];

        // Se não tiver valor no json seta os valores já existentes no banco
        nome = nome ?? fornecedor.nomeFornecedor;
        endereco = endereco ?? fornecedor.endereco;
        contato = contato ?? fornecedor.contato;
        avaliacao = avaliacao ?? fornecedor.avaliacao;
        
        const [result] = await pool.query(
            "UPDATE fornecedores SET nomeFornecedor = ?, endereco = ?, contato = ?, avaliacao = ? WHERE pk_fornecedorID = ?",
            [nome, endereco, contato, avaliacao, id] 
        )

        if(result.affectedRows === 0 ){
            return NextResponse.json(
                { message: "Não foi possivel atualizar o cadastro!" },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { message: `Fornecedor ${ nome } atualizado!`},
            { status: 200 }
        )

    } catch(err){
        console.log("Fornecedores PATCH: ", err)

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

// Soft delete no fornecedor
export async function DELETE(request, { params }) {
 
    const { id } = await params;

    try{
        checkAuthPosition(request)

        const [exist] = await pool.query(
                "SELECT * FROM fornecedores WHERE pk_fornecedorID = ?",
                [id]
            ) 

        if(exist.length === 0){
            return NextResponse.json(
                { message: "Fornecedor não encontrado!" },
                { status: 404 }
            )
        }

        const [result] = await pool.query(
            "UPDATE fornecedores SET fstatus = 'Desativado' WHERE pk_fornecedorID = ? AND fstatus = 'Ativado'",
            [id] 
        )

        if(result.affectedRows > 0 ){

            return NextResponse.json(
                { message: "Fornecedor desativado com sucesso!" },
                { status: 200 }
            )
        } else if(result.affectedRows === 0){

            return NextResponse.json(
                { message: "Fornecedor já desativado!" },
                { status: 200 }
            )
        }
     
    } catch(err){
        console.log("Erro ao deletar fornecedor: ", err)

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
// Função para ativar um fornecedor
export async function POST(request, { params }) {

     const { id } = await params;

   try{
        checkAuthPosition(request)

        const [exist] = await pool.query(
                "SELECT * FROM fornecedores WHERE pk_fornecedorID = ?",
                [id]
            ) 

        if(exist.length === 0){
            return NextResponse.json(
                { message: "Fornecedor não encontrado!" },
                { status: 404 }
            )
        }

        const [result] = await pool.query(
            "UPDATE fornecedores SET fstatus = 'Ativado' WHERE pk_fornecedorID = ? AND fstatus = 'Desativado'",
            [id] 
        )

        if(result.affectedRows > 0 ){

            return NextResponse.json(
                { message: "Fornecedor ativado com sucesso!" },
                { status: 200 }
            )
        } else if(result.affectedRows === 0){

            return NextResponse.json(
                { message: "Fornecedor já ativo!" },
                { status: 200 }
            )
        }
     
    } catch(err){
        console.log("Erro ao deletar fornecedor: ", err)

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
import { NextResponse } from "next/server";
import pool from "../../../lib/connSql"
import { checkAuthPosition } from "../../../utils/authChecker";


// Função para atualizar cadastro de um fornecedor
export async function PATCH(request, { params }){

    const { id } = await params;
    const body = await request.json();
    let { nome, endereco, contato, avaliacao, status } = body;

    try{ 
        checkAuthPosition(request)

        // Verifica se o fornecedor existe
        const [exist] = await pool.query(
            "SELECT * FROM fornecedores WHERE pk_fornecedorID = ? AND status = 'Ativo'",
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
        nome = nome && nome.trim() !== "" ? nome : fornecedor.nomeFornecedor;
        endereco = endereco && endereco.trm() !== "" ? endereco : fornecedor.endereco;
        contato = contato && contato.trim() !== "" ? contato : fornecedor.contato;
        avaliacao = avaliacao && avaliacao.trim() !== "" ? avaliacao : fornecedor.avaliacao;
        status = status && status.trim() !== ""  ? status : fornecedor.status
        
        const [result] = await pool.query(
            "UPDATE fornecedores SET nomeFornecedor = ?, endereco = ?, contato = ?, avaliacao = ?, status = ? WHERE pk_fornecedorID = ?",
            [nome, endereco, contato, avaliacao, status, id] 
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
            "UPDATE fornecedores SET status = 'Desativado' WHERE pk_fornecedorID = ? AND status = 'Ativo'",
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
            { message: "Erro do servidor!"},
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
            "UPDATE fornecedores SET status = 'Ativo' WHERE pk_fornecedorID = ? AND status = 'Desativado'",
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
        console.log("Erro ao ativar fornecedor: ", err)

        if(err.status){
            return NextResponse.json(
                { message: err.message },
                { status: err.status }
            )
        }

        return NextResponse.json(
            { message: "Erro do servidor!"},
            { status: 500 }
        )

    }
}
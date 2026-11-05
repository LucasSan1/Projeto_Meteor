import { NextResponse } from "next/server";
import pool from "../../../lib/connSql"
import { checkAuthPosition } from "../../../utils/authChecker";


// Função para atualizar cadastro de um fornecedor
export async function PATCH(request, { params }){

    const { id } = await params;
    const body = await request.json();
    let { nome, cnpj, endereco, contato, avaliacao, status } = body;

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
        cnpj = cnpj ? String(cnpj).replace(/\D/g, "") : fornecedor.cnpj;
        endereco = endereco && endereco.trim() !== "" ? endereco : fornecedor.endereco;
        contato = contato && contato.trim() !== "" ? contato : fornecedor.contato;
        // avaliacao vem como número do banco e como string do input, então evita o .trim() cego
        avaliacao = avaliacao !== undefined && avaliacao !== "" ? avaliacao : fornecedor.avaliacao;
        status = status && status.trim() !== ""  ? status : fornecedor.status

        // Mesma faixa do POST: DECIMAL(2,1) não aceita negativo nem 10
        if (
            avaliacao !== null &&
            (!Number.isFinite(Number(avaliacao)) || Number(avaliacao) < 0 || Number(avaliacao) > 9.9)
        ) {
            return NextResponse.json(
                { message: "A avaliação deve ficar entre 0 e 9.9!" },
                { status: 400 }
            )
        }

        if (String(cnpj).length !== 14) {
            return NextResponse.json(
                { message: "O CNPJ deve ter 14 dígitos!" },
                { status: 400 }
            )
        }

        const [result] = await pool.query(
            "UPDATE fornecedores SET nomeFornecedor = ?, cnpj = ?, endereco = ?, contato = ?, avaliacao = ?, status = ? WHERE pk_fornecedorID = ?",
            [nome, cnpj, endereco, contato, avaliacao, status, id] 
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

        if(err.code === "ER_DUP_ENTRY"){
            return NextResponse.json(
                { message: "Já existe um fornecedor com esse CNPJ!" },
                { status: 409 }
            )
        }

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
export async function PUT(request, { params }) {

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
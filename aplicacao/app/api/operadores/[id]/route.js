import { NextResponse } from "next/server";
import pool from "../../../lib/connSql"
import { checkAuth, checkAuthPosition } from "../../../utils/authChecker"

export async function DELETE(request, { params } ) {
    const { id } = await params;

    try{
        checkAuthPosition(request)

        const [exist] = await pool.query(
                "SELECT * FROM operadores WHERE pk_operadorID = ?",
                [id]
            ) 

        if(!exist || exist.length === 0){
            throw { status: 404, message: "Operador não encontrada" }
        }

        const [result] = await pool.query(
            "UPDATE operadores SET status = 'Desativado' WHERE pk_operadorID = ? AND status = 'Ativo'",
            [id] 
        )

        if(result.affectedRows > 0 ){

            return NextResponse.json(
                { message: "Operador desativado com sucesso!" },
                { status: 200 }
            )
        } else if(result.affectedRows === 0){

            return NextResponse.json(
                { message: "Operador já desativado!" },
                { status: 200 }
            )
        }
     
    } catch(err){
        console.log("Operador DELETE: ", err)

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


export async function POST(request, { params }) {

    const { id } = await params;

   try{
        checkAuthPosition(request)

        const [exist] = await pool.query(
                "SELECT * FROM operadores WHERE pk_operadorID= ?",
                [id]
            ) 
            
        if(!exist || exist.length === 0){
            throw { status: 404, message: "Operador não encontrada!" }
        }

        const [result] = await pool.query(
            "UPDATE operadores SET status = 'Ativo' WHERE pk_operadorID = ? AND status = 'Desativado'",
            [id] 
        )

        if(result.affectedRows > 0 ){

            return NextResponse.json(
                { message: "Operador ativado com sucesso!" },
                { status: 200 }
            )
        } else if(result.affectedRows === 0){

            return NextResponse.json(
                { message: "Operador já ativo!" },
                { status: 200 }
            )
        }
     
    } catch(err){
        console.log("Erro ao ativar operador: ", err)

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

export async function PUT(request, { params }) {

    const { id } = await params;

    try {

        checkAuthPosition(request);

        const [result] = await pool.query(
            `
            UPDATE operadores
            SET disponibilidade =
                CASE
                    WHEN disponibilidade = 'Disponivel'
                        THEN 'Indisponivel'
                    WHEN disponibilidade = 'Indisponivel'
                        THEN 'Disponivel'
                END
            WHERE pk_operadorID = ?
            AND status = 'Ativo'
            `,
            [id]
        );

        if (result.affectedRows === 0) {

            throw {
                status: 404,
                message: "Operador não encontrado ou inativo!"
            };

        }

        return NextResponse.json(
            { message: "Disponibilidade alterada com sucesso!" },
            { status: 200 }
        );

    } catch (err) {
        console.log("Erro ao alterar disponibilidade do operador:", err);

        if (err.status) {
            return NextResponse.json(
                { message: err.message },
                { status: err.status }
            );
        }

        return NextResponse.json(
            { message: "Erro do servidor!" },
            { status: 500 }
        );

    }

}

export async function PATCH(request, { params } ) {
    const {id} = await params;
    const body = await request.json();
    const { nome, especializacao } = body;

    try{

        if(!nome.trim() || !especializacao.trim()){
            throw { status: 400, message: "Preencha todos os campos!"}
        }

        const [exist] = await pool.query(
            "SELECT * FROM operadores WHERE pk_operadorID = ?",
            [id]
        )

        if(!exist || exist.length === 0){
            throw { status: 404, message: "Operador não encontrado!"}
        }

        const [result] = await pool.query(
            "UPDATE operadores SET nome = ?, especializacao = ? WHERE pk_operadorID = ?",
            [nome, especializacao, id]
        )

        if(result.affectedRows === 0){
            return NextResponse.json(
                { message: "Não foi possivel atualizar o cadastro!"},
                { status: 400 } 
            )
        }

        return NextResponse.json(
            { message: "Operador atualizado!"},
            { status: 200}
        )

    } catch (err) {
        console.log("Erro ao atualizar cadastro de operador:", err);

        if (err.status) {
            return NextResponse.json(
                { message: err.message },
                { status: err.status }
            );
        }

        return NextResponse.json(
            { message: "Erro do servidor!" },
            { status: 500 }
        );

    }
}
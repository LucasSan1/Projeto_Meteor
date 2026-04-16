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
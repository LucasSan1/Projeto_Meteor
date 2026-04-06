import { NextResponse } from "next/server";
import pool from "../../../lib/connSql"
import { checkAuth, checkAuthPosition } from "../../../utils/authChecker"

export async function POST(request, { params } ) {
    const { id } = await params;
    const body = await request.json();
    let { status } = body;

    try{

        checkAuth(request);

        const [exist] = await pool.query(
            "SELECT * FROM ordensProducao WHERE pk_ordemID = ?",
            [id]
        )

        if(!exist || exist.length === 0 ){
            throw { status: 404, message: "OS não encontrada"}
        }

        const [result] = await pool.query(
            "UPDATE ordensProducao SET status = ? WHERE pk_ordemID = ?",
            [status, id] 
        )

        if(result.affectedRows === 0 ){
            throw { status: 400, message: "Não foi possivel atualizar o status da ordem!"}    
        }

        return NextResponse.json(
            { message: `Status da OS atualizado!`},
            { status: 200 }
        )


    } catch(err){
        console.log("Mudança de status OS POST: ", err)

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
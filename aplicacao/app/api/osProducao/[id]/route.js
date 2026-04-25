import { NextResponse } from "next/server";
import pool from "../../../lib/connSql"
import { checkAuth, checkAuthPosition } from "../../../utils/authChecker"
import { getDataBrasilia } from "../../../utils/getData"

export async function PUT(request, { params } ) {
    const { id } = await params;
    const body = await request.json();
    let { status } = body;
    let datetime = null;

    try{

        checkAuth(request);

        const [exist] = await pool.query(
            "SELECT * FROM ordensProducao WHERE pk_ordemID = ?",
            [id]
        )

        if(!exist || exist.length === 0 ){
            throw { status: 404, message: "OS não encontrada"}
        }

        if(status === "Pronto" || status === "Cancelado"){
            datetime = getDataBrasilia() || null
        } else if (status != "Pronto"){
             datetime = exist.dataConclusao
        }

        // Validar fluxo, uma ordem pronta ou cancelada não pode ser alterada depois

        const [result] = await pool.query(
            "UPDATE ordensProducao SET status = ?, dataConclusao = ? WHERE pk_ordemID = ?",
            [status, datetime, id] 
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
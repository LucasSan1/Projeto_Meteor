import { NextResponse } from "next/server";
import pool from "../../lib/connSql"
import { checkAuth, checkAuthPosition } from "../../utils/authChecker"

export async function POST(request) {
    const body = await request.json();
    const { pecaID, quantidade, dataInicio, dataConclusao } = body;

    try{

        checkAuthPosition(request)

        const [exist] = await pool.query(
            "SELECT * FROM pecas WHERE pk_pecaID = ?",
            [pecaID]
        )

        if(!exist || exist.length === 0 ){
            throw { status: 404, message: "Peça não encontrada!" }
        }

        const [result] = await pool.query(
            "INSERT INTO ordensProducao (fk_pecaID, quantidade, dataInicio, dataConclusao) VALUES (?,?,?,?)",
            [pecaID, quantidade, dataInicio, dataConclusao]
        )

        return NextResponse.json({
            message: "Ordem de serviço cadastrada com sucesso!",
            id: result.insertId
        });


    } catch(err){
        console.log("Os Produção POST : ", err)
        
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

export async function GET(request) {
      try{
        checkAuth(request)

        const [result] = await pool.query(
            "SELECT * FROM ordensProducao"
        )

        return NextResponse.json(
            { data: result },
            { status: 200 }
        )

    } catch(err){
        console.log("OS produção GET : ", err)

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
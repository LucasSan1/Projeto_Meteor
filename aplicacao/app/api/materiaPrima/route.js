import { NextResponse } from "next/server";
import pool from "../../lib/connSql"
import { checkAuth, checkAuthPosition } from "../../utils/authChecker"

// Rota para adicionar materias primas
export async function POST(request){
    const body = await request.json();
    const { materia, fornecedor, quantidadeEstoque, dataCompra } = body;

    try{
        checkAuthPosition(request);

        if(!materia || !fornecedor || !quantidadeEstoque || !dataCompra){
            return NextResponse.json(
                    { message: "Preencha todas as informações!"},
                    { status: 400 }
                )
        }

        const [searchSup] = await pool.query(
            "SELECT * FROM fornecedores WHERE pk_fornecedorID = ?",
            [fornecedor]
        )

        if(!searchSup || searchSup.length === 0 || searchSup.fstatus === "Ativado"){
            return NextResponse.json(
                { message: "Fornecedor não encontrado!" },
                { status: 400 }
            )
        }

        const [result] = await pool.query(
            "INSERT INTO materiasPrimas (materia, fk_fornecedor, quantidadeEstoque, dataUltimaCompra) VALUES (?, ?, ?, ?)", 
            [materia, fornecedor, quantidadeEstoque, dataCompra]
        )

        return NextResponse.json({
            message: "Matéria cadastrada com sucesso!",
            id: result.insertId
        });


    } catch(err){
        console.log("Materia POST : ", err)
        console.log("post name ", err.sqlState)
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

// Rota para mostrar todas as materias cadastradas
export async function GET(request) {
    try{
        checkAuth(request)

        const [result] = await pool.query(
            "SELECT * FROM materiasPrimas WHERE status = 'Ativo' "
        )

        return NextResponse.json(
            { data: result },
            { status: 200 }
        )

    } catch(err){
        console.log("Materia POST : ", err)

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
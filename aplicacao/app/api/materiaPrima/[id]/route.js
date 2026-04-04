import { NextResponse } from "next/server";
import pool from "../../../lib/connSql"
import { checkAuth, checkAuthPosition } from "../../../utils/authChecker"

export async function PATCH(request, { params } ) {
    const { id } = await params;
    const body = await request.json();
    let { material, quantidadeEstoque, dataUltimaCompra } = body;

    try{

        checkAuth(request);

        const [exist] = await pool.query(
            "SELECT * FROM materiasPrimas WHERE pk_materiaID = ? AND status = 'Ativo'",
            [id]
        )

        if(!exist || exist.length === 0 ){
            return NextResponse.json(
                { message: "Matéria prima não encontrada!" },
                { status: 404 }
            )
        }

        const mate = exist[0];

        material = material ?? mate.materia;
        quantidadeEstoque = quantidadeEstoque ?? mate.quantidadeEstoque;
        dataUltimaCompra = dataUltimaCompra ?? mate.dataUltimaCompra

        const [result] = await pool.query(
            "UPDATE materiasPrimas SET materia = ?, quantidadeEstoque = ?, dataUltimaCompra = ? WHERE pk_materiaID = ? AND status = 'Ativo'",
            [material, quantidadeEstoque, dataUltimaCompra, id] 
        )

        if(result.affectedRows === 0 ){
            return NextResponse.json(
                { message: "Não foi possivel atualizar o cadastro!" },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { message: `Matéria prima ${ material } atualizado!`},
            { status: 200 }
        )


    } catch(err){
        console.log("Materia PATCH: ", err)

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

export async function DELETE(request, { params }) {
    const { id } = await params;

    try{
        checkAuthPosition(request)

        const [exist] = await pool.query(
                "SELECT * FROM materiasPrimas WHERE pk_materiaID = ?",
                [id]
            ) 

        if(exist.length === 0){
            return NextResponse.json(
                { message: "Materia prima não encontrado!" },
                { status: 404 }
            )
        }

        const [result] = await pool.query(
            "UPDATE materiasPrimas SET status = 'Desativado' WHERE pk_materiaID = ? AND status = 'Ativo'",
            [id] 
        )

        if(result.affectedRows > 0 ){

            return NextResponse.json(
                { message: "Materia prima desativado com sucesso!" },
                { status: 200 }
            )
        } else if(result.affectedRows === 0){

            return NextResponse.json(
                { message: "Materia prima já desativado!" },
                { status: 200 }
            )
        }
     
    } catch(err){
        console.log("Erro ao deletar materia prima: ", err)

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
                "SELECT * FROM materiasPrimas WHERE pk_materiaID= ?",
                [id]
            ) 

        if(exist.length === 0){
            return NextResponse.json(
                { message: "Matéria prima não encontrado!" },
                { status: 404 }
            )
        }

        const [result] = await pool.query(
            "UPDATE materiasPrimas SET status = 'Ativo' WHERE pk_materiaID = ? AND status = 'Desativado'",
            [id] 
        )

        if(result.affectedRows > 0 ){

            return NextResponse.json(
                { message: "Matéria prima ativado com sucesso!" },
                { status: 200 }
            )
        } else if(result.affectedRows === 0){

            return NextResponse.json(
                { message: "Matéria prima já ativo!" },
                { status: 200 }
            )
        }
     
    } catch(err){
        console.log("Erro ao ativar materia prima: ", err)

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
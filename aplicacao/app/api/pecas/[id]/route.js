import { NextResponse } from "next/server";
import pool from "../../../lib/connSql"
import { checkAuth, checkAuthPosition } from "../../../utils/authChecker"

export async function PATCH(request, { params } ) {
    const { id } = await params;
    const body = await request.json();
    let { peca, material, peso, dimensoes } = body;

    try{
        checkAuthPosition(request)

        const [exist] = await pool.query(
            "SELECT * FROM pecas WHERE pk_pecaID = ? AND status = 'Ativo'",
            [id]
        )

        if(!exist || exist.length === 0 ){
           throw { status: 404, message: "Peça não encontrada ou inativa!" }
        }

        const part = exist[0]

        peca = peca && peca.trim() !== "" ? peca : part.peca;
        material = material === "" ? part.fk_material : material;
        peso = peso && peso.trim() !== "" ? peso : part.peso;
        dimensoes = dimensoes && dimensoes.trim() !== "" ? dimensoes : part.Dimensoes;

        const [mat] = await pool.query(
            "SELECT pk_materiaID FROM materiasPrimas WHERE pk_materiaID = ? AND status = 'Ativo'",
            [material]
        );

        if(!mat || mat.length === 0){
            throw { status: 404, message: "Material inválido!" }
        } 

        const [result] = await pool.query(
            "UPDATE pecas SET peca = ?, fk_material = ?, peso = ?, Dimensoes = ? WHERE pk_pecaID = ? AND status = 'Ativo'",
            [peca, material, peso, dimensoes, id]
        )
        
        if(result.affectedRows === 0 ){
            return NextResponse.json(
                { message: "Não foi possivel atualizar o cadastro!" },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { message: `Peça ${ peca } atualizada!`},
            { status: 200 }
        )


    } catch(err){
        console.log("Peçãs PATCH : ", err)
        
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

export async function DELETE(request, { params } ) {
    const { id } = await params;

    try{
        checkAuthPosition(request)

        const [exist] = await pool.query(
                "SELECT * FROM pecas WHERE pk_pecaID = ?",
                [id]
            ) 

        if(!exist || exist.length === 0){
            throw { status: 404, message: "Peça não encontrada" }
        }

        const [result] = await pool.query(
            "UPDATE pecas SET status = 'Desativado' WHERE pk_pecaID = ? AND status = 'Ativo'",
            [id] 
        )

        if(result.affectedRows > 0 ){

            return NextResponse.json(
                { message: "Peça desativada com sucesso!" },
                { status: 200 }
            )
        } else if(result.affectedRows === 0){

            return NextResponse.json(
                { message: "Peça já desativado!" },
                { status: 200 }
            )
        }
     
    } catch(err){
        console.log("Peça DELETE: ", err)

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
                "SELECT * FROM pecas WHERE pk_pecaID= ?",
                [id]
            ) 

        if(!exist || exist.length === 0){
            throw { status: 404, message: "Peça não encontrada!" }
        }

        const [result] = await pool.query(
            "UPDATE pecas SET status = 'Ativo' WHERE pk_pecaID = ? AND status = 'Desativado'",
            [id] 
        )

        if(result.affectedRows > 0 ){

            return NextResponse.json(
                { message: "Peça ativada com sucesso!" },
                { status: 200 }
            )
        } else if(result.affectedRows === 0){

            return NextResponse.json(
                { message: "Peça já ativa!" },
                { status: 200 }
            )
        }
     
    } catch(err){
        console.log("Erro ao ativar peça: ", err)

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
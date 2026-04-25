import { NextResponse } from "next/server";
import pool from "../../../lib/connSql"
import { checkAuth, checkAuthPosition } from "../../../utils/authChecker";

export async function PATCH(request, { params }) {
    const { id } = await params;
    const body = await request.json();
    let { nome, descricao, vidaUtil } = body;

    try{

        checkAuthPosition(request)

        const[exist] = await pool.query(
            "SELECT * FROM equipamentos WHERE pk_equipamentoID = ? AND status = 'Ativo'",
            [id]
        )

        if(!exist || exist.length === 0){
            throw { status: 404, message: "Equipamento não encontrado ou inativo!" }
        }

        const equip = exist[0]

        nome = nome && nome.trim() !== "" ? nome : equip.nomeEquipamento;
        descricao = descricao && descricao.trim() !== "" ? descricao : equip.descricao   
        vidaUtil = vidaUtil && vidaUtil !== "" ? vidaUtil : equip.vidaUtilRestante

        const [result] = await pool.query(
            "UPDATE equipamentos SET nomeEquipamento = ?, descricao = ?, vidaUtilRestante = ? WHERE pk_equipamentoID = ? AND status = 'Ativo'",
            [nome, descricao, vidaUtil, id]
        )

         if(result.affectedRows === 0 ){
            return NextResponse.json(
                { message: "Não foi possivel atualizar o cadastro!" },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { message: `Equipamento ${ nome } atualizado!`},
            { status: 200 }
        )

    } catch(err){
        console.log("Equipamento PATCH : ", err);

        if (err.status) {
        return NextResponse.json(
            { message: err.message },
            { status: err.status },
        );
        }

        return NextResponse.json(
        { message: "Erro do servidor! " },
        { status: 500 },
        );
    }
    
}

export async function DELETE(request, { params }) {
    const {id} = await params;

    try{
        checkAuthPosition(request)

        const[exist] = await pool.query(
            "SELECT * FROM equipamentos WHERE pk_equipamentoID = ?",
            [id]
        )

        if(!exist || exist.length === 0){
            throw { status: 404, message: "Equipamento não encontrado ou inativo!" }
        }

        const[result] = await pool.query(
            "UPDATE equipamentos SET status = 'Desativado' WHERE pk_equipamentoID = ? AND status = 'Ativo'",
            [id]
        )

         if(result.affectedRows > 0 ){

            return NextResponse.json(
                { message: "Equipamento desativado com sucesso!" },
                { status: 200 }
            )
        } else if(result.affectedRows === 0){

            return NextResponse.json(
                { message: "Equipamento já desativado!" },
                { status: 200 }
            )
        }

    } catch(err){
        console.log("Equipamento DELETE : ", err);

        if (err.status) {
        return NextResponse.json(
            { message: err.message },
            { status: err.status },
        );
        }

        return NextResponse.json(
        { message: "Erro do servidor! " },
        { status: 500 },
        );
    }
}


export async function PUT(request, { params }) {
    const {id} = await params;

    try{
        checkAuthPosition(request)
        
         const[exist] = await pool.query(
            "SELECT * FROM equipamentos WHERE pk_equipamentoID = ?",
            [id]
        )

        if(!exist || exist.length === 0){
            throw { status: 404, message: "Equipamento não encontrado ou inativo!" }
        }

        const[result] = await pool.query(
            "UPDATE equipamentos SET status = 'Ativo' WHERE pk_equipamentoID = ? AND status = 'Desativado'",
            [id]
        )

         if(result.affectedRows > 0 ){

            return NextResponse.json(
                { message: "Equipamento ativado com sucesso!" },
                { status: 200 }
            )
        } else if(result.affectedRows === 0){

            return NextResponse.json(
                { message: "Equipamento já ativo!" },
                { status: 200 }
            )
        }

    } catch(err){
        console.log("Equipamento PUT : ", err);

        if (err.status) {
        return NextResponse.json(
            { message: err.message },
            { status: err.status },
        );
        }

        return NextResponse.json(
        { message: "Erro do servidor! " },
        { status: 500 },
        );
    }
}
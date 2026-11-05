import { NextResponse } from "next/server";
import pool from "../../../lib/connSql"
import { checkAuthPosition } from "../../../utils/authChecker";

export async function PATCH(request, { params }) {
    const { id } = await params;
    const body = await request.json();
    let { equipamento, nomeMaquina, descricao, capacidadeMaxima, ultimaManutencao } = body;

    try{
        await checkAuthPosition(request)

           // Verifica se a maquina existe
        const [exist] = await pool.query(
            "SELECT * FROM maquinas WHERE pk_maquinaID = ? AND status = 'Ativo'",
            [id]
        ) 

        if(exist.length === 0){
            throw { status: 400, message: "Maquina não encontrada"}
        }

        const maquina = exist[0];

        const equipamentoFinal = equipamento || maquina.fk_equipamentoID;

        nomeMaquina = nomeMaquina && nomeMaquina.trim() !== "" ? nomeMaquina : maquina.nomeMaquina;
        descricao =  descricao && descricao.trim() !== "" ? descricao :  maquina.descricao;
        capacidadeMaxima = capacidadeMaxima && capacidadeMaxima.trim() !== "" ? capacidadeMaxima : maquina.capacidadeMaxima;
        ultimaManutencao = ultimaManutencao && String(ultimaManutencao).trim() !== "" ? ultimaManutencao : maquina.ultimaManutencao

        // Confere se o equipamento escolhido existe antes de trocar o vínculo
        const [equip] = await pool.query(
            "SELECT pk_equipamentoID FROM equipamentos WHERE pk_equipamentoID = ?",
            [equipamentoFinal]
        )

        if(equip.length === 0){
            throw { status: 404, message: "Equipamento não encontrado!" }
        }

        const [result] = await pool.query(
            "UPDATE maquinas SET fk_equipamentoID = ?, nomeMaquina = ?, descricao = ?, capacidadeMaxima = ?, ultimaManutencao = ? WHERE pk_maquinaID = ?",
            [equipamentoFinal, nomeMaquina, descricao, capacidadeMaxima, ultimaManutencao, id] 
        )

        if(result.affectedRows === 0 ){
            return NextResponse.json(
                { message: "Não foi possivel atualizar o cadastro!" },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { message: `Maquina ${ nomeMaquina } atualizada!`},
            { status: 200 }
        )


    } catch(err){
        console.log("Maquina PATCH: ", err)

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

export async function PUT(request, { params }) {

    const { id } = await params;

    console.log("Das ", id)
    try {

        await checkAuthPosition(request);

        const [result] = await pool.query(
            `
            UPDATE maquinas
            SET status =
                CASE
                    WHEN status = 'Ativo'
                        THEN 'Desativado'
                    WHEN status = 'Desativado'
                        THEN 'Ativo'
                END
            WHERE pk_maquinaID = ?
            `,
            [id]
        );

        if (result.affectedRows === 0) {

            throw {
                status: 404,
                message: "Maquina não encontrada!"
            };

        }

        return NextResponse.json(
            { message: "Status alterado com sucesso!" },
            { status: 200 }
        );

    } catch (err) {
        console.log("Erro ao alterar status da maquina:", err);

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
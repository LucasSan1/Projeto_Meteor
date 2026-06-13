import { NextResponse } from "next/server";
import pool from "../../lib/connSql";
import { checkAuth, checkAuthPosition } from "../../utils/authChecker";

export async function POST(request){
    const body = await request.json();
    const { equipamento, nomeMaquina, descricao, capacidadeMaxima, ultimaManutencao } = body;

    try{
        checkAuthPosition(request)

        if(!equipamento?.trim() || !nomeMaquina?.trim() || !capacidadeMaxima?.trim()){
            throw { status: 400, message: "Preencha os campos equipamento, nome e capacidade!" }
        }

        const [result] = await pool.query(
            "INSERT INTO maquinas (fk_equipamentoID, nomeMaquina, descricao, capacidadeMaxima) VALUES (?, ?, ?, ?) ",
            [equipamento, nomeMaquina, descricao, capacidadeMaxima, ultimaManutencao],
        )

        return NextResponse.json({
            message: "Maquina cadastrada com sucesso!",
            id: result.insertId,
        })

    } catch (err) {
        console.log("Maquinas POST: ", err);

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

export async function GET(request) {
    try{
        checkAuthPosition(request)

        const [result] = await pool.query(
            "SELECT * FROM maquinas ORDER BY pk_maquinaID DESC"
        );

        return NextResponse.json({ data: result }, { status: 200 })

    } catch (err) {
        console.log("Maquinas GET: ", err);

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

import { NextResponse } from "next/server";
import pool from "../../lib/connSql";
import { checkAuthPosition } from "../../utils/authChecker";
import { autorizar, CARGOS } from "../../utils/authMiddleware";
import { registrarAuditoria } from "../../utils/auditoria";
import {
  comPaginacao,
  contarLinhas,
  lerPaginacao,
  paramsComPaginacao,
  respostaLista,
} from "../../utils/paginacao";

export async function POST(request){
    const body = await request.json();
    const { equipamento, nomeMaquina, descricao, capacidadeMaxima, ultimaManutencao } = body;

    try{
        const usuario = await checkAuthPosition(request)

        const equipamentoId = equipamento ? String(equipamento).trim() : "";

        if(!equipamentoId || !nomeMaquina?.trim() || !capacidadeMaxima?.trim()){
            throw { status: 400, message: "Preencha os campos equipamento, nome e capacidade!" }
        }

        const [equip] = await pool.query(
            "SELECT pk_equipamentoID FROM equipamentos WHERE pk_equipamentoID = ?",
            [equipamentoId]
        )

        if(equip.length === 0){
            throw { status: 404, message: "Equipamento não encontrado!" }
        }

        const [result] = await pool.query(
            "INSERT INTO maquinas (fk_equipamentoID, nomeMaquina, descricao, capacidadeMaxima, ultimaManutencao) VALUES (?, ?, ?, ?, ?) ",
            [equipamentoId, nomeMaquina, descricao, capacidadeMaxima, ultimaManutencao || null],
        )

        await registrarAuditoria(pool, {
            usuarioID: usuario.id,
            entidade: "maquina",
            entidadeID: result.insertId,
            acao: "criacao",
            dadosNovos: {
                equipamento: equipamentoId,
                nomeMaquina,
                descricao,
                capacidadeMaxima,
                ultimaManutencao: ultimaManutencao || null,
            },
            observacao: "Máquina cadastrada",
        });

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
        // Gestor cadastra, mecânico precisa enxergar máquinas pra agendar manutenção
        await autorizar(request, [CARGOS.GERENTE, CARGOS.MECANICO])

        const paginacao = lerPaginacao(request);

        const [result] = await pool.query(
            comPaginacao("SELECT * FROM maquinas ORDER BY pk_maquinaID DESC", paginacao),
            paramsComPaginacao([], paginacao),
        );

        const total = paginacao
            ? await contarLinhas(pool, "SELECT COUNT(*) AS total FROM maquinas")
            : null;

        return NextResponse.json(respostaLista(result, paginacao, total), { status: 200 })

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

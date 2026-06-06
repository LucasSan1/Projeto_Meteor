import { NextResponse } from "next/server";
import pool from "../../lib/connSql"
import { checkAuth, checkAuthPosition } from "../../utils/authChecker";

export async function GET(request) {
    try{
        const [
            [[ordensPendentes]],
            [[ordensProducao]],
            [[ordensFinalizadas]],
            [[operadoresDisponiveis]],
            [[operadoresIndisponiveis]],
            [[maquinasAtivas]],
            [[maquinasDesativadas]],
            [[pecasAtivas]],
            [[equipamentosAtivos]],
            [[fornecedoresAtivos]]
        ] = await Promise.all([
            pool.query("SELECT COUNT(*) AS total FROM ordensProducao WHERE status = 'Pendente'"),
            pool.query("SELECT COUNT(*) AS total FROM ordensProducao WHERE status = 'Em Produção'"),
            pool.query("SELECT COUNT(*) AS total FROM ordensProducao WHERE status = 'Pronto'"),
            pool.query("SELECT COUNT(*) AS total FROM operadores WHERE disponibilidade = 'Disponivel' AND status = 'Ativo'"),
            pool.query("SELECT COUNT(*) AS total FROM operadores WHERE disponibilidade = 'Indisponivel' AND status = 'Ativo'"),
            pool.query("SELECT COUNT(*) AS total FROM maquinas WHERE status = 'Ativo'"),
            pool.query("SELECT COUNT(*) AS total FROM maquinas WHERE status = 'Desativado'"),
            pool.query("SELECT COUNT(*) AS total FROM pecas WHERE status = 'Ativo'"),
            pool.query("SELECT COUNT(*) AS total FROM equipamentos WHERE status = 'Ativo'"),
            pool.query("SELECT COUNT(*) AS total FROM fornecedores WHERE status = 'Ativo'")
        ]);

        return NextResponse.json({
            data: {
                ordens: {
                    pendentes: ordensPendentes.total,
                    producao: ordensProducao.total,
                    finalizadas: ordensFinalizadas.total,
                    atrasadas: 0 // implementar depois
                },

                operadores: {
                    disponiveis: operadoresDisponiveis.total,
                    indisponiveis: operadoresIndisponiveis.total,
                },

                maquinas: {
                    ativas: maquinasAtivas.total,
                    desativadas: maquinasDesativadas.total,
                    manutencaoPendente: 0 // implementar depois
                },

                estoque: {
                    pecas: pecasAtivas.total,
                    equipamentos: equipamentosAtivos.total,
                    fornecedores: fornecedoresAtivos.total,
                }
            }
        });


    } catch (err) {
        console.log("Dashbord GET : ", err);

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
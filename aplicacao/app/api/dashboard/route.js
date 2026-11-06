import { NextResponse } from "next/server";
import pool from "../../lib/connSql";
import { checkAuthPosition } from "../../utils/authChecker";

export async function GET(request) {
  try {
    await checkAuthPosition(request);

    const [
      [[ordensPendentes]],
      [[ordensProducao]],
      [[ordensConcluidas]],
      [[ordensCanceladas]],
      [[ordensAtrasadas]],
      [[operadores]],
      [[mecanicos]],
      [[maquinasAtivas]],
      [[maquinasDesativadas]],
      [[manutencoesAbertas]],
      [[manutencoesAtrasadas]],
      [[pecasAtivas]],
      [[equipamentosAtivos]],
      [[fornecedoresAtivos]],
      [[materiasAtivas]],
      [[materiasEstoqueBaixo]],
      [[inspecoes]],
      [[qualidade]],
      [[rejeicoesPorTipo]],
    ] = await Promise.all([
      pool.query(
        "SELECT COUNT(*) AS total FROM ordensProducao WHERE status = 'Pendente'",
      ),
      pool.query(
        "SELECT COUNT(*) AS total FROM ordensProducao WHERE status = 'Em Produção'",
      ),
      pool.query(
        "SELECT COUNT(*) AS total FROM ordensProducao WHERE status = 'Concluída'",
      ),
      pool.query(
        "SELECT COUNT(*) AS total FROM ordensProducao WHERE status = 'Cancelada'",
      ),
      pool.query(
        `SELECT COUNT(*) AS total
         FROM ordensProducao
         WHERE status IN ('Pendente', 'Em Produção')
           AND terminoPlanejado < NOW()`,
      ),
      pool.query(
        "SELECT COUNT(*) AS total FROM profissionais WHERE status = 'Ativo' AND ehOperador = 1",
      ),
      pool.query(
        "SELECT COUNT(*) AS total FROM profissionais WHERE status = 'Ativo' AND ehMecanico = 1",
      ),
      pool.query(
        "SELECT COUNT(*) AS total FROM maquinas WHERE status = 'Ativo'",
      ),
      pool.query(
        "SELECT COUNT(*) AS total FROM maquinas WHERE status = 'Desativado'",
      ),
      pool.query(
        "SELECT COUNT(*) AS total FROM manutencoesProgramadas WHERE status IN ('Programada', 'Em Execução')",
      ),
      pool.query(
        `SELECT COUNT(*) AS total
         FROM manutencoesProgramadas
         WHERE status IN ('Programada', 'Em Execução')
           AND terminoPrevisto < NOW()`,
      ),
      pool.query("SELECT COUNT(*) AS total FROM pecas WHERE status = 'Ativo'"),
      pool.query(
        "SELECT COUNT(*) AS total FROM equipamentos WHERE status = 'Ativo'",
      ),
      pool.query(
        "SELECT COUNT(*) AS total FROM fornecedores WHERE status = 'Ativo'",
      ),
      pool.query(
        "SELECT COUNT(*) AS total FROM materiasPrimas WHERE status = 'Ativo'",
      ),
      pool.query(
        "SELECT COUNT(*) AS total FROM materiasPrimas WHERE status = 'Ativo' AND quantidadeEstoque <= estoqueMinimo",
      ),
      pool.query("SELECT COUNT(*) AS total FROM inspecoes"),
      pool.query(
        `SELECT
           COALESCE(SUM(totalProduzido), 0) AS inspecionado,
           COALESCE(SUM(aprovadas), 0) AS aprovadas,
           COALESCE(SUM(rejeitadas), 0) AS rejeitadas
         FROM inspecoes`,
      ),
      pool.query(
        `SELECT
           COALESCE(SUM(CASE WHEN tipo = 'Perda' THEN quantidade ELSE 0 END), 0) AS perdas,
           COALESCE(SUM(CASE WHEN tipo = 'Retrabalho' THEN quantidade ELSE 0 END), 0) AS retrabalhos
         FROM rejeicoes`,
      ),
    ]);

    const totalInspecionado = Number(qualidade.inspecionado);
    const totalRejeitado = Number(qualidade.rejeitadas);

    return NextResponse.json({
      data: {
        ordens: {
          pendentes: ordensPendentes.total,
          producao: ordensProducao.total,
          finalizadas: ordensConcluidas.total,
          canceladas: ordensCanceladas.total,
          atrasadas: ordensAtrasadas.total,
        },

        profissionais: {
          operadores: operadores.total,
          mecanicos: mecanicos.total,
        },

        maquinas: {
          ativas: maquinasAtivas.total,
          desativadas: maquinasDesativadas.total,
          manutencaoPendente: manutencoesAbertas.total,
          manutencoesAtrasadas: manutencoesAtrasadas.total,
        },

        estoque: {
          pecas: pecasAtivas.total,
          equipamentos: equipamentosAtivos.total,
          fornecedores: fornecedoresAtivos.total,
          materias: materiasAtivas.total,
          estoqueBaixo: materiasEstoqueBaixo.total,
        },

        qualidade: {
          inspecoes: inspecoes.total,
          inspecionado: totalInspecionado,
          aprovadas: Number(qualidade.aprovadas),
          rejeitadas: totalRejeitado,
          // Indicador só faz sentido com algo inspecionado (RN18)
          indiceRejeicao:
            totalInspecionado > 0
              ? Number(((totalRejeitado / totalInspecionado) * 100).toFixed(2))
              : null,
          perdas: Number(rejeicoesPorTipo.perdas),
          retrabalhos: Number(rejeicoesPorTipo.retrabalhos),
        },
      },
    });
  } catch (err) {
    console.log("Dashboard GET : ", err);

    if (err.status) {
      return NextResponse.json(
        { message: err.message },
        { status: err.status },
      );
    }

    return NextResponse.json(
      { message: "Erro do servidor!" },
      { status: 500 },
    );
  }
}

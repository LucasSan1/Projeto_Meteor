import { NextResponse } from "next/server";
import pool from "../../lib/connSql";
import { checkAuth } from "../../utils/authChecker";

export async function GET(request) {
  try {
    checkAuth(request);

    const [
      [[ordensPendentes]],
      [[ordensProducao]],
      [[ordensConcluidas]],
      [[ordensCanceladas]],
      [[operadores]],
      [[mecanicos]],
      [[maquinasAtivas]],
      [[maquinasDesativadas]],
      [[manutencoesAbertas]],
      [[pecasAtivas]],
      [[equipamentosAtivos]],
      [[fornecedoresAtivos]],
      [[materiasAtivas]],
      [[materiasEstoqueBaixo]],
      [[inspecoes]],
      [[rejeitadas]],
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
        "SELECT COALESCE(SUM(rejeitadas), 0) AS total FROM inspecoes",
      ),
    ]);

    return NextResponse.json({
      data: {
        ordens: {
          pendentes: ordensPendentes.total,
          producao: ordensProducao.total,
          finalizadas: ordensConcluidas.total,
          canceladas: ordensCanceladas.total,
          atrasadas: 0, // implementar depois
        },

        profissionais: {
          operadores: operadores.total,
          mecanicos: mecanicos.total,
        },

        maquinas: {
          ativas: maquinasAtivas.total,
          desativadas: maquinasDesativadas.total,
          manutencaoPendente: manutencoesAbertas.total,
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
          rejeitadas: rejeitadas.total,
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

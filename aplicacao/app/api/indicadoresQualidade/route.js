import { NextResponse } from "next/server";
import pool from "../../lib/connSql";
import { autorizarGestor } from "../../utils/authMiddleware";

function calcularIndice(rejeitadas, inspecionado) {
  const total = Number(inspecionado);

  if (total <= 0) return null;

  return Number(((Number(rejeitadas) / total) * 100).toFixed(2));
}

function dataValida(valor) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(valor || ""));
}

// Indicadores de qualidade por ordem, operador e período
export async function GET(request) {
  try {
    await autorizarGestor(request);

    const { searchParams } = new URL(request.url);
    const inicio = searchParams.get("inicio");
    const fim = searchParams.get("fim");
    const operador = searchParams.get("operador");

    // Sem essa trava, um "operador=abc" viraria NaN no SQL e derrubaria a consulta
    const operadorID = operador ? Number(operador) : null;

    if (operador && (!Number.isInteger(operadorID) || operadorID <= 0)) {
      throw { status: 400, message: "Operador inválido!" };
    }

    if (inicio && !dataValida(inicio)) {
      throw { status: 400, message: "Data inicial inválida!" };
    }

    if (fim && !dataValida(fim)) {
      throw { status: 400, message: "Data final inválida!" };
    }

    if (inicio && fim && inicio > fim) {
      throw {
        status: 400,
        message: "A data inicial não pode ser depois da data final!",
      };
    }

    const condicoes = [];
    const params = [];

    if (inicio) {
      condicoes.push("DATE(i.dataInspecao) >= ?");
      params.push(inicio);
    }

    if (fim) {
      condicoes.push("DATE(i.dataInspecao) <= ?");
      params.push(fim);
    }

    if (operador) {
      condicoes.push("op.fk_operadorID = ?");
      params.push(operadorID);
    }

    const where = condicoes.length
      ? `WHERE ${condicoes.join(" AND ")}`
      : "";

    const [
      [[resumo]],
      [[rejeicoesPorTipo]],
      [porOperador],
      [porOrdem],
      [porPeriodo],
    ] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*) AS ordens,
           COALESCE(SUM(i.totalProduzido), 0) AS inspecionado,
           COALESCE(SUM(i.aprovadas), 0) AS aprovadas,
           COALESCE(SUM(i.rejeitadas), 0) AS rejeitadas
         FROM inspecoes i
         INNER JOIN ordensProducao op ON op.pk_ordemID = i.fk_ordemID
         ${where}`,
        params,
      ),
      pool.query(
        `SELECT
           COALESCE(SUM(CASE WHEN r.tipo = 'Perda' THEN r.quantidade ELSE 0 END), 0) AS perdas,
           COALESCE(SUM(CASE WHEN r.tipo = 'Retrabalho' THEN r.quantidade ELSE 0 END), 0) AS retrabalhos
         FROM rejeicoes r
         INNER JOIN inspecoes i ON i.pk_inspecaoID = r.fk_inspecaoID
         INNER JOIN ordensProducao op ON op.pk_ordemID = i.fk_ordemID
         ${where}`,
        params,
      ),
      pool.query(
        `SELECT
           prof.pk_profissionalID AS operadorID,
           u.nome AS operador,
           COUNT(*) AS ordens,
           COALESCE(SUM(i.totalProduzido), 0) AS inspecionado,
           COALESCE(SUM(i.aprovadas), 0) AS aprovadas,
           COALESCE(SUM(i.rejeitadas), 0) AS rejeitadas
         FROM inspecoes i
         INNER JOIN ordensProducao op ON op.pk_ordemID = i.fk_ordemID
         INNER JOIN profissionais prof ON prof.pk_profissionalID = op.fk_operadorID
         INNER JOIN usuarios u ON u.id = prof.fk_usuarioID
         ${where}
         GROUP BY prof.pk_profissionalID, u.nome
         ORDER BY u.nome`,
        params,
      ),
      pool.query(
        `SELECT
           op.codigo AS ordem,
           p.peca,
           u.nome AS operador,
           i.totalProduzido,
           i.aprovadas,
           i.rejeitadas,
           i.dataInspecao
         FROM inspecoes i
         INNER JOIN ordensProducao op ON op.pk_ordemID = i.fk_ordemID
         INNER JOIN pecas p ON p.pk_pecaID = op.fk_pecaID
         INNER JOIN profissionais prof ON prof.pk_profissionalID = op.fk_operadorID
         INNER JOIN usuarios u ON u.id = prof.fk_usuarioID
         ${where}
         ORDER BY i.dataInspecao DESC, i.pk_inspecaoID DESC`,
        params,
      ),
      pool.query(
        `SELECT
           DATE(i.dataInspecao) AS dia,
           COALESCE(SUM(i.totalProduzido), 0) AS inspecionado,
           COALESCE(SUM(i.aprovadas), 0) AS aprovadas,
           COALESCE(SUM(i.rejeitadas), 0) AS rejeitadas
         FROM inspecoes i
         INNER JOIN ordensProducao op ON op.pk_ordemID = i.fk_ordemID
         ${where}
         GROUP BY DATE(i.dataInspecao)
         ORDER BY dia DESC`,
        params,
      ),
    ]);

    const inspecionado = Number(resumo.inspecionado);
    const rejeitadas = Number(resumo.rejeitadas);

    return NextResponse.json({
      data: {
        filtros: { inicio: inicio || null, fim: fim || null, operador: operador || null },
        resumo: {
          ordens: Number(resumo.ordens),
          inspecionado,
          aprovadas: Number(resumo.aprovadas),
          rejeitadas,
          indiceRejeicao: calcularIndice(rejeitadas, inspecionado),
          perdas: Number(rejeicoesPorTipo.perdas),
          retrabalhos: Number(rejeicoesPorTipo.retrabalhos),
        },
        porOperador: porOperador.map((item) => ({
          ...item,
          ordens: Number(item.ordens),
          inspecionado: Number(item.inspecionado),
          aprovadas: Number(item.aprovadas),
          rejeitadas: Number(item.rejeitadas),
          indiceRejeicao: calcularIndice(item.rejeitadas, item.inspecionado),
        })),
        porOrdem: porOrdem.map((item) => ({
          ...item,
          totalProduzido: Number(item.totalProduzido),
          aprovadas: Number(item.aprovadas),
          rejeitadas: Number(item.rejeitadas),
          indiceRejeicao: calcularIndice(item.rejeitadas, item.totalProduzido),
        })),
        porPeriodo: porPeriodo.map((item) => ({
          ...item,
          inspecionado: Number(item.inspecionado),
          aprovadas: Number(item.aprovadas),
          rejeitadas: Number(item.rejeitadas),
          indiceRejeicao: calcularIndice(item.rejeitadas, item.inspecionado),
        })),
      },
    });
  } catch (err) {
    console.log("Indicadores qualidade GET : ", err);

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

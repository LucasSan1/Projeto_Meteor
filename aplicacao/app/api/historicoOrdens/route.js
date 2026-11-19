import { NextResponse } from "next/server";
import pool from "../../lib/connSql";
import { checkAuthPosition } from "../../utils/authChecker";
import {
  comPaginacao,
  contarLinhas,
  lerPaginacao,
  paramsComPaginacao,
  respostaLista,
} from "../../utils/paginacao";

export async function GET(request) {
  try {
    await checkAuthPosition(request);

    const paginacao = lerPaginacao(request);

    const [ordens] = await pool.query(
      comPaginacao(
        `
        SELECT
          op.pk_ordemID,
          op.codigo,
          op.fk_pecaID,
          p.peca,
          op.quantidadePlanejada,
          op.especializacao,
          op.fk_operadorID,
          u.nome AS operador,
          op.inicioPlanejado,
          op.terminoPlanejado,
          op.inicioEfetivo,
          op.conclusaoEfetiva,
          op.status
        FROM ordensProducao op
        INNER JOIN pecas p ON op.fk_pecaID = p.pk_pecaID
        INNER JOIN profissionais prof ON op.fk_operadorID = prof.pk_profissionalID
        INNER JOIN usuarios u ON prof.fk_usuarioID = u.id
        ORDER BY op.inicioPlanejado DESC, op.pk_ordemID DESC
      `,
        paginacao,
      ),
      paramsComPaginacao([], paginacao),
    );

    // Paginando, busca só os filhos das ordens da página
    const idsDaPagina = ordens.map((ordem) => ordem.pk_ordemID);
    const paramsIds = paginacao ? [idsDaPagina] : [];
    const filtroMateriais = paginacao ? "WHERE om.fk_ordemID IN (?)" : "";
    const filtroHistorico = paginacao ? "WHERE h.fk_ordemID IN (?)" : "";

    const [materiais] = await pool.query(
      `
        SELECT
          om.fk_ordemID,
          m.materia,
          m.unidadeMedida,
          om.quantidadePrevista,
          om.quantidadeConsumida
        FROM ordemMateriais om
        INNER JOIN materiasPrimas m ON om.fk_materiaID = m.pk_materiaID
        ${filtroMateriais}
        ORDER BY m.materia
      `,
      paramsIds,
    );

    const [historicos] = await pool.query(
      `
        SELECT
          h.pk_historicoID,
          h.fk_ordemID,
          h.statusAnterior,
          h.statusNovo,
          h.dataAlteracao,
          h.observacao,
          u.nome AS usuario
        FROM historicoOrdens h
        INNER JOIN usuarios u ON h.fk_usuarioID = u.id
        ${filtroHistorico}
        ORDER BY h.dataAlteracao ASC, h.pk_historicoID ASC
      `,
      paramsIds,
    );

    // Agrupa por ordem pra não varrer as listas uma vez por card
    const materiaisPorOrdem = new Map();
    const historicoPorOrdem = new Map();

    for (const material of materiais) {
      const lista = materiaisPorOrdem.get(material.fk_ordemID) || [];
      lista.push(material);
      materiaisPorOrdem.set(material.fk_ordemID, lista);
    }

    for (const historico of historicos) {
      const lista = historicoPorOrdem.get(historico.fk_ordemID) || [];
      lista.push(historico);
      historicoPorOrdem.set(historico.fk_ordemID, lista);
    }

    const total = paginacao
      ? await contarLinhas(
          pool,
          "SELECT COUNT(*) AS total FROM ordensProducao",
        )
      : null;

    return NextResponse.json(
      respostaLista(
        ordens.map((ordem) => ({
          ...ordem,
          materiais: materiaisPorOrdem.get(ordem.pk_ordemID) || [],
          historico: historicoPorOrdem.get(ordem.pk_ordemID) || [],
        })),
        paginacao,
        total,
      ),
      { status: 200 },
    );
  } catch (err) {
    console.log("HistoricoOrdens GET : ", err);

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

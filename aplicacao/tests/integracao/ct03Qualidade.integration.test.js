import { describe, expect, it } from "vitest";

import { GET as indicadores } from "../../app/api/indicadoresQualidade/route";
import {
  POST as criarInspecao,
  GET as listarInspecoes,
} from "../../app/api/inspecoes/route";
import {
  POST as criarRejeicao,
  GET as listarRejeicoes,
} from "../../app/api/rejeicoes/route";
import { diaBrasilia } from "../apoio/datas";
import { chamar, tokenDe } from "./apoio/api";
import { consultar, um } from "./apoio/banco";
import {
  EMAILS,
  contar,
  criarOrdemDireta,
  profissionalPorEmail,
} from "./apoio/dados";

async function operadorIrinel() {
  return profissionalPorEmail(EMAILS.irinel);
}

async function criarOrdemConcluida(codigo) {
  const irinel = await operadorIrinel();

  return criarOrdemDireta({
    codigo,
    operadorID: irinel.id,
    inicioPlanejado: diaBrasilia(-10),
    terminoPlanejado: diaBrasilia(-9),
    status: "Concluída",
  });
}

async function criarInspecaoDireta(ordemID, total, aprovadas, rejeitadas) {
  return um(
    `INSERT INTO inspecoes (fk_ordemid, totalproduzido, aprovadas, rejeitadas)
     VALUES ($1, $2, $3, $4)
     RETURNING pk_inspecaoid AS id`,
    [ordemID, total, aprovadas, rejeitadas],
  );
}

function consultaIndicadores(query = "") {
  return `/api/indicadoresQualidade${query}`;
}

describe("CT03 - qualidade da produção", () => {
  it("RF09/RN18 - indicadores do seed batem com o banco", async () => {
    const token = await tokenDe(EMAILS.gerente);

    const { status, body } = await chamar(indicadores, {
      token,
      path: consultaIndicadores(),
    });

    expect(status).toBe(200);

    const resumo = await um(`
      SELECT COUNT(*)::int AS ordens,
             COALESCE(SUM(totalproduzido), 0)::int AS inspecionado,
             COALESCE(SUM(aprovadas), 0)::int AS aprovadas,
             COALESCE(SUM(rejeitadas), 0)::int AS rejeitadas
        FROM inspecoes
    `);

    const tipos = await um(`
      SELECT COALESCE(SUM(CASE WHEN tipo = 'Perda' THEN quantidade ELSE 0 END), 0)::int AS perdas,
             COALESCE(SUM(CASE WHEN tipo = 'Retrabalho' THEN quantidade ELSE 0 END), 0)::int AS retrabalhos
        FROM rejeicoes
    `);

    expect(body.data.resumo).toMatchObject({
      ordens: resumo.ordens,
      inspecionado: resumo.inspecionado,
      aprovadas: resumo.aprovadas,
      rejeitadas: resumo.rejeitadas,
      perdas: tipos.perdas,
      retrabalhos: tipos.retrabalhos,
    });

    expect(body.data.resumo.indiceRejeicao).toBe(
      Number(((resumo.rejeitadas / resumo.inspecionado) * 100).toFixed(2)),
    );

    expect(body.data.porOperador).toHaveLength(2);
    expect(body.data.porOrdem).toHaveLength(resumo.ordens);
    expect(body.data.porPeriodo).toHaveLength(5);
  });

  it("RF09 - filtra por operador e por período", async () => {
    const token = await tokenDe(EMAILS.gerente);
    const irinel = await operadorIrinel();

    const porOperador = await chamar(indicadores, {
      token,
      path: consultaIndicadores(`?operador=${irinel.id}`),
    });

    expect(porOperador.status).toBe(200);

    const esperadoOperador = await um(
      `SELECT COUNT(*)::int AS ordens,
              COALESCE(SUM(i.totalproduzido), 0)::int AS inspecionado,
              COALESCE(SUM(i.rejeitadas), 0)::int AS rejeitadas
         FROM inspecoes i
         INNER JOIN ordensproducao op ON op.pk_ordemid = i.fk_ordemid
        WHERE op.fk_operadorid = $1`,
      [irinel.id],
    );

    expect(porOperador.body.data.resumo).toMatchObject(esperadoOperador);
    expect(porOperador.body.data.porOperador).toHaveLength(1);
    expect(porOperador.body.data.porOperador[0].operadorID).toBe(irinel.id);

    const periodo = await chamar(indicadores, {
      token,
      path: consultaIndicadores("?inicio=2026-09-01&fim=2026-09-30"),
    });

    expect(periodo.status).toBe(200);

    const esperadoPeriodo = await um(`
      SELECT COUNT(*)::int AS ordens,
             COALESCE(SUM(totalproduzido), 0)::int AS inspecionado,
             COALESCE(SUM(rejeitadas), 0)::int AS rejeitadas
        FROM inspecoes
       WHERE DATE(datainspecao) BETWEEN '2026-09-01' AND '2026-09-30'
    `);

    expect(periodo.body.data.resumo).toMatchObject(esperadoPeriodo);
  });

  it("RF09 - recusa filtros inválidos", async () => {
    const token = await tokenDe(EMAILS.gerente);

    // Formato fora do padrão, a rota barra antes de chegar no banco
    const dataInvalida = await chamar(indicadores, {
      token,
      path: consultaIndicadores("?inicio=13/01/2030"),
    });

    expect(dataInvalida.status).toBe(400);

    const periodoInvertido = await chamar(indicadores, {
      token,
      path: consultaIndicadores("?inicio=2030-02-10&fim=2030-02-09"),
    });

    expect(periodoInvertido.status).toBe(400);

    const operadorInvalido = await chamar(indicadores, {
      token,
      path: consultaIndicadores("?operador=abc"),
    });

    expect(operadorInvalido.status).toBe(400);
  });

  it("RN18 - com zero inspecionado o índice fica não calculável", async () => {
    const token = await tokenDe(EMAILS.gerente);

    const { status, body } = await chamar(indicadores, {
      token,
      path: consultaIndicadores("?inicio=2031-01-01&fim=2031-01-02"),
    });

    expect(status).toBe(200);
    expect(body.data.resumo.inspecionado).toBe(0);
    expect(body.data.resumo.indiceRejeicao).toBeNull();
    expect(body.data.porOperador).toEqual([]);
    expect(body.data.porOrdem).toEqual([]);
    expect(body.data.porPeriodo).toEqual([]);
  });

  it("RN18 - o banco barra soma errada e inspeção duplicada", async () => {
    const ordem = await criarOrdemConcluida("OP-2026-300");

    await expect(
      consultar(
        `INSERT INTO inspecoes (fk_ordemid, totalproduzido, aprovadas, rejeitadas)
         VALUES ($1, 10, 8, 1)`,
        [ordem.id],
      ),
    ).rejects.toMatchObject({ code: "23514" });

    await criarInspecaoDireta(ordem.id, 10, 8, 2);

    await expect(
      consultar(
        `INSERT INTO inspecoes (fk_ordemid, totalproduzido, aprovadas, rejeitadas)
         VALUES ($1, 10, 8, 2)`,
        [ordem.id],
      ),
    ).rejects.toMatchObject({ code: "23505" });
  });

  it("RF09 - registra inspeção de ordem concluída e bloqueia repetição", async () => {
    const token = await tokenDe(EMAILS.gerente);
    const ordem = await criarOrdemConcluida("OP-2026-301");

    const criacao = await chamar(criarInspecao, {
      method: "POST",
      path: "/api/inspecoes",
      body: {
        ordem: ordem.id,
        totalProduzido: 10,
        aprovadas: 8,
        rejeitadas: 2,
        observacoes: "Lote do teste",
      },
      token,
    });

    expect(criacao.status).toBe(200);

    const inspecao = await um(
      `SELECT totalproduzido, aprovadas, rejeitadas
         FROM inspecoes
        WHERE fk_ordemid = $1`,
      [ordem.id],
    );

    expect(inspecao).toMatchObject({
      totalproduzido: 10,
      aprovadas: 8,
      rejeitadas: 2,
    });

    const repetida = await chamar(criarInspecao, {
      method: "POST",
      path: "/api/inspecoes",
      body: { ordem: ordem.id, totalProduzido: 1, aprovadas: 1, rejeitadas: 0 },
      token,
    });

    expect(repetida.status).toBe(409);

    const outraOrdem = await criarOrdemConcluida("OP-2026-302");

    const somaErrada = await chamar(criarInspecao, {
      method: "POST",
      path: "/api/inspecoes",
      body: {
        ordem: outraOrdem.id,
        totalProduzido: 10,
        aprovadas: 8,
        rejeitadas: 1,
      },
      token,
    });

    expect(somaErrada.status).toBe(400);
    expect(somaErrada.body.message).toMatch(/bater com o total/);

    const ordemAberta = await chamar(criarInspecao, {
      method: "POST",
      path: "/api/inspecoes",
      body: { ordem: 3, totalProduzido: 1, aprovadas: 1, rejeitadas: 0 },
      token,
    });

    expect(ordemAberta.status).toBe(404);
  });

  it("RF09 - rejeições somam exatamente o total e aparecem nos indicadores", async () => {
    const token = await tokenDe(EMAILS.gerente);
    const irinel = await operadorIrinel();
    const ordem = await criarOrdemConcluida("OP-2026-303");
    const inspecao = await criarInspecaoDireta(ordem.id, 10, 8, 2);

    // Data isolada pra não misturar com os números do seed
    await consultar(
      "UPDATE inspecoes SET datainspecao = $2 WHERE pk_inspecaoid = $1",
      [inspecao.id, "2030-02-10 10:00:00"],
    );

    const primeira = await chamar(criarRejeicao, {
      method: "POST",
      path: "/api/rejeicoes",
      body: {
        inspecao: inspecao.id,
        quantidade: 1,
        motivoRejeicao: "Trinca",
        tipo: "Perda",
      },
      token,
    });

    expect(primeira.status).toBe(200);

    const segunda = await chamar(criarRejeicao, {
      method: "POST",
      path: "/api/rejeicoes",
      body: {
        inspecao: inspecao.id,
        quantidade: 1,
        motivoRejeicao: "Rebarba",
        tipo: "Retrabalho",
      },
      token,
    });

    expect(segunda.status).toBe(200);

    const excedente = await chamar(criarRejeicao, {
      method: "POST",
      path: "/api/rejeicoes",
      body: {
        inspecao: inspecao.id,
        quantidade: 1,
        motivoRejeicao: "Excedente",
        tipo: "Perda",
      },
      token,
    });

    expect(excedente.status).toBe(400);
    expect(excedente.body.message).toMatch(/passaria do total/);

    expect(
      await contar("SELECT SUM(quantidade)::int FROM rejeicoes WHERE fk_inspecaoid = $1", [
        inspecao.id,
      ]),
    ).toBe(2);

    const { status, body } = await chamar(indicadores, {
      token,
      path: consultaIndicadores("?inicio=2030-02-10&fim=2030-02-10"),
    });

    expect(status).toBe(200);
    expect(body.data.resumo).toMatchObject({
      ordens: 1,
      inspecionado: 10,
      aprovadas: 8,
      rejeitadas: 2,
      indiceRejeicao: 20,
      perdas: 1,
      retrabalhos: 1,
    });

    expect(body.data.porOrdem).toHaveLength(1);
    expect(body.data.porOrdem[0]).toMatchObject({
      ordem: "OP-2026-303",
      operador: "Irinel",
      totalProduzido: 10,
      rejeitadas: 2,
      indiceRejeicao: 20,
    });

    expect(body.data.porOperador[0]).toMatchObject({
      operadorID: irinel.id,
      inspecionado: 10,
      indiceRejeicao: 20,
    });

    expect(body.data.porPeriodo[0]).toMatchObject({
      dia: "2030-02-10",
      inspecionado: 10,
      rejeitadas: 2,
      indiceRejeicao: 20,
    });
  });

  it("RF09 - listagens trazem inspeções e rejeições vinculadas", async () => {
    const token = await tokenDe(EMAILS.gerente);

    const inspecoes = await chamar(listarInspecoes, {
      token,
      path: "/api/inspecoes",
    });

    expect(inspecoes.status).toBe(200);
    expect(inspecoes.body.data.length).toBeGreaterThanOrEqual(5);

    const daOrdemUm = inspecoes.body.data.find(
      (item) => item.fk_ordemID === 1,
    );

    expect(daOrdemUm).toMatchObject({
      totalProduzido: 100,
      aprovadas: 96,
      rejeitadas: 4,
    });

    const rejeicoes = await chamar(listarRejeicoes, {
      token,
      path: "/api/rejeicoes",
    });

    expect(rejeicoes.status).toBe(200);
    expect(rejeicoes.body.data.length).toBeGreaterThanOrEqual(5);
  });
});

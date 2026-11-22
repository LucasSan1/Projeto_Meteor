import { describe, expect, it } from "vitest";

import {
  POST as criarManutencao,
} from "../../app/api/manutencoesProgramadas/route";
import {
  POST as criarOrdem,
  GET as listarOrdens,
} from "../../app/api/osProducao/route";
import {
  PATCH as reprogramarOrdem,
  PUT as mudarStatusOrdem,
} from "../../app/api/osProducao/[id]/route";
import { DELETE as desativarProfissional } from "../../app/api/profissionais/[id]/route";
import { diaBrasilia } from "../apoio/datas";
import { chamar, tokenDe } from "./apoio/api";
import { um } from "./apoio/banco";
import { EMAILS, contar, somarMinutos } from "./apoio/dados";

function corpoOrdem({
  codigo,
  operadorID = 1,
  inicio,
  termino,
  especializacao = "Usinagem",
  materiais = [{ materiaID: 1, quantidadePrevista: 1 }],
}) {
  return {
    codigo,
    pecaID: 1,
    quantidadePlanejada: 1,
    especializacao,
    operadorID,
    inicioPlanejado: inicio,
    terminoPlanejado: termino,
    materiais,
  };
}

async function criarOrdemValida(codigo, inicio, termino, extras = {}) {
  const resposta = await chamar(criarOrdem, {
    method: "POST",
    path: "/api/osProducao",
    token: await tokenDe(EMAILS.gerente),
    body: corpoOrdem({ codigo, inicio, termino, ...extras }),
  });

  expect(resposta.status).toBe(200);

  return resposta.body.id;
}

function corpoManutencao({ descricao, mecanico = 3, inicio, termino }) {
  return {
    equipamento: 1,
    maquina: 1,
    tipoManutencao: "Preventiva",
    descricao,
    especializacao: "Mecânica",
    mecanico,
    inicioPrevisto: inicio,
    terminoPrevisto: termino,
  };
}

// CT04 - Agenda real, locks no profissional, dias ocupados e liberação após cancelar/reprogramar
describe("CT04 - agenda e disponibilidade", () => {
  it("RN13/RN14 - impede duas ordens do mesmo operador no dia", async () => {
    const inicio = diaBrasilia(300);
    const termino = diaBrasilia(302);

    const primeira = await chamar(criarOrdem, {
      method: "POST",
      path: "/api/osProducao",
      token: await tokenDe(EMAILS.gerente),
      body: corpoOrdem({
        codigo: "OP-2026-400",
        inicio,
        termino,
      }),
    });

    expect(primeira.status).toBe(200);

    // Encosta em um dos dias da primeira ordem, então tem que barrar
    const conflito = await chamar(criarOrdem, {
      method: "POST",
      path: "/api/osProducao",
      token: await tokenDe(EMAILS.gerente),
      body: corpoOrdem({
        codigo: "OP-2026-401",
        inicio: diaBrasilia(301),
        termino: diaBrasilia(303),
      }),
    });

    expect(conflito.status).toBe(409);
    expect(conflito.body.message).toMatch(/uma atividade por dia/i);
    expect(conflito.body.message).toMatch(/OP-2026-400/);

    expect(
      await contar(
        "SELECT COUNT(*) FROM ordensproducao WHERE codigo IN ('OP-2026-400', 'OP-2026-401')",
      ),
    ).toBe(1);
  });

  it("RN13 - operador com especialização incompatível nem entra na agenda", async () => {
    const resposta = await chamar(criarOrdem, {
      method: "POST",
      path: "/api/osProducao",
      token: await tokenDe(EMAILS.gerente),
      body: corpoOrdem({
        codigo: "OP-2026-402",
        operadorID: 1,
        especializacao: "Montagem",
        inicio: diaBrasilia(310),
        termino: diaBrasilia(311),
      }),
    });

    expect(resposta.status).toBe(400);
    expect(resposta.body.message).toMatch(/especialização exigida/i);
  });

  it("RN15 - bloqueia manutenções sobrepostas do mesmo mecânico", async () => {
    const inicio = `${diaBrasilia(320)} 08:00:00`;

    const primeira = await chamar(criarManutencao, {
      method: "POST",
      path: "/api/manutencoesProgramadas",
      token: await tokenDe(EMAILS.gerente),
      body: corpoManutencao({
        descricao: "Revisão da manhã",
        inicio,
        termino: somarMinutos(inicio, 240),
      }),
    });

    expect(primeira.status).toBe(200);

    // Começa antes da primeira terminar, sobreposição clássica
    const sobreposta = await chamar(criarManutencao, {
      method: "POST",
      path: "/api/manutencoesProgramadas",
      token: await tokenDe(EMAILS.gerente),
      body: corpoManutencao({
        descricao: "Revisão invasora",
        inicio: somarMinutos(inicio, 180),
        termino: somarMinutos(inicio, 300),
      }),
    });

    expect(sobreposta.status).toBe(409);
    expect(sobreposta.body.message).toMatch(/outro horário/i);

    const encostada = await chamar(criarManutencao, {
      method: "POST",
      path: "/api/manutencoesProgramadas",
      token: await tokenDe(EMAILS.gerente),
      body: corpoManutencao({
        descricao: "Revisão da tarde",
        inicio: somarMinutos(inicio, 240),
        termino: somarMinutos(inicio, 480),
      }),
    });

    expect(encostada.status).toBe(200);
  });

  it("RNF05 - duas confirmações simultâneas no mesmo dia não passam juntas", async () => {
    const inicio = diaBrasilia(340);
    const token = await tokenDe(EMAILS.gerente);

    const corpo = (codigo) =>
      corpoOrdem({
        codigo,
        inicio,
        termino: diaBrasilia(341),
      });

    const [primeira, segunda] = await Promise.all([
      chamar(criarOrdem, {
        method: "POST",
        path: "/api/osProducao",
        token,
        body: corpo("OP-2026-410"),
      }),
      chamar(criarOrdem, {
        method: "POST",
        path: "/api/osProducao",
        token,
        body: corpo("OP-2026-411"),
      }),
    ]);

    expect([primeira.status, segunda.status].sort()).toEqual([200, 409]);
    expect(
      await contar(
        "SELECT COUNT(*) FROM ordensproducao WHERE codigo IN ('OP-2026-410', 'OP-2026-411')",
      ),
    ).toBe(1);
  });

  it("RN17 - reprogramar libera o período anterior e registra auditoria", async () => {
    const ordemID = await criarOrdemValida(
      "OP-2026-420",
      diaBrasilia(360),
      diaBrasilia(361),
    );

    const reprogramacao = await chamar(reprogramarOrdem, {
      method: "PATCH",
      path: `/api/osProducao/${ordemID}`,
      params: { id: String(ordemID) },
      token: await tokenDe(EMAILS.gerente),
      body: {
        inicioPlanejado: diaBrasilia(370),
        terminoPlanejado: diaBrasilia(371),
      },
    });

    expect(reprogramacao.status).toBe(200);

    const ordem = await um(
      `SELECT inicioplanejado::text AS inicio, terminoplanejado::text AS termino
         FROM ordensproducao
        WHERE pk_ordemid = $1`,
      [ordemID],
    );

    expect(ordem).toMatchObject({
      inicio: diaBrasilia(370),
      termino: diaBrasilia(371),
    });

    const reuso = await chamar(criarOrdem, {
      method: "POST",
      path: "/api/osProducao",
      token: await tokenDe(EMAILS.gerente),
      body: corpoOrdem({
        codigo: "OP-2026-421",
        inicio: diaBrasilia(360),
        termino: diaBrasilia(361),
      }),
    });

    expect(reuso.status).toBe(200);

    expect(
      await contar(
        `SELECT COUNT(*) FROM auditoria
          WHERE entidade = 'ordem' AND entidadeid = $1 AND acao = 'reprogramacao'`,
        [ordemID],
      ),
    ).toBe(1);
  });

  it("RN17 - cancelar libera a agenda e preserva o histórico", async () => {
    const ordemID = await criarOrdemValida(
      "OP-2026-430",
      diaBrasilia(380),
      diaBrasilia(381),
    );

    const conflitoAntes = await chamar(criarOrdem, {
      method: "POST",
      path: "/api/osProducao",
      token: await tokenDe(EMAILS.gerente),
      body: corpoOrdem({
        codigo: "OP-2026-431",
        inicio: diaBrasilia(380),
        termino: diaBrasilia(381),
      }),
    });

    expect(conflitoAntes.status).toBe(409);

    const cancelamento = await chamar(mudarStatusOrdem, {
      method: "PUT",
      path: `/api/osProducao/${ordemID}`,
      params: { id: String(ordemID) },
      token: await tokenDe(EMAILS.gerente),
      body: { status: "Cancelada", observacao: "Cliente desistiu" },
    });

    expect(cancelamento.status).toBe(200);

    const depois = await chamar(criarOrdem, {
      method: "POST",
      path: "/api/osProducao",
      token: await tokenDe(EMAILS.gerente),
      body: corpoOrdem({
        codigo: "OP-2026-432",
        inicio: diaBrasilia(380),
        termino: diaBrasilia(381),
      }),
    });

    expect(depois.status).toBe(200);

    const ordem = await um(
      "SELECT status FROM ordensproducao WHERE pk_ordemid = $1",
      [ordemID],
    );

    expect(ordem.status).toBe("Cancelada");

    const historico = await um(
      `SELECT statusanterior, statusnovo, observacao
         FROM historicoordens
        WHERE fk_ordemid = $1
        ORDER BY pk_historicoid DESC
        LIMIT 1`,
      [ordemID],
    );

    expect(historico).toMatchObject({
      statusanterior: "Pendente",
      statusnovo: "Cancelada",
      observacao: "Cliente desistiu",
    });
  });

  it("RN19 - ordem atrasada continua ocupando a agenda até concluir", async () => {
    const inicio = diaBrasilia(-300);
    const termino = diaBrasilia(-299);

    const atrasada = await chamar(criarOrdem, {
      method: "POST",
      path: "/api/osProducao",
      token: await tokenDe(EMAILS.gerente),
      body: corpoOrdem({
        codigo: "OP-2026-440",
        operadorID: 2,
        especializacao: "Montagem",
        inicio,
        termino,
      }),
    });

    expect(atrasada.status).toBe(200);

    const conflito = await chamar(criarOrdem, {
      method: "POST",
      path: "/api/osProducao",
      token: await tokenDe(EMAILS.gerente),
      body: corpoOrdem({
        codigo: "OP-2026-441",
        operadorID: 2,
        especializacao: "Montagem",
        inicio,
        termino,
      }),
    });

    expect(conflito.status).toBe(409);

    const { body } = await chamar(listarOrdens, {
      token: await tokenDe(EMAILS.gerente),
      path: "/api/osProducao",
    });

    const ordem = body.data.find((item) => item.codigo === "OP-2026-440");

    expect(ordem.status).toBe("Pendente");
    expect(ordem.atrasada).toBe(true);
  });

  it("RN09 - não desativa profissional com ordem ou manutenção aberta", async () => {
    const token = await tokenDe(EMAILS.gerente);

    // Serjão tem a manutenção 7 Programada no seed
    const mecanico = await chamar(desativarProfissional, {
      method: "DELETE",
      path: "/api/profissionais/3",
      params: { id: "3" },
      token,
    });

    expect(mecanico.status).toBe(409);
    expect(mecanico.body.message).toMatch(/manutenção.*aberta/i);

    await criarOrdemValida(
      "OP-2026-450",
      diaBrasilia(400),
      diaBrasilia(401),
    );

    // Irinel ganhou uma ordem Pendente, então também não pode sair
    const operador = await chamar(desativarProfissional, {
      method: "DELETE",
      path: "/api/profissionais/1",
      params: { id: "1" },
      token,
    });

    expect(operador.status).toBe(409);
    expect(operador.body.message).toMatch(/ordem.*aberta/i);

    const irinel = await um(
      "SELECT status FROM profissionais WHERE pk_profissionalid = 1",
    );

    expect(irinel.status).toBe("Ativo");
  });

  it.skip("valida jornada e afastamento do profissional (RN13) - fora do escopo atual", () => {});
});

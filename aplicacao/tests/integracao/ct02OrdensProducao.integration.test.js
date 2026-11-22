import { beforeAll, describe, expect, it } from "vitest";

import {
  POST as criarOrdem,
  GET as listarOrdens,
} from "../../app/api/osProducao/route";
import { PUT as mudarStatusOrdem } from "../../app/api/osProducao/[id]/route";
import { diaBrasilia } from "../apoio/datas";
import { chamar, tokenDe } from "./apoio/api";
import { consultar, um } from "./apoio/banco";
import {
  EMAILS,
  contar,
  criarProfissionalTeste,
  criarUsuarioTeste,
} from "./apoio/dados";

// CT02 - Cada operador de teste é isolado pra ninguém disputar agenda com o seed
const operadores = {};

let sequenciaTelefone = 9000;

async function criarOperadorTeste(nome, email) {
  const usuario = await criarUsuarioTeste({
    nome,
    email,
    cargo: "operador",
  });

  sequenciaTelefone += 1;

  const profissional = await criarProfissionalTeste({
    usuarioID: usuario.id,
    ehOperador: 1,
    ehMecanico: 0,
    especializacao: "Usinagem",
    telefone: `1199999${sequenciaTelefone}`,
  });

  return {
    usuarioID: usuario.id,
    profissionalID: profissional.id,
    email,
    token: await tokenDe(email),
  };
}

beforeAll(async () => {
  operadores.criacao = await criarOperadorTeste(
    "Operador Criação",
    "op.criacao@meteor.com",
  );
  operadores.inicio = await criarOperadorTeste(
    "Operador Início",
    "op.inicio@meteor.com",
  );
  operadores.conclusao = await criarOperadorTeste(
    "Operador Conclusão",
    "op.conclusao@meteor.com",
  );
  operadores.concorrencia = await criarOperadorTeste(
    "Operador Concorrência",
    "op.concorrencia@meteor.com",
  );
  operadores.rollback = await criarOperadorTeste(
    "Operador Rollback",
    "op.rollback@meteor.com",
  );
});

function corpoOrdem({
  codigo,
  operadorID,
  inicio,
  termino,
  materiais = [{ materiaID: 1, quantidadePrevista: 1 }],
  quantidadePlanejada = 5,
  pecaID = 1,
  especializacao = "Usinagem",
}) {
  return {
    codigo,
    pecaID,
    quantidadePlanejada,
    especializacao,
    operadorID,
    inicioPlanejado: inicio,
    terminoPlanejado: termino,
    materiais,
  };
}

async function criarOrdemValida(operador, codigo, inicio, termino, extras = {}) {
  const resposta = await chamar(criarOrdem, {
    method: "POST",
    path: "/api/osProducao",
    token: await tokenDe(EMAILS.gerente),
    body: corpoOrdem({
      codigo,
      operadorID: operador.profissionalID,
      inicio,
      termino,
      ...extras,
    }),
  });

  expect(resposta.status).toBe(200);

  return resposta.body.id;
}

async function iniciarOrdem(operador, ordemID) {
  const resposta = await chamar(mudarStatusOrdem, {
    method: "PUT",
    path: `/api/osProducao/${ordemID}`,
    params: { id: String(ordemID) },
    body: { status: "Em Produção" },
    token: operador.token,
  });

  expect(resposta.status).toBe(200);

  return resposta;
}

function corpoConclusao(materiaID = 1, quantidade = 5) {
  return {
    status: "Concluída",
    producao: {
      quantidadeProduzida: 10,
      aprovadas: 8,
      rejeitadas: 2,
      observacoes: "Lote do teste",
    },
    rejeicoes: [
      {
        quantidade: 2,
        motivoRejeicao: "Trinca",
        tipo: "Perda",
        acoesCorretivas: "Ajuste da ferramenta",
      },
    ],
    consumo: [{ materiaID, quantidade }],
  };
}

async function concluirOrdem(operador, ordemID, corpo = corpoConclusao()) {
  return chamar(mudarStatusOrdem, {
    method: "PUT",
    path: `/api/osProducao/${ordemID}`,
    params: { id: String(ordemID) },
    body: corpo,
    token: operador.token,
  });
}

describe("CT02 - ordens de produção", () => {
  it("RN05/RF05 - bloqueia código de ordem duplicado", async () => {
    const resposta = await chamar(criarOrdem, {
      method: "POST",
      path: "/api/osProducao",
      token: operadores.criacao.token,
      body: corpoOrdem({
        codigo: "OP-2026-001",
        operadorID: operadores.criacao.profissionalID,
        inicio: diaBrasilia(10),
        termino: diaBrasilia(11),
      }),
    });

    // A rota de criação é do gestor, então o token de operador nem chega no código
    expect(resposta.status).toBe(403);

    const comoGestor = await chamar(criarOrdem, {
      method: "POST",
      path: "/api/osProducao",
      token: await tokenDe(EMAILS.gerente),
      body: corpoOrdem({
        codigo: "OP-2026-001",
        operadorID: operadores.criacao.profissionalID,
        inicio: diaBrasilia(10),
        termino: diaBrasilia(11),
      }),
    });

    expect(comoGestor.status).toBe(409);
    expect(comoGestor.body.message).toMatch(/código/);
  });

  it("RN04 - bloqueia ordem com saldo insuficiente", async () => {
    const resposta = await chamar(criarOrdem, {
      method: "POST",
      path: "/api/osProducao",
      token: await tokenDe(EMAILS.gerente),
      body: corpoOrdem({
        codigo: "OP-2026-200",
        operadorID: operadores.criacao.profissionalID,
        inicio: diaBrasilia(20),
        termino: diaBrasilia(21),
        materiais: [{ materiaID: 2, quantidadePrevista: 999999 }],
      }),
    });

    expect(resposta.status).toBe(400);
    expect(resposta.body.message).toMatch(/saldo insuficiente/i);
  });

  it("RN04/RF05 - grava a ordem e o material planejado na mesma transação", async () => {
    const ordemID = await criarOrdemValida(
      operadores.criacao,
      "OP-2026-201",
      diaBrasilia(30),
      diaBrasilia(31),
      { materiais: [{ materiaID: 1, quantidadePrevista: 12.5 }] },
    );

    const ordem = await um(
      `SELECT codigo, status, quantidadeplanejada
         FROM ordensproducao
        WHERE pk_ordemid = $1`,
      [ordemID],
    );

    expect(ordem).toMatchObject({
      codigo: "OP-2026-201",
      status: "Pendente",
      quantidadeplanejada: 5,
    });

    const material = await um(
      `SELECT quantidadeprevista::text AS quantidade
         FROM ordemmateriais
        WHERE fk_ordemid = $1 AND fk_materiaid = 1`,
      [ordemID],
    );

    expect(Number(material.quantidade)).toBe(12.5);

    expect(
      await contar(
        `SELECT COUNT(*) FROM auditoria
          WHERE entidade = 'ordem' AND entidadeid = $1 AND acao = 'criacao'`,
        [ordemID],
      ),
    ).toBe(1);
  });

  it("RN03/RN04 - material inativo não entra em ordem nova", async () => {
    await consultar(
      "UPDATE materiasprimas SET status = 'Desativado' WHERE pk_materiaid = 4",
    );

    const resposta = await chamar(criarOrdem, {
      method: "POST",
      path: "/api/osProducao",
      token: await tokenDe(EMAILS.gerente),
      body: corpoOrdem({
        codigo: "OP-2026-202",
        operadorID: operadores.criacao.profissionalID,
        inicio: diaBrasilia(40),
        termino: diaBrasilia(41),
        materiais: [{ materiaID: 4, quantidadePrevista: 1 }],
      }),
    });

    expect(resposta.status).toBe(400);
    expect(resposta.body.message).toMatch(/inativa/);
  });

  it("RN19 - inicia a ordem, carimba o horário efetivo e grava histórico/auditoria", async () => {
    const ordemID = await criarOrdemValida(
      operadores.inicio,
      "OP-2026-210",
      diaBrasilia(0),
      diaBrasilia(0),
      { materiais: [{ materiaID: 1, quantidadePrevista: 2 }] },
    );

    await iniciarOrdem(operadores.inicio, ordemID);

    const ordem = await um(
      `SELECT status, inicioefetivo
         FROM ordensproducao
        WHERE pk_ordemid = $1`,
      [ordemID],
    );

    expect(ordem.status).toBe("Em Produção");
    expect(ordem.inicioefetivo).toBeTruthy();

    const historico = await um(
      `SELECT statusanterior, statusnovo, fk_usuarioid
         FROM historicoordens
        WHERE fk_ordemid = $1
        ORDER BY pk_historicoid DESC
        LIMIT 1`,
      [ordemID],
    );

    expect(historico).toMatchObject({
      statusanterior: "Pendente",
      statusnovo: "Em Produção",
      fk_usuarioid: operadores.inicio.usuarioID,
    });

    expect(
      await contar(
        `SELECT COUNT(*) FROM auditoria
          WHERE entidade = 'ordem' AND entidadeid = $1 AND acao = 'mudancaStatus'`,
        [ordemID],
      ),
    ).toBe(1);

    // Conclui no fim pra não deixar execução aberta ocupando a agenda
    const conclusao = await concluirOrdem(operadores.inicio, ordemID, {
      status: "Concluída",
      producao: { quantidadeProduzida: 2, aprovadas: 2, rejeitadas: 0 },
      consumo: [{ materiaID: 1, quantidade: 2 }],
    });

    expect(conclusao.status).toBe(200);
  });

  it("RNF01 - bloqueia início por outro operador e transição inválida", async () => {
    const ordemID = await criarOrdemValida(
      operadores.criacao,
      "OP-2026-211",
      diaBrasilia(50),
      diaBrasilia(51),
    );

    const outroOperador = await chamar(mudarStatusOrdem, {
      method: "PUT",
      path: `/api/osProducao/${ordemID}`,
      params: { id: String(ordemID) },
      body: { status: "Em Produção" },
      token: operadores.inicio.token,
    });

    expect(outroOperador.status).toBe(403);
    expect(outroOperador.body.message).toMatch(/não está atribuída/i);

    const transicaoInvalida = await chamar(mudarStatusOrdem, {
      method: "PUT",
      path: `/api/osProducao/${ordemID}`,
      params: { id: String(ordemID) },
      body: { status: "Concluída" },
      token: await tokenDe(EMAILS.gerente),
    });

    expect(transicaoInvalida.status).toBe(400);
    expect(transicaoInvalida.body.message).toMatch(/não é possível mudar/i);

    // Ordem concluída do seed não reabre
    const reabrir = await chamar(mudarStatusOrdem, {
      method: "PUT",
      path: "/api/osProducao/1",
      params: { id: "1" },
      body: { status: "Em Produção" },
      token: await tokenDe(EMAILS.gerente),
    });

    expect(reabrir.status).toBe(400);
  });

  it("RN06/RN07 - cancela ordem pendente e não deixa iniciar a cancelada", async () => {
    const ordemID = await criarOrdemValida(
      operadores.criacao,
      "OP-2026-212",
      diaBrasilia(60),
      diaBrasilia(61),
    );

    const cancelamento = await chamar(mudarStatusOrdem, {
      method: "PUT",
      path: `/api/osProducao/${ordemID}`,
      params: { id: String(ordemID) },
      body: { status: "Cancelada", observacao: "Falta de material" },
      token: await tokenDe(EMAILS.gerente),
    });

    expect(cancelamento.status).toBe(200);

    const ordem = await um(
      "SELECT status FROM ordensproducao WHERE pk_ordemid = $1",
      [ordemID],
    );

    expect(ordem.status).toBe("Cancelada");

    const inicio = await chamar(mudarStatusOrdem, {
      method: "PUT",
      path: `/api/osProducao/${ordemID}`,
      params: { id: String(ordemID) },
      body: { status: "Em Produção" },
      token: operadores.criacao.token,
    });

    expect(inicio.status).toBe(400);
  });

  it("RN18/RNF05 - conclusão grava qualidade, consumo e baixa única de estoque", async () => {
    const ordemID = await criarOrdemValida(
      operadores.conclusao,
      "OP-2026-220",
      diaBrasilia(0),
      diaBrasilia(0),
      { materiais: [{ materiaID: 1, quantidadePrevista: 5 }] },
    );

    await iniciarOrdem(operadores.conclusao, ordemID);

    const estoqueAntes = await um(
      "SELECT quantidadeestoque::text AS saldo FROM materiasprimas WHERE pk_materiaid = 1",
    );

    const conclusao = await concluirOrdem(operadores.conclusao, ordemID);

    expect(conclusao.status).toBe(200);

    const ordem = await um(
      `SELECT status, inicioefetivo, conclusaoefetiva
         FROM ordensproducao
        WHERE pk_ordemid = $1`,
      [ordemID],
    );

    expect(ordem.status).toBe("Concluída");
    expect(ordem.inicioefetivo).toBeTruthy();
    expect(ordem.conclusaoefetiva).toBeTruthy();

    const producao = await um(
      `SELECT quantidadeproduzida
         FROM historicoproducao
        WHERE fk_ordemid = $1`,
      [ordemID],
    );

    expect(producao.quantidadeproduzida).toBe(10);

    const inspecao = await um(
      `SELECT totalproduzido, aprovadas, rejeitadas
         FROM inspecoes
        WHERE fk_ordemid = $1`,
      [ordemID],
    );

    expect(inspecao).toMatchObject({
      totalproduzido: 10,
      aprovadas: 8,
      rejeitadas: 2,
    });

    expect(
      await contar(
        `SELECT COUNT(*) FROM rejeicoes
          WHERE fk_inspecaoID = (SELECT pk_inspecaoid FROM inspecoes WHERE fk_ordemid = $1)`,
        [ordemID],
      ),
    ).toBe(1);

    const consumo = await um(
      `SELECT quantidadeconsumida::text AS quantidade
         FROM ordemmateriais
        WHERE fk_ordemid = $1 AND fk_materiaid = 1`,
      [ordemID],
    );

    expect(Number(consumo.quantidade)).toBe(5);

    const estoqueDepois = await um(
      "SELECT quantidadeestoque::text AS saldo FROM materiasprimas WHERE pk_materiaid = 1",
    );

    expect(Number(estoqueDepois.saldo)).toBe(Number(estoqueAntes.saldo) - 5);

    const movimentos = await consultar(
      `SELECT pk_movimentacaoid, tipo, quantidade::text AS quantidade, fk_usuarioid
         FROM movimentacoesestoque
        WHERE fk_ordemid = $1 AND fk_materiaid = 1`,
      [ordemID],
    );

    expect(movimentos).toHaveLength(1);
    expect(movimentos[0]).toMatchObject({
      tipo: "Saida",
      quantidade: "5.000",
      fk_usuarioid: operadores.conclusao.usuarioID,
    });

    expect(
      await contar(
        `SELECT COUNT(*) FROM auditoria
          WHERE entidade = 'estoque' AND acao = 'saidaAutomatica'
            AND entidadeid = $1`,
        [movimentos[0].pk_movimentacaoid],
      ),
    ).toBe(1);

    // Conclusão repetida não duplica nada
    const repetida = await concluirOrdem(operadores.conclusao, ordemID);

    expect(repetida.status).toBe(200);

    expect(
      await contar(
        "SELECT COUNT(*) FROM movimentacoesestoque WHERE fk_ordemid = $1",
        [ordemID],
      ),
    ).toBe(1);
    expect(
      await contar("SELECT COUNT(*) FROM historicoproducao WHERE fk_ordemid = $1", [
        ordemID,
      ]),
    ).toBe(1);
    expect(
      await contar("SELECT COUNT(*) FROM inspecoes WHERE fk_ordemid = $1", [
        ordemID,
      ]),
    ).toBe(1);

    const estoqueFinal = await um(
      "SELECT quantidadeestoque::text AS saldo FROM materiasprimas WHERE pk_materiaid = 1",
    );

    expect(Number(estoqueFinal.saldo)).toBe(Number(estoqueDepois.saldo));
  });

  it("RNF05 - duas conclusões simultâneas não duplicam a baixa", async () => {
    const ordemID = await criarOrdemValida(
      operadores.concorrencia,
      "OP-2026-221",
      diaBrasilia(0),
      diaBrasilia(0),
      { materiais: [{ materiaID: 2, quantidadePrevista: 3 }] },
    );

    await iniciarOrdem(operadores.concorrencia, ordemID);

    const [primeira, segunda] = await Promise.all([
      concluirOrdem(operadores.concorrencia, ordemID, corpoConclusao(2, 3)),
      concluirOrdem(operadores.concorrencia, ordemID, corpoConclusao(2, 3)),
    ]);

    expect([primeira.status, segunda.status].sort()).toEqual([200, 200]);

    expect(
      await contar(
        "SELECT COUNT(*) FROM movimentacoesestoque WHERE fk_ordemid = $1",
        [ordemID],
      ),
    ).toBe(1);
    expect(
      await contar("SELECT COUNT(*) FROM historicoproducao WHERE fk_ordemid = $1", [
        ordemID,
      ]),
    ).toBe(1);
    expect(
      await contar("SELECT COUNT(*) FROM inspecoes WHERE fk_ordemid = $1", [
        ordemID,
      ]),
    ).toBe(1);
  });

  it("RNF05 - falha no meio da conclusão desfaz estado, consumo e baixa", async () => {
    const ordemID = await criarOrdemValida(
      operadores.rollback,
      "OP-2026-222",
      diaBrasilia(0),
      diaBrasilia(0),
      { materiais: [{ materiaID: 1, quantidadePrevista: 2 }] },
    );

    await iniciarOrdem(operadores.rollback, ordemID);

    const estoqueAntes = await um(
      "SELECT quantidadeestoque::text AS saldo FROM materiasprimas WHERE pk_materiaid = 1",
    );

    // Força o INSERT da inspeção a estourar depois da baixa de estoque
    await consultar(`
      CREATE OR REPLACE FUNCTION teste_falha_inspecao() RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'falha proposital do teste';
      END;
      $$ LANGUAGE plpgsql
    `);
    await consultar(`
      CREATE TRIGGER teste_falha_inspecao
      BEFORE INSERT ON inspecoes
      FOR EACH ROW EXECUTE FUNCTION teste_falha_inspecao()
    `);

    try {
      const conclusao = await concluirOrdem(
        operadores.rollback,
        ordemID,
        corpoConclusao(1, 2),
      );

      expect(conclusao.status).toBe(500);
    } finally {
      await consultar("DROP TRIGGER IF EXISTS teste_falha_inspecao ON inspecoes");
      await consultar("DROP FUNCTION IF EXISTS teste_falha_inspecao()");
    }

    const ordem = await um(
      "SELECT status FROM ordensproducao WHERE pk_ordemid = $1",
      [ordemID],
    );

    expect(ordem.status).toBe("Em Produção");

    const estoqueDepois = await um(
      "SELECT quantidadeestoque::text AS saldo FROM materiasprimas WHERE pk_materiaid = 1",
    );

    expect(Number(estoqueDepois.saldo)).toBe(Number(estoqueAntes.saldo));

    expect(
      await contar(
        "SELECT COUNT(*) FROM movimentacoesestoque WHERE fk_ordemid = $1",
        [ordemID],
      ),
    ).toBe(0);
    expect(
      await contar("SELECT COUNT(*) FROM historicoproducao WHERE fk_ordemid = $1", [
        ordemID,
      ]),
    ).toBe(0);
    expect(
      await contar("SELECT COUNT(*) FROM inspecoes WHERE fk_ordemid = $1", [
        ordemID,
      ]),
    ).toBe(0);
  });

  it("RF05 - operador só enxerga as ordens atribuídas a ele", async () => {
    const { status, body } = await chamar(listarOrdens, {
      token: operadores.criacao.token,
      path: "/api/osProducao",
    });

    expect(status).toBe(200);
    expect(body.data.length).toBeGreaterThan(0);

    for (const ordem of body.data) {
      expect(ordem.fk_operadorID).toBe(operadores.criacao.profissionalID);
    }
  });
});

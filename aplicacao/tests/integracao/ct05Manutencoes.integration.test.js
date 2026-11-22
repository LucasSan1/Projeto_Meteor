import { beforeAll, describe, expect, it } from "vitest";

import {
  POST as criarManutencao,
  GET as listarManutencoes,
} from "../../app/api/manutencoesProgramadas/route";
import {
  DELETE as cancelarManutencao,
  PUT as mudarStatusManutencao,
} from "../../app/api/manutencoesProgramadas/[id]/route";
import { diaBrasilia, horaBrasilia } from "../apoio/datas";
import { chamar, tokenDe } from "./apoio/api";
import { consultar, um } from "./apoio/banco";
import {
  EMAILS,
  contar,
  criarProfissionalTeste,
  criarUsuarioTeste,
  somarMinutos,
} from "./apoio/dados";

// Mecânicos novos pra não brigar com as manutenções do seed
const mecanicos = {};

let sequenciaTelefone = 8000;

async function criarMecanicoTeste(nome, email) {
  const usuario = await criarUsuarioTeste({
    nome,
    email,
    cargo: "mecanico",
  });

  sequenciaTelefone += 1;

  const profissional = await criarProfissionalTeste({
    usuarioID: usuario.id,
    ehOperador: 0,
    ehMecanico: 1,
    especializacao: "Elétrica",
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
  mecanicos.repeticao = await criarMecanicoTeste(
    "Mecânico Repetição",
    "mec.repeticao@meteor.com",
  );
  mecanicos.rollback = await criarMecanicoTeste(
    "Mecânico Rollback",
    "mec.rollback@meteor.com",
  );
});

function corpoManutencao({
  descricao,
  mecanico = 4,
  especializacao = "Elétrica",
  inicio,
  termino,
}) {
  return {
    equipamento: 1,
    maquina: 1,
    tipoManutencao: "Preventiva",
    descricao,
    especializacao,
    mecanico,
    inicioPrevisto: inicio,
    terminoPrevisto: termino,
  };
}

async function agendar(corpo) {
  const resposta = await chamar(criarManutencao, {
    method: "POST",
    path: "/api/manutencoesProgramadas",
    token: await tokenDe(EMAILS.gerente),
    body: corpo,
  });

  expect(resposta.status).toBe(200);

  return resposta.body.id;
}

async function mudarStatus(id, corpo, email = EMAILS.galo) {
  return chamar(mudarStatusManutencao, {
    method: "PUT",
    path: `/api/manutencoesProgramadas/${id}`,
    params: { id: String(id) },
    token: await tokenDe(email),
    body: corpo,
  });
}

// Manutenção de hoje, a janela fica aberta pra permitir iniciar e concluir
function janelaDeHoje() {
  return {
    inicio: horaBrasilia(0),
    termino: somarMinutos(horaBrasilia(0), 24 * 60),
  };
}

// CT05 - Agendamento, execução e conclusão reais, com custos, histórico único e rollback
describe("CT05 - manutenções", () => {
  it("RF08 - agenda manutenção para mecânico apto e livre", async () => {
    const inicio = `${diaBrasilia(500)} 08:00:00`;

    const id = await agendar(
      corpoManutencao({
        descricao: "Alinhamento do eixo",
        inicio,
        termino: somarMinutos(inicio, 240),
      }),
    );

    const manutencao = await um(
      `SELECT fk_mecanicoid, especializacao, status,
              inicioprevisto::text AS inicio, terminoprevisto::text AS termino
         FROM manutencoesprogramadas
        WHERE pk_manutencaoid = $1`,
      [id],
    );

    expect(manutencao).toMatchObject({
      fk_mecanicoid: 4,
      especializacao: "Elétrica",
      status: "Programada",
    });

    expect(
      await contar(
        `SELECT COUNT(*) FROM auditoria
          WHERE entidade = 'manutencao' AND entidadeid = $1 AND acao = 'agendamento'`,
        [id],
      ),
    ).toBe(1);

    // Mecânico sem a especialização exigida não entra nem no teste
    const semAptidao = await chamar(criarManutencao, {
      method: "POST",
      path: "/api/manutencoesProgramadas",
      token: await tokenDe(EMAILS.gerente),
      body: {
        ...corpoManutencao({
          descricao: "Serviço sem aptidão",
          mecanico: 3,
          especializacao: "Elétrica",
          inicio: `${diaBrasilia(501)} 08:00:00`,
          termino: `${diaBrasilia(501)} 12:00:00`,
        }),
      },
    });

    expect(semAptidao.status).toBe(400);
    expect(semAptidao.body.message).toMatch(/especialização exigida/i);
  });

  it("RN19/RN17 - só o mecânico atribuído inicia e conclui, gravando serviço e custo", async () => {
    const janela = janelaDeHoje();

    const id = await agendar(
      corpoManutencao({
        descricao: "Troca de escovas do motor",
        ...janela,
      }),
    );

    // Serjão é mecânico, mas não é o responsável por essa manutenção
    const terceiro = await mudarStatus(
      id,
      { status: "Em Execução", observacoes: "Tentando invadir" },
      EMAILS.serjao,
    );

    expect(terceiro.status).toBe(403);
    expect(terceiro.body.message).toMatch(/não está atribuída/i);

    const inicio = await mudarStatus(id, { status: "Em Execução" });

    expect(inicio.status).toBe(200);

    const emExecucao = await um(
      "SELECT status, inicioefetivo FROM manutencoesprogramadas WHERE pk_manutencaoid = $1",
      [id],
    );

    expect(emExecucao.status).toBe("Em Execução");
    expect(emExecucao.inicioefetivo).toBeTruthy();

    const conclusao = await mudarStatus(id, {
      status: "Concluída",
      servicosRealizados: "Escovas substituídas e motor testado",
      custos: 150.5,
      observacoes: "Serviço concluído no prazo",
    });

    expect(conclusao.status).toBe(200);

    const concluida = await um(
      `SELECT status, inicioefetivo, conclusaoefetiva
         FROM manutencoesprogramadas
        WHERE pk_manutencaoid = $1`,
      [id],
    );

    expect(concluida.status).toBe("Concluída");
    expect(concluida.inicioefetivo).toBeTruthy();
    expect(concluida.conclusaoefetiva).toBeTruthy();

    const historico = await um(
      `SELECT manutencaorealizada, datamanutencao::text AS dia,
              custos::text AS custos, observacoes
         FROM historicomanutencao
        WHERE fk_manutencaoid = $1`,
      [id],
    );

    expect(historico).toMatchObject({
      manutencaorealizada: "Preventiva",
      dia: diaBrasilia(0),
      observacoes: "Serviço concluído no prazo",
    });
    expect(Number(historico.custos)).toBe(150.5);

    expect(
      await contar(
        `SELECT COUNT(*) FROM auditoria
          WHERE entidade = 'manutencao' AND entidadeid = $1 AND acao = 'mudancaStatus'`,
        [id],
      ),
    ).toBe(2);
  });

  it("RN19 - não inicia manutenção com janela já vencida", async () => {

    const resposta = await mudarStatus(
      7,
      { status: "Em Execução" },
      EMAILS.serjao,
    );

    expect(resposta.status).toBe(400);
    expect(resposta.body.message).toMatch(/período previsto.*terminou/i);

    const manutencao = await um(
      "SELECT status FROM manutencoesprogramadas WHERE pk_manutencaoid = 7",
    );

    expect(manutencao.status).toBe("Programada");
  });

  it("RN12 - bloqueia custo negativo antes de mexer no status", async () => {
    const resposta = await mudarStatus(
      7,
      {
        status: "Concluída",
        servicosRealizados: "Tentativa com custo inválido",
        custos: -10,
      },
      EMAILS.serjao,
    );

    expect(resposta.status).toBe(400);
    expect(resposta.body.message).toMatch(/custos não podem ser negativos/i);

    const manutencao = await um(
      "SELECT status FROM manutencoesprogramadas WHERE pk_manutencaoid = 7",
    );

    expect(manutencao.status).toBe("Programada");
  });

  it("RN17 - não conclui sem passar por Em Execução", async () => {
    const resposta = await mudarStatus(
      7,
      {
        status: "Concluída",
        servicosRealizados: "Pulando etapa",
        custos: 0,
      },
      EMAILS.serjao,
    );

    expect(resposta.status).toBe(400);
    expect(resposta.body.message).toMatch(/não é possível mudar/i);
  });

  it("RN17 - não cancela manutenção em execução", async () => {
    const resposta = await chamar(cancelarManutencao, {
      method: "DELETE",
      path: "/api/manutencoesProgramadas/6",
      params: { id: "6" },
      token: await tokenDe(EMAILS.gerente),
    });

    expect(resposta.status).toBe(400);
    expect(resposta.body.message).toMatch(/status programada/i);

    const manutencao = await um(
      "SELECT status FROM manutencoesprogramadas WHERE pk_manutencaoid = 6",
    );

    expect(manutencao.status).toBe("Em Execução");
  });

  it("RN15 - bloqueia período já ocupado pelo mesmo mecânico", async () => {
    const resposta = await chamar(criarManutencao, {
      method: "POST",
      path: "/api/manutencoesProgramadas",
      token: await tokenDe(EMAILS.gerente),
      body: corpoManutencao({
        descricao: "Intrusa na agenda alheia",
        mecanico: 3,
        especializacao: "Mecânica",
        inicio: "2026-11-10 09:00:00",
        termino: "2026-11-10 11:00:00",
      }),
    });

    expect(resposta.status).toBe(409);
    expect(resposta.body.message).toMatch(/outro horário/i);
  });

  it("RN19 - conclusão repetida não duplica histórico", async () => {
    const janela = janelaDeHoje();

    const id = await agendar(
      corpoManutencao({
        descricao: "Ajuste do painel",
        mecanico: mecanicos.repeticao.profissionalID,
        ...janela,
      }),
    );

    await mudarStatus(
      id,
      { status: "Em Execução" },
      mecanicos.repeticao.email,
    );

    const corpo = {
      status: "Concluída",
      servicosRealizados: "Painel reapertado",
      custos: 42,
    };

    expect(
      (await mudarStatus(id, corpo, mecanicos.repeticao.email)).status,
    ).toBe(200);
    expect(
      (await mudarStatus(id, corpo, mecanicos.repeticao.email)).status,
    ).toBe(200);

    expect(
      await contar(
        "SELECT COUNT(*) FROM historicomanutencao WHERE fk_manutencaoid = $1",
        [id],
      ),
    ).toBe(1);

    expect(
      await contar(
        `SELECT COUNT(*) FROM auditoria
          WHERE entidade = 'manutencao' AND entidadeid = $1 AND acao = 'mudancaStatus'`,
        [id],
      ),
    ).toBe(2);
  });

  it("RNF05 - falha ao gravar o histórico desfaz a conclusão", async () => {
    const janela = janelaDeHoje();

    const id = await agendar(
      corpoManutencao({
        descricao: "Serviço que vai explodir",
        mecanico: mecanicos.rollback.profissionalID,
        ...janela,
      }),
    );

    await mudarStatus(
      id,
      { status: "Em Execução" },
      mecanicos.rollback.email,
    );

    // Erro proposital no fechamento do histórico, depois do UPDATE do status
    await consultar(`
      CREATE OR REPLACE FUNCTION teste_falha_historico() RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'falha proposital do teste';
      END;
      $$ LANGUAGE plpgsql
    `);
    await consultar(`
      CREATE TRIGGER teste_falha_historico
      BEFORE INSERT ON historicomanutencao
      FOR EACH ROW EXECUTE FUNCTION teste_falha_historico()
    `);

    try {
      const conclusao = await mudarStatus(
        id,
        {
          status: "Concluída",
          servicosRealizados: "Não deveria persistir",
          custos: 99,
        },
        mecanicos.rollback.email,
      );

      expect(conclusao.status).toBe(500);
    } finally {
      await consultar(
        "DROP TRIGGER IF EXISTS teste_falha_historico ON historicomanutencao",
      );
      await consultar("DROP FUNCTION IF EXISTS teste_falha_historico()");
    }

    const manutencao = await um(
      "SELECT status, conclusaoefetiva FROM manutencoesprogramadas WHERE pk_manutencaoid = $1",
      [id],
    );

    expect(manutencao).toMatchObject({
      status: "Em Execução",
      conclusaoefetiva: null,
    });

    expect(
      await contar(
        "SELECT COUNT(*) FROM historicomanutencao WHERE fk_manutencaoid = $1",
        [id],
      ),
    ).toBe(0);
  });

  it("RF08 - mecânico só enxerga as próprias manutenções", async () => {
    const { status, body } = await chamar(listarManutencoes, {
      token: await tokenDe(EMAILS.galo),
      path: "/api/manutencoesProgramadas",
    });

    expect(status).toBe(200);
    expect(body.data.length).toBeGreaterThan(0);

    for (const manutencao of body.data) {
      expect(manutencao.fk_mecanicoID).toBe(4);
    }
  });
});

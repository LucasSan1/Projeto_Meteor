import { NextResponse } from "next/server";
import pool from "../../../lib/connSql";
import {
  autorizar,
  autorizarGestor,
  CARGOS,
  exigirPerfilOperador,
  garantirTitularidade,
} from "../../../utils/authMiddleware";
import { getDataBrasilia } from "../../../utils/Datetime";
import { toSqlDatetime } from "../../../utils/datetimeSql";
import {
  especializacaoCompativel,
  validarAgendaOperador,
  validarExecucaoAberta,
  validarJanelaExecucao,
} from "../../../utils/agenda";
import {
  extrairProducao,
  validarConsumoConclusao,
  validarMateriaisPlanejados,
  validarQualidade,
} from "../../../utils/producao";
import { ajustarEstoque } from "../../movimentacoesEstoque/estoque";

// Fluxo permitido de status (ordem concluída/cancelada não volta atrás).
// Cancelar só vale a partir de Pendente
const TRANSICOES = {
  Pendente: ["Em Produção", "Cancelada"],
  "Em Produção": ["Concluída"],
  Concluída: [],
  Cancelada: [],
};

// Operador só anda pra frente e nunca cancela; cancelar é coisa de gestor
const TRANSICOES_OPERADOR = {
  Pendente: ["Em Produção"],
  "Em Produção": ["Concluída"],
  Concluída: [],
  Cancelada: [],
};

export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const { status, observacao } = body;

  let connection;

  try {
    const usuarioLogado = await autorizar(request, [
      CARGOS.GERENTE,
      CARGOS.OPERADOR,
    ]);

    const transicoes =
      usuarioLogado.cargo === CARGOS.OPERADOR
        ? TRANSICOES_OPERADOR
        : TRANSICOES;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [exist] = await connection.query(
      "SELECT * FROM ordensProducao WHERE pk_ordemID = ? FOR UPDATE",
      [id],
    );

    if (exist.length === 0) {
      throw { status: 404, message: "Ordem não encontrada!" };
    }

    const ordem = exist[0];

    // Operador só mexe na própria ordem
    if (usuarioLogado.cargo === CARGOS.OPERADOR) {
      exigirPerfilOperador(usuarioLogado);
      garantirTitularidade(
        usuarioLogado,
        ordem.fk_operadorID,
        "Essa ordem não está atribuída a você!",
      );
    }

    if (!transicoes[ordem.status]) {
      throw { status: 400, message: "Status atual inválido!" };
    }

    if (ordem.status === status) {
      await connection.rollback();

      return NextResponse.json(
        { message: "A ordem já está com esse status!" },
        { status: 200 },
      );
    }

    if (!transicoes[ordem.status].includes(status)) {
      throw {
        status: 400,
        message: `Não é possível mudar de "${ordem.status}" para "${status}"!`,
      };
    }

    const agora = getDataBrasilia();
    let dadosNovos = { status };

    if (status === "Em Produção") {
      await validarExecucaoAberta(connection, ordem.fk_operadorID, {
        ignorarOrdemID: id,
      });

      // Início só dentro da janela prevista, operador pode antecipar com justificativa
      const janela = validarJanelaExecucao(
        ordem.inicioPlanejado,
        ordem.terminoPlanejado,
        "ordem",
        { permitirAntecipacao: usuarioLogado.cargo === CARGOS.OPERADOR },
      );

      if (janela.inicioAntecipado && !observacao?.trim()) {
        throw {
          status: 400,
          message:
            "Informe a observação para justificar o início antes do planejado!",
        };
      }

      if (janela.inicioAntecipado) {
        dadosNovos.inicioAntecipado = true;
      }

      await validarAgendaOperador(connection, {
        profissionalID: ordem.fk_operadorID,
        inicio: ordem.inicioPlanejado,
        termino: ordem.terminoPlanejado,
        ignorarOrdemID: id,
      });

      // Revalida o saldo dos materiais planejados antes de começar
      const [planejados] = await connection.query(
        "SELECT fk_materiaID, quantidadePrevista FROM ordemMateriais WHERE fk_ordemID = ?",
        [id],
      );

      if (planejados.length > 0) {
        await validarMateriaisPlanejados(
          connection,
          planejados.map((material) => ({
            materiaID: material.fk_materiaID,
            quantidadePrevista: material.quantidadePrevista,
          })),
        );
      }

      await connection.query(
        `UPDATE ordensProducao
         SET status = ?, inicioEfetivo = ?
         WHERE pk_ordemID = ?`,
        [status, agora, id],
      );
    } else if (status === "Concluída") {
      dadosNovos = await concluirOrdem(connection, ordem, body, agora, usuarioLogado);
    } else {
      // Cancelamento, só existe a partir de Pendente
      await connection.query(
        "UPDATE ordensProducao SET status = ? WHERE pk_ordemID = ?",
        [status, id],
      );
    }

    // Assina o histórico com o usuário que já veio autenticado
    await connection.query(
      `INSERT INTO historicoOrdens
        (fk_ordemID, fk_usuarioID, statusAnterior, statusNovo, observacao)
       VALUES (?, ?, ?, ?, ?)`,
      [id, usuarioLogado.id, ordem.status, status, observacao || null],
    );

    // Auditoria geral da entidade, além do histórico específico de ordens
    await connection.query(
      `INSERT INTO auditoria
        (fk_usuarioID, entidade, entidadeID, acao, dadosAnteriores, dadosNovos, observacao)
       VALUES (?, 'ordem', ?, 'mudancaStatus', ?, ?, ?)`,
      [
        usuarioLogado.id,
        id,
        JSON.stringify({ status: ordem.status }),
        JSON.stringify(dadosNovos),
        observacao || null,
      ],
    );

    await connection.commit();

    return NextResponse.json(
      { message: "Status da ordem atualizado!" },
      { status: 200 },
    );
  } catch (err) {
    if (connection) await connection.rollback();

    console.log("OS produção PUT : ", err);

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
  } finally {
    if (connection) connection.release();
  }
}

// Faz a conclusão inteira numa transação, estado, consumo, baixa, produção e inspeção
async function concluirOrdem(connection, ordem, body, agora, usuarioLogado) {
  if (!ordem.inicioEfetivo) {
    throw {
      status: 400,
      message: "A ordem precisa ser iniciada antes de ser concluída!",
    };
  }

  const [historicoExistente] = await connection.query(
    "SELECT pk_historicoProducaoID FROM historicoProducao WHERE fk_ordemID = ?",
    [ordem.pk_ordemID],
  );

  if (historicoExistente.length > 0) {
    throw {
      status: 409,
      message: "Essa ordem já teve a produção registrada. Nada será duplicado!",
    };
  }

  const [inspecaoExistente] = await connection.query(
    "SELECT pk_inspecaoID FROM inspecoes WHERE fk_ordemID = ?",
    [ordem.pk_ordemID],
  );

  if (inspecaoExistente.length > 0) {
    throw {
      status: 409,
      message: "Essa ordem já possui inspeção registrada!",
    };
  }

  const producao = extrairProducao(body);
  const qualidade = validarQualidade(producao);

  let maquinaID = producao.maquinaID ? Number(producao.maquinaID) : null;

  if (maquinaID) {
    const [maquina] = await connection.query(
      "SELECT pk_maquinaID FROM maquinas WHERE pk_maquinaID = ? AND status = 'Ativo'",
      [maquinaID],
    );

    if (maquina.length === 0) {
      throw { status: 404, message: "Máquina não encontrada ou inativa!" };
    }
  } else {
    maquinaID = null;
  }

  const consumos = await validarConsumoConclusao(
    connection,
    ordem.pk_ordemID,
    producao.consumo,
  );

  await connection.query(
    `UPDATE ordensProducao
     SET status = 'Concluída', conclusaoEfetiva = ?
     WHERE pk_ordemID = ?`,
    [agora, ordem.pk_ordemID],
  );

  // Consumo efetivo + uma saída por material, sem duplicar baixa
  for (const consumo of consumos) {
    await connection.query(
      `UPDATE ordemMateriais
       SET quantidadeConsumida = ?
       WHERE fk_ordemID = ? AND fk_materiaID = ?`,
      [consumo.quantidade, ordem.pk_ordemID, consumo.materiaID],
    );

    if (consumo.quantidade > 0) {
      await connection.query(
        `INSERT INTO movimentacoesEstoque
          (fk_materiaID, tipo, quantidade, unidadeMedida, fk_usuarioID, fk_ordemID, observacao)
         VALUES (?, 'Saida', ?, ?, ?, ?, ?)`,
        [
          consumo.materiaID,
          consumo.quantidade,
          consumo.unidadeMedida,
          usuarioLogado.id,
          ordem.pk_ordemID,
          `Consumo da ${ordem.codigo}`,
        ],
      );

      await ajustarEstoque(
        connection,
        consumo.materiaID,
        "Saida",
        consumo.quantidade,
        1,
      );
    }
  }

  await connection.query(
    `INSERT INTO historicoProducao
      (fk_ordemID, fk_operadorID, fk_maquinaID, dataConclusao, quantidadeProduzida)
     VALUES (?, ?, ?, ?, ?)`,
    [
      ordem.pk_ordemID,
      ordem.fk_operadorID,
      maquinaID,
      agora,
      qualidade.quantidadeProduzida,
    ],
  );

  const [inspecao] = await connection.query(
    `INSERT INTO inspecoes
      (fk_ordemID, totalProduzido, aprovadas, rejeitadas, observacoes)
     VALUES (?, ?, ?, ?, ?)`,
    [
      ordem.pk_ordemID,
      qualidade.quantidadeProduzida,
      qualidade.aprovadas,
      qualidade.rejeitadas,
      producao.observacoes || null,
    ],
  );

  for (const rejeicao of qualidade.rejeicoes) {
    await connection.query(
      `INSERT INTO rejeicoes
        (fk_inspecaoID, quantidade, motivoRejeicao, tipo, acoesCorretivas)
       VALUES (?, ?, ?, ?, ?)`,
      [
        inspecao.insertId,
        rejeicao.quantidade,
        rejeicao.motivoRejeicao,
        rejeicao.tipo,
        rejeicao.acoesCorretivas,
      ],
    );
  }

  return {
    status: "Concluída",
    quantidadeProduzida: qualidade.quantidadeProduzida,
    aprovadas: qualidade.aprovadas,
    rejeitadas: qualidade.rejeitadas,
    consumo: consumos.map((item) => ({
      materiaID: item.materiaID,
      quantidade: item.quantidade,
    })),
    maquinaID,
  };
}

// Edição dos dados planejados, só enquanto a ordem ainda está pendente
export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const {
    codigo,
    pecaID,
    quantidadePlanejada,
    especializacao,
    operadorID,
    inicioPlanejado,
    terminoPlanejado,
    materiais,
  } = body;

  let connection;

  try {
    const usuario = await autorizarGestor(request);

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [exist] = await connection.query(
      "SELECT * FROM ordensProducao WHERE pk_ordemID = ? FOR UPDATE",
      [id],
    );

    if (exist.length === 0) {
      throw { status: 404, message: "Ordem não encontrada!" };
    }

    const ordem = exist[0];

    if (ordem.status !== "Pendente") {
      throw {
        status: 400,
        message: "Só é possível editar ordens com status Pendente!",
      };
    }

    const codigoFinal = codigo?.trim() ? codigo : ordem.codigo;
    const pecaFinal = pecaID || ordem.fk_pecaID;

    const quantidadeFinal =
      quantidadePlanejada !== undefined && quantidadePlanejada !== ""
        ? Number(quantidadePlanejada)
        : Number(ordem.quantidadePlanejada);

    const especializacaoFinal = especializacao?.trim()
      ? especializacao
      : ordem.especializacao;

    const operadorFinal = operadorID || ordem.fk_operadorID;

    const inicio = inicioPlanejado
      ? toSqlDatetime(inicioPlanejado)
      : ordem.inicioPlanejado;

    const termino = terminoPlanejado
      ? toSqlDatetime(terminoPlanejado)
      : ordem.terminoPlanejado;

    if (!Number.isInteger(quantidadeFinal) || quantidadeFinal <= 0) {
      throw {
        status: 400,
        message: "A quantidade planejada deve ser um inteiro maior que zero!",
      };
    }

    if (new Date(termino) <= new Date(inicio)) {
      throw {
        status: 400,
        message: "O término planejado deve ser depois do início!",
      };
    }

    const [peca] = await connection.query(
      "SELECT * FROM pecas WHERE pk_pecaID = ? AND status = 'Ativo'",
      [pecaFinal],
    );

    if (peca.length === 0) {
      throw { status: 404, message: "Peça não encontrada ou inativa!" };
    }

    const [operador] = await connection.query(
      "SELECT pk_profissionalID, especializacao FROM profissionais WHERE pk_profissionalID = ? AND status = 'Ativo' AND ehOperador = 1",
      [operadorFinal],
    );

    if (operador.length === 0) {
      throw { status: 404, message: "Operador inválido ou inativo!" };
    }

    // Trocar de operador/especialização não pode criar uma combinação sem aptidão
    if (!especializacaoCompativel(especializacaoFinal, operador[0].especializacao)) {
      throw {
        status: 400,
        message: `O operador selecionado não possui a especialização exigida (${especializacaoFinal})!`,
      };
    }

    if (codigoFinal !== ordem.codigo) {
      const [codigoExist] = await connection.query(
        "SELECT pk_ordemID FROM ordensProducao WHERE codigo = ? AND pk_ordemID <> ?",
        [codigoFinal, id],
      );

      if (codigoExist.length > 0) {
        throw { status: 409, message: "Já existe uma ordem com esse código!" };
      }
    }

    // Reprogramar também passa pela agenda e pelo saldo
    await validarAgendaOperador(connection, {
      profissionalID: operadorFinal,
      inicio,
      termino,
      ignorarOrdemID: id,
    });

    const [materiaisAtuais] = await connection.query(
      "SELECT fk_materiaID, quantidadePrevista FROM ordemMateriais WHERE fk_ordemID = ?",
      [id],
    );

    let materiaisValidos = null;

    if (materiais !== undefined) {
      materiaisValidos = await validarMateriaisPlanejados(connection, materiais);
    } else if (materiaisAtuais.length > 0) {
      materiaisValidos = await validarMateriaisPlanejados(
        connection,
        materiaisAtuais.map((material) => ({
          materiaID: material.fk_materiaID,
          quantidadePrevista: material.quantidadePrevista,
        })),
      );
    }

    await connection.query(
      `UPDATE ordensProducao
       SET codigo = ?, fk_pecaID = ?, quantidadePlanejada = ?, especializacao = ?, fk_operadorID = ?, inicioPlanejado = ?, terminoPlanejado = ?
       WHERE pk_ordemID = ?`,
      [
        codigoFinal,
        pecaFinal,
        quantidadeFinal,
        especializacaoFinal,
        operadorFinal,
        inicio,
        termino,
        id,
      ],
    );

    // Só substitui a lista quando o gestor mandou uma lista nova
    if (materiaisValidos) {
      await connection.query(
        "DELETE FROM ordemMateriais WHERE fk_ordemID = ?",
        [id],
      );

      await connection.query(
        `INSERT INTO ordemMateriais
          (fk_ordemID, fk_materiaID, quantidadePrevista)
         VALUES ?`,
        [
          materiaisValidos.map((material) => [
            id,
            material.materiaID,
            material.quantidadePrevista,
          ]),
        ],
      );
    }

    await connection.query(
      `INSERT INTO auditoria
        (fk_usuarioID, entidade, entidadeID, acao, dadosAnteriores, dadosNovos, observacao)
       VALUES (?, 'ordem', ?, 'reprogramacao', ?, ?, ?)`,
      [
        usuario.id,
        id,
        JSON.stringify(ordem),
        JSON.stringify({
          codigo: codigoFinal,
          pecaID: pecaFinal,
          quantidadePlanejada: quantidadeFinal,
          especializacao: especializacaoFinal,
          operadorID: operadorFinal,
          inicioPlanejado: inicio,
          terminoPlanejado: termino,
          materiais: materiaisValidos,
        }),
        "Edição dos dados planejados",
      ],
    );

    await connection.commit();

    return NextResponse.json(
      { message: "Ordem atualizada!" },
      { status: 200 },
    );
  } catch (err) {
    if (connection) await connection.rollback();

    console.log("OS produção PATCH : ", err);

    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { message: "Já existe uma ordem com esse código!" },
        { status: 409 },
      );
    }

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
  } finally {
    if (connection) connection.release();
  }
}

import { NextResponse } from "next/server";
import pool from "../../../lib/connSql";
import {
  autorizar,
  autorizarGestor,
  CARGOS,
  exigirPerfilMecanico,
  garantirTitularidade,
} from "../../../utils/authMiddleware";
import { getDataBrasilia } from "../../../utils/Datetime";
import { toSqlDatetime } from "../../../utils/datetimeSql";
import {
  especializacaoCompativel,
  validarAgendaMecanico,
  validarExecucaoAberta,
  validarJanelaExecucao,
} from "../../../utils/agenda";

const TRANSICOES = {
  Programada: ["Em Execução", "Cancelada"],
  "Em Execução": ["Concluída"],
  Concluída: [],
  Cancelada: [],
};

// Mecânico inicia e conclui; cancelar é privilégio do gestor
const TRANSICOES_MECANICO = {
  Programada: ["Em Execução"],
  "Em Execução": ["Concluída"],
  Concluída: [],
  Cancelada: [],
};

// Edição dos dados planejados
export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const {
    equipamento,
    maquina,
    tipoManutencao,
    descricao,
    especializacao,
    mecanico,
    inicioPrevisto,
    terminoPrevisto,
  } = body;

  let connection;

  try {
    const usuario = await autorizarGestor(request);

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [exist] = await connection.query(
      "SELECT * FROM manutencoesProgramadas WHERE pk_manutencaoID = ? FOR UPDATE",
      [id],
    );

    if (exist.length === 0) {
      throw { status: 404, message: "Manutenção não encontrada!" };
    }

    const manutencao = exist[0];

    if (manutencao.status !== "Programada") {
      throw {
        status: 400,
        message: "Só é possível editar manutenções com status Programada!",
      };
    }

    const equipamentoFinal = equipamento || manutencao.fk_equipamentoID;

    const maquinaFinal =
      maquina !== undefined ? maquina || null : manutencao.fk_maquinaID;

    const descricaoFinal = descricao?.trim()
      ? descricao
      : manutencao.descricao;

    const especializacaoFinal = especializacao?.trim()
      ? especializacao
      : manutencao.especializacao;

    const mecanicoFinal = mecanico || manutencao.fk_mecanicoID;

    const inicio = inicioPrevisto
      ? toSqlDatetime(inicioPrevisto)
      : manutencao.inicioPrevisto;

    const termino = terminoPrevisto
      ? toSqlDatetime(terminoPrevisto)
      : manutencao.terminoPrevisto;

    if (new Date(termino) <= new Date(inicio)) {
      throw {
        status: 400,
        message: "O término previsto deve ser depois do início!",
      };
    }

    const [equip] = await connection.query(
      "SELECT * FROM equipamentos WHERE pk_equipamentoID = ? AND status = 'Ativo'",
      [equipamentoFinal],
    );

    if (equip.length === 0) {
      throw { status: 404, message: "Equipamento não encontrado ou inativo!" };
    }

    if (maquinaFinal) {
      const [maq] = await connection.query(
        "SELECT * FROM maquinas WHERE pk_maquinaID = ? AND fk_equipamentoID = ?",
        [maquinaFinal, equipamentoFinal],
      );

      if (maq.length === 0) {
        throw {
          status: 400,
          message: "A máquina selecionada não pertence a esse equipamento!",
        };
      }
    }

    const [mec] = await connection.query(
      "SELECT * FROM profissionais WHERE pk_profissionalID = ? AND status = 'Ativo' AND ehMecanico = 1",
      [mecanicoFinal],
    );

    if (mec.length === 0) {
      throw { status: 404, message: "Mecânico inválido ou inativo!" };
    }

    // Reprogramar com outro mecânico/especialização também passa pela aptidão
    if (!especializacaoCompativel(especializacaoFinal, mec[0].especializacao)) {
      throw {
        status: 400,
        message: `O mecânico selecionado não possui a especialização exigida (${especializacaoFinal})!`,
      };
    }

    // Reprogramação valida a agenda desconsiderando só este compromisso
    await validarAgendaMecanico(connection, {
      profissionalID: mecanicoFinal,
      inicio,
      termino,
      ignorarManutencaoID: id,
    });

    await connection.query(
      `UPDATE manutencoesProgramadas
       SET fk_equipamentoID = ?, fk_maquinaID = ?, tipoManutencao = ?, descricao = ?, especializacao = ?, fk_mecanicoID = ?, inicioPrevisto = ?, terminoPrevisto = ?
       WHERE pk_manutencaoID = ?`,
      [
        equipamentoFinal,
        maquinaFinal,
        tipoManutencao || manutencao.tipoManutencao,
        descricaoFinal,
        especializacaoFinal,
        mecanicoFinal,
        inicio,
        termino,
        id,
      ],
    );

    await connection.query(
      `INSERT INTO auditoria
        (fk_usuarioID, entidade, entidadeID, acao, dadosAnteriores, dadosNovos, observacao)
       VALUES (?, 'manutencao', ?, 'reprogramacao', ?, ?, ?)`,
      [
        usuario.id,
        id,
        JSON.stringify(manutencao),
        JSON.stringify({
          equipamento: equipamentoFinal,
          maquina: maquinaFinal,
          mecanico: mecanicoFinal,
          inicioPrevisto: inicio,
          terminoPrevisto: termino,
        }),
        "Reprogramação da manutenção",
      ],
    );

    await connection.commit();

    return NextResponse.json(
      { message: "Manutenção atualizada!" },
      { status: 200 },
    );
  } catch (err) {
    if (connection) await connection.rollback();

    console.log("Manutencoes PATCH : ", err);

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

// Mudança de status + fechamento do histórico quando concluir
export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const { status, servicosRealizados, custos, observacoes } = body;

  let connection;

  try {
    const usuarioLogado = await autorizar(request, [
      CARGOS.GERENTE,
      CARGOS.MECANICO,
    ]);

    const transicoes =
      usuarioLogado.cargo === CARGOS.MECANICO
        ? TRANSICOES_MECANICO
        : TRANSICOES;

    // Custos negativos estouram o CHECK do histórico, então barra antes de chegar no banco
    const custoFinal =
      custos === undefined || custos === "" ? 0 : Number(custos);

    if (Number.isNaN(custoFinal) || custoFinal < 0) {
      throw { status: 400, message: "Os custos não podem ser negativos!" };
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [exist] = await connection.query(
      "SELECT * FROM manutencoesProgramadas WHERE pk_manutencaoID = ? FOR UPDATE",
      [id],
    );

    if (exist.length === 0) {
      throw { status: 404, message: "Manutenção não encontrada!" };
    }

    const manutencao = exist[0];

    // Mecânico só age na própria intervenção
    if (usuarioLogado.cargo === CARGOS.MECANICO) {
      exigirPerfilMecanico(usuarioLogado);
      garantirTitularidade(
        usuarioLogado,
        manutencao.fk_mecanicoID,
        "Essa manutenção não está atribuída a você!",
      );
    }

    if (!transicoes[manutencao.status]) {
      throw { status: 400, message: "Status atual inválido!" };
    }

    if (manutencao.status === status) {
      await connection.rollback();

      return NextResponse.json(
        { message: "A manutenção já está com esse status!" },
        { status: 200 },
      );
    }

    if (!transicoes[manutencao.status].includes(status)) {
      throw {
        status: 400,
        message: `Não é possível mudar de "${manutencao.status}" para "${status}"!`,
      };
    }

    const agora = getDataBrasilia();
    let inicioEfetivo = manutencao.inicioEfetivo;
    let conclusaoEfetiva = manutencao.conclusaoEfetiva;
    let servicosFinal = manutencao.servicosRealizados;
    let inicioAntecipado = false;

    if (status === "Em Execução") {
      // Início só na janela prevista, mecânico pode antecipar com justificativa
      const janela = validarJanelaExecucao(
        manutencao.inicioPrevisto,
        manutencao.terminoPrevisto,
        "manutenção",
        { permitirAntecipacao: usuarioLogado.cargo === CARGOS.MECANICO },
      );

      inicioAntecipado = janela.inicioAntecipado;

      if (inicioAntecipado && !observacoes?.trim()) {
        throw {
          status: 400,
          message:
            "Informe a observação para justificar o início antes do previsto!",
        };
      }

      await validarExecucaoAberta(connection, manutencao.fk_mecanicoID, {
        ignorarManutencaoID: id,
      });

      await validarAgendaMecanico(connection, {
        profissionalID: manutencao.fk_mecanicoID,
        inicio: manutencao.inicioPrevisto,
        termino: manutencao.terminoPrevisto,
        ignorarManutencaoID: id,
      });

      inicioEfetivo = agora;
    }

    if (status === "Concluída") {
      servicosFinal = servicosRealizados?.trim()
        ? servicosRealizados
        : manutencao.servicosRealizados;

      if (!servicosFinal?.trim()) {
        throw {
          status: 400,
          message: "Descreva os serviços realizados antes de concluir!",
        };
      }

      conclusaoEfetiva = agora;
    }

    await connection.query(
      `UPDATE manutencoesProgramadas
       SET status = ?, inicioEfetivo = ?, conclusaoEfetiva = ?, servicosRealizados = ?
       WHERE pk_manutencaoID = ?`,
      [status, inicioEfetivo, conclusaoEfetiva, servicosFinal, id],
    );

    // Ao concluir, fecha o histórico da manutenção
    // Tudo na mesma transação, pra não sobrar status "Concluída" sem histórico
    if (status === "Concluída") {
      await connection.query(
        `INSERT INTO historicoManutencao
          (fk_manutencaoID, fk_equipamentoID, fk_mecanicoID, manutencaoRealizada, dataManutencao, inicioEfetivo, terminoEfetivo, custos, observacoes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (fk_manutencaoID) DO UPDATE SET
          fk_mecanicoID = EXCLUDED.fk_mecanicoID,
          manutencaoRealizada = EXCLUDED.manutencaoRealizada,
          dataManutencao = EXCLUDED.dataManutencao,
          inicioEfetivo = EXCLUDED.inicioEfetivo,
          terminoEfetivo = EXCLUDED.terminoEfetivo,
          custos = EXCLUDED.custos,
          observacoes = EXCLUDED.observacoes`,
        [
          id,
          manutencao.fk_equipamentoID,
          manutencao.fk_mecanicoID,
          manutencao.tipoManutencao || manutencao.descricao,
          agora.split(" ")[0],
          inicioEfetivo,
          agora,
          custoFinal,
          observacoes || servicosFinal || null,
        ],
      );
    }

    await connection.query(
      `INSERT INTO auditoria
        (fk_usuarioID, entidade, entidadeID, acao, dadosAnteriores, dadosNovos, observacao)
       VALUES (?, 'manutencao', ?, 'mudancaStatus', ?, ?, ?)`,
      [
        usuarioLogado.id,
        id,
        JSON.stringify({ status: manutencao.status }),
        JSON.stringify({
          status,
          inicioEfetivo,
          conclusaoEfetiva,
          custos: custoFinal,
          inicioAntecipado,
        }),
        observacoes || null,
      ],
    );

    await connection.commit();

    return NextResponse.json(
      { message: "Status da manutenção atualizado!" },
      { status: 200 },
    );
  } catch (err) {
    if (connection) await connection.rollback();

    console.log("Manutencoes PUT : ", err);

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

// Cancelamento, que é o "delete" lógico dessa tabela
// Só manutenção Programada pode ser cancelada
export async function DELETE(request, { params }) {
  const { id } = await params;

  try {
    const usuario = await autorizarGestor(request);

    const [exist] = await pool.query(
      "SELECT * FROM manutencoesProgramadas WHERE pk_manutencaoID = ?",
      [id],
    );

    if (exist.length === 0) {
      throw { status: 404, message: "Manutenção não encontrada!" };
    }

    if (exist[0].status !== "Programada") {
      throw {
        status: 400,
        message: "Só é possível cancelar manutenções com status Programada!",
      };
    }

    await pool.query(
      "UPDATE manutencoesProgramadas SET status = 'Cancelada' WHERE pk_manutencaoID = ?",
      [id],
    );

    await pool.query(
      `INSERT INTO auditoria
        (fk_usuarioID, entidade, entidadeID, acao, dadosAnteriores, dadosNovos, observacao)
       VALUES (?, 'manutencao', ?, 'cancelamento', ?, ?, ?)`,
      [
        usuario.id,
        id,
        JSON.stringify({ status: exist[0].status }),
        JSON.stringify({ status: "Cancelada" }),
        "Cancelamento da manutenção",
      ],
    );

    return NextResponse.json(
      { message: "Manutenção cancelada!" },
      { status: 200 },
    );
  } catch (err) {
    console.log("Manutencoes DELETE : ", err);

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

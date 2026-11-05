import { NextResponse } from "next/server";
import pool from "../../../lib/connSql";
import { checkAuthPosition } from "../../../utils/authChecker";
import {
  autorizar,
  CARGOS,
  exigirPerfilMecanico,
  garantirTitularidade,
} from "../../../utils/authMiddleware";
import { getDataBrasilia } from "../../../utils/Datetime";
import { toSqlDatetime } from "../../../utils/datetimeSql";

const TRANSICOES = {
  Programada: ["Em Execução", "Cancelada"],
  "Em Execução": ["Concluída", "Cancelada"],
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

  try {
    await checkAuthPosition(request);

    const [exist] = await pool.query(
      "SELECT * FROM manutencoesProgramadas WHERE pk_manutencaoID = ?",
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

    const [equip] = await pool.query(
      "SELECT * FROM equipamentos WHERE pk_equipamentoID = ? AND status = 'Ativo'",
      [equipamentoFinal],
    );

    if (equip.length === 0) {
      throw { status: 404, message: "Equipamento não encontrado ou inativo!" };
    }

    if (maquinaFinal) {
      const [maq] = await pool.query(
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

    const [mec] = await pool.query(
      "SELECT * FROM profissionais WHERE pk_profissionalID = ? AND status = 'Ativo' AND ehMecanico = 1",
      [mecanicoFinal],
    );

    if (mec.length === 0) {
      throw { status: 404, message: "Mecânico inválido ou inativo!" };
    }

    await pool.query(
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

    return NextResponse.json(
      { message: "Manutenção atualizada!" },
      { status: 200 },
    );
  } catch (err) {
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

    const inicioEfetivo =
      status === "Em Execução" && !manutencao.inicioEfetivo
        ? agora
        : manutencao.inicioEfetivo;

    const conclusaoEfetiva =
      status === "Concluída" ? agora : manutencao.conclusaoEfetiva;

    const servicosFinal =
      status === "Concluída"
        ? servicosRealizados || manutencao.servicosRealizados
        : manutencao.servicosRealizados;

    await connection.query(
      `UPDATE manutencoesProgramadas
       SET status = ?, inicioEfetivo = ?, conclusaoEfetiva = ?, servicosRealizados = ?
       WHERE pk_manutencaoID = ?`,
      [status, inicioEfetivo, conclusaoEfetiva, servicosFinal, id],
    );

    // Ao concluir, fecha o histórico da manutenção
    // Tudo na mesma transação, pra não sobrar status "Concluída" sem histórico
    if (status === "Concluída") {
      const dataManutencao = getDataBrasilia().split(" ")[0];

      await connection.query(
        `INSERT INTO historicoManutencao
          (fk_manutencaoID, fk_equipamentoID, manutencaoRealizada, dataManutencao, custos, observacoes)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          manutencaoRealizada = VALUES(manutencaoRealizada),
          dataManutencao = VALUES(dataManutencao),
          custos = VALUES(custos),
          observacoes = VALUES(observacoes)`,
        [
          id,
          manutencao.fk_equipamentoID,
          manutencao.tipoManutencao || manutencao.descricao,
          dataManutencao,
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
        JSON.stringify({ status }),
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
export async function DELETE(request, { params }) {
  const { id } = await params;

  try {
    await checkAuthPosition(request);

    const [exist] = await pool.query(
      "SELECT * FROM manutencoesProgramadas WHERE pk_manutencaoID = ?",
      [id],
    );

    if (exist.length === 0) {
      throw { status: 404, message: "Manutenção não encontrada!" };
    }

    if (["Concluída", "Cancelada"].includes(exist[0].status)) {
      throw {
        status: 400,
        message: "Manutenção já concluída ou cancelada!",
      };
    }

    await pool.query(
      "UPDATE manutencoesProgramadas SET status = 'Cancelada' WHERE pk_manutencaoID = ?",
      [id],
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

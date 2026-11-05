import { NextResponse } from "next/server";
import pool from "../../../lib/connSql";
import { checkAuthPosition } from "../../../utils/authChecker";
import { getDataBrasilia } from "../../../utils/Datetime";
import { toSqlDatetime } from "../../../utils/datetimeSql";

// Fluxo permitido de status (ordem concluída/cancelada não volta atrás)
const TRANSICOES = {
  Pendente: ["Em Produção", "Cancelada"],
  "Em Produção": ["Concluída", "Cancelada"],
  Concluída: [],
  Cancelada: [],
};

export async function PUT(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const { status, observacao } = body;

  try {
    const payload = checkAuthPosition(request);

    const [exist] = await pool.query(
      "SELECT * FROM ordensProducao WHERE pk_ordemID = ?",
      [id],
    );

    if (exist.length === 0) {
      throw { status: 404, message: "Ordem não encontrada!" };
    }

    const ordem = exist[0];

    if (!TRANSICOES[ordem.status]) {
      throw { status: 400, message: "Status atual inválido!" };
    }

    if (ordem.status === status) {
      return NextResponse.json(
        { message: "A ordem já está com esse status!" },
        { status: 200 },
      );
    }

    if (!TRANSICOES[ordem.status].includes(status)) {
      throw {
        status: 400,
        message: `Não é possível mudar de "${ordem.status}" para "${status}"!`,
      };
    }

    const agora = getDataBrasilia();

    const inicioEfetivo =
      status === "Em Produção" && !ordem.inicioEfetivo
        ? agora
        : ordem.inicioEfetivo;

    const conclusaoEfetiva =
      status === "Concluída" ? agora : ordem.conclusaoEfetiva;

    await pool.query(
      "UPDATE ordensProducao SET status = ?, inicioEfetivo = ?, conclusaoEfetiva = ? WHERE pk_ordemID = ?",
      [status, inicioEfetivo, conclusaoEfetiva, id],
    );

    // Descobre o usuário pelo e-mail do token pra assinar o histórico
    const [usuario] = await pool.query(
      "SELECT id FROM usuarios WHERE email = ?",
      [payload.email],
    );

    if (usuario.length > 0) {
      await pool.query(
        `INSERT INTO historicoOrdens
          (fk_ordemID, fk_usuarioID, statusAnterior, statusNovo, observacao)
         VALUES (?, ?, ?, ?, ?)`,
        [
          id,
          usuario[0].id,
          ordem.status,
          status,
          observacao || null,
        ],
      );

      // Auditoria geral da entidade, além do histórico específico de ordens
      await pool.query(
        `INSERT INTO auditoria
          (fk_usuarioID, entidade, entidadeID, acao, dadosAnteriores, dadosNovos, observacao)
         VALUES (?, 'ordem', ?, 'mudancaStatus', ?, ?, ?)`,
        [
          usuario[0].id,
          id,
          JSON.stringify({ status: ordem.status }),
          JSON.stringify({ status }),
          observacao || null,
        ],
      );
    }

    return NextResponse.json(
      { message: "Status da ordem atualizado!" },
      { status: 200 },
    );
  } catch (err) {
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
  }
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
  } = body;

  try {
    const payload = checkAuthPosition(request);

    const [exist] = await pool.query(
      "SELECT * FROM ordensProducao WHERE pk_ordemID = ?",
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
        ? quantidadePlanejada
        : ordem.quantidadePlanejada;

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

    if (Number(quantidadeFinal) <= 0) {
      throw { status: 400, message: "A quantidade deve ser maior que zero!" };
    }

    if (new Date(termino) <= new Date(inicio)) {
      throw {
        status: 400,
        message: "O término planejado deve ser depois do início!",
      };
    }

    const [peca] = await pool.query(
      "SELECT * FROM pecas WHERE pk_pecaID = ? AND status = 'Ativo'",
      [pecaFinal],
    );

    if (peca.length === 0) {
      throw { status: 404, message: "Peça não encontrada ou inativa!" };
    }

    const [operador] = await pool.query(
      "SELECT pk_profissionalID FROM profissionais WHERE pk_profissionalID = ? AND status = 'Ativo' AND ehOperador = 1",
      [operadorFinal],
    );

    if (operador.length === 0) {
      throw { status: 404, message: "Operador inválido ou inativo!" };
    }

    if (codigoFinal !== ordem.codigo) {
      const [codigoExist] = await pool.query(
        "SELECT pk_ordemID FROM ordensProducao WHERE codigo = ? AND pk_ordemID <> ?",
        [codigoFinal, id],
      );

      if (codigoExist.length > 0) {
        throw { status: 409, message: "Já existe uma ordem com esse código!" };
      }
    }

    await pool.query(
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

    const [usuario] = await pool.query(
      "SELECT id FROM usuarios WHERE email = ?",
      [payload.email],
    );

    if (usuario.length > 0) {
      await pool.query(
        `INSERT INTO auditoria
          (fk_usuarioID, entidade, entidadeID, acao, dadosAnteriores, dadosNovos, observacao)
         VALUES (?, 'ordem', ?, 'reprogramacao', ?, ?, ?)`,
        [
          usuario[0].id,
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
          }),
          "Edição dos dados planejados",
        ],
      );
    }

    return NextResponse.json(
      { message: "Ordem atualizada!" },
      { status: 200 },
    );
  } catch (err) {
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
  }
}

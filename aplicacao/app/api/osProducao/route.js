import { NextResponse } from "next/server";
import pool from "../../lib/connSql";
import {
  autorizar,
  autorizarGestor,
  CARGOS,
  exigirPerfilOperador,
} from "../../utils/authMiddleware";
import { toSqlDatetime } from "../../utils/datetimeSql";
import {
  especializacaoCompativel,
  validarAgendaOperador,
} from "../../utils/agenda";
import { validarMateriaisPlanejados } from "../../utils/producao";

// Lista as ordens com peça, operador e materiais já resolvidos
// Gestor vê tudo; operador vê só o que está atribuído a ele
export async function GET(request) {
  try {
    const usuario = await autorizar(request, [
      CARGOS.GERENTE,
      CARGOS.OPERADOR,
    ]);

    const soDoOperador = usuario.cargo === CARGOS.OPERADOR;

    if (soDoOperador) exigirPerfilOperador(usuario);

    const filtro = soDoOperador ? "WHERE op.fk_operadorID = ?" : "";
    const params = soDoOperador ? [usuario.profissionalID] : [];

    const [[result], [materiais]] = await Promise.all([
      pool.query(
        `
        SELECT
          op.pk_ordemID,
          op.codigo,
          op.fk_pecaID,
          p.peca AS nomePeca,
          op.quantidadePlanejada,
          op.especializacao,
          op.fk_operadorID,
          u.nome AS operador,
          op.inicioPlanejado,
          op.terminoPlanejado,
          op.inicioEfetivo,
          op.conclusaoEfetiva,
          op.status,
          CASE
            WHEN op.status IN ('Pendente', 'Em Produção')
             AND op.terminoPlanejado < NOW()
            THEN 1 ELSE 0
          END AS atrasada
        FROM ordensProducao op
        INNER JOIN pecas p ON op.fk_pecaID = p.pk_pecaID
        INNER JOIN profissionais prof ON op.fk_operadorID = prof.pk_profissionalID
        INNER JOIN usuarios u ON prof.fk_usuarioID = u.id
        ${filtro}
        ORDER BY op.inicioPlanejado
      `,
        params,
      ),
      pool.query(`
        SELECT
          om.fk_ordemID,
          om.fk_materiaID,
          om.quantidadePrevista,
          om.quantidadeConsumida,
          m.materia,
          m.unidadeMedida,
          m.quantidadeEstoque
        FROM ordemMateriais om
        INNER JOIN materiasPrimas m ON m.pk_materiaID = om.fk_materiaID
        ORDER BY m.materia
      `),
    ]);

    const materiaisPorOrdem = new Map();

    for (const material of materiais) {
      const lista = materiaisPorOrdem.get(material.fk_ordemID) || [];
      lista.push(material);
      materiaisPorOrdem.set(material.fk_ordemID, lista);
    }

    return NextResponse.json(
      {
        data: result.map((ordem) => ({
          ...ordem,
          atrasada: Boolean(ordem.atrasada),
          materiais: materiaisPorOrdem.get(ordem.pk_ordemID) || [],
        })),
      },
      { status: 200 },
    );
  } catch (err) {
    console.log("OS produção GET : ", err);

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

export async function POST(request) {
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

    if (
      !codigo?.trim() ||
      !pecaID ||
      !quantidadePlanejada ||
      !especializacao?.trim() ||
      !operadorID ||
      !inicioPlanejado ||
      !terminoPlanejado
    ) {
      throw { status: 400, message: "Preencha todos os campos da ordem!" };
    }

    const quantidade = Number(quantidadePlanejada);

    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      throw {
        status: 400,
        message: "A quantidade planejada deve ser um inteiro maior que zero!",
      };
    }

    const inicio = toSqlDatetime(inicioPlanejado);
    const termino = toSqlDatetime(terminoPlanejado);

    if (new Date(termino) <= new Date(inicio)) {
      throw {
        status: 400,
        message: "O término planejado deve ser depois do início!",
      };
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [peca] = await connection.query(
      "SELECT * FROM pecas WHERE pk_pecaID = ? AND status = 'Ativo'",
      [pecaID],
    );

    if (peca.length === 0) {
      throw { status: 404, message: "Peça não encontrada ou inativa!" };
    }

    const [operador] = await connection.query(
      `SELECT p.*, u.nome
       FROM profissionais p
       INNER JOIN usuarios u ON p.fk_usuarioID = u.id
       WHERE p.pk_profissionalID = ? AND p.status = 'Ativo' AND p.ehOperador = 1`,
      [operadorID],
    );

    if (operador.length === 0) {
      throw {
        status: 404,
        message: "Operador não encontrado, inativo ou sem perfil de operador!",
      };
    }

    // Operador precisa ter especialização compatível com a peça
    if (!especializacaoCompativel(especializacao, operador[0].especializacao)) {
      throw {
        status: 400,
        message: `O operador ${operador[0].nome} não possui a especialização exigida (${especializacao})!`,
      };
    }

    const [codigoExist] = await connection.query(
      "SELECT pk_ordemID FROM ordensProducao WHERE codigo = ?",
      [codigo],
    );

    if (codigoExist.length > 0) {
      throw { status: 409, message: "Já existe uma ordem com esse código!" };
    }

    // Agenda antes de gravar, um operador só pode ter uma atividade por dia
    await validarAgendaOperador(connection, {
      profissionalID: operadorID,
      inicio,
      termino,
    });

    // Saldo e situação dos materiais planejados (RN04)
    const materiaisValidos = await validarMateriaisPlanejados(
      connection,
      materiais,
    );

    const [result] = await connection.query(
      `INSERT INTO ordensProducao
        (codigo, fk_pecaID, quantidadePlanejada, especializacao, fk_operadorID, inicioPlanejado, terminoPlanejado)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        codigo,
        pecaID,
        quantidade,
        especializacao,
        operadorID,
        inicio,
        termino,
      ],
    );

    const valoresMateriais = materiaisValidos.map((material) => [
      result.insertId,
      material.materiaID,
      material.quantidadePrevista,
    ]);

    await connection.query(
      `INSERT INTO ordemMateriais
        (fk_ordemID, fk_materiaID, quantidadePrevista)
       VALUES ?`,
      [valoresMateriais],
    );

    await connection.query(
      `INSERT INTO auditoria
        (fk_usuarioID, entidade, entidadeID, acao, dadosNovos, observacao)
       VALUES (?, 'ordem', ?, 'criacao', ?, ?)`,
      [
        usuario.id,
        result.insertId,
        JSON.stringify({
          codigo,
          pecaID,
          quantidadePlanejada: quantidade,
          operadorID,
          inicioPlanejado: inicio,
          terminoPlanejado: termino,
          materiais: materiaisValidos,
        }),
        "Ordem de produção criada",
      ],
    );

    await connection.commit();

    return NextResponse.json({
      message: "Ordem de produção cadastrada com sucesso!",
      id: result.insertId,
    });
  } catch (err) {
    if (connection) await connection.rollback();

    console.log("OS produção POST : ", err);

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

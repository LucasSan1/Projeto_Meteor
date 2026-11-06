import { NextResponse } from "next/server";
import pool from "../../lib/connSql";
import {
  autorizar,
  CARGOS,
  exigirPerfilMecanico,
  garantirTitularidade,
} from "../../utils/authMiddleware";
import { toSqlDatetime } from "../../utils/datetimeSql";
import {
  especializacaoCompativel,
  validarAgendaMecanico,
} from "../../utils/agenda";

// Lista as manutenções programadas com equipamento, máquina e mecânico
// Gestor vê tudo; mecânico vê só as intervenções dele
export async function GET(request) {
  try {
    const usuario = await autorizar(request, [
      CARGOS.GERENTE,
      CARGOS.MECANICO,
    ]);

    const soDoMecanico = usuario.cargo === CARGOS.MECANICO;

    if (soDoMecanico) exigirPerfilMecanico(usuario);

    const filtro = soDoMecanico ? "WHERE mp.fk_mecanicoID = ?" : "";
    const params = soDoMecanico ? [usuario.profissionalID] : [];

    const [result] = await pool.query(
      `
      SELECT
        mp.pk_manutencaoID,
        mp.fk_equipamentoID,
        mp.fk_maquinaID,
        mp.tipoManutencao,
        mp.descricao,
        mp.especializacao,
        mp.fk_mecanicoID,
        mp.inicioPrevisto,
        mp.terminoPrevisto,
        mp.inicioEfetivo,
        mp.conclusaoEfetiva,
        mp.servicosRealizados,
        mp.status,
        CASE
          WHEN mp.status IN ('Programada', 'Em Execução')
           AND mp.terminoPrevisto < NOW()
          THEN 1 ELSE 0
        END AS atrasada,
        e.nomeEquipamento AS equipamento,
        mq.nomeMaquina AS maquina,
        u.nome AS mecanico
      FROM manutencoesProgramadas mp
      INNER JOIN equipamentos e ON mp.fk_equipamentoID = e.pk_equipamentoID
      LEFT JOIN maquinas mq ON mp.fk_maquinaID = mq.pk_maquinaID
      INNER JOIN profissionais prof ON mp.fk_mecanicoID = prof.pk_profissionalID
      INNER JOIN usuarios u ON prof.fk_usuarioID = u.id
      ${filtro}
      ORDER BY mp.inicioPrevisto
    `,
      params,
    );

    return NextResponse.json(
      {
        data: result.map((item) => ({
          ...item,
          atrasada: Boolean(item.atrasada),
        })),
      },
      { status: 200 },
    );
  } catch (err) {
    console.log("Manutencoes GET : ", err);

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
    const usuario = await autorizar(request, [
      CARGOS.GERENTE,
      CARGOS.MECANICO,
    ]);

    if (
      !equipamento ||
      !descricao?.trim() ||
      !especializacao?.trim() ||
      !mecanico ||
      !inicioPrevisto ||
      !terminoPrevisto
    ) {
      throw {
        status: 400,
        message: "Preencha equipamento, descrição, especialização, mecânico e datas!",
      };
    }

    // Gestor agenda pra qualquer mecânico, mecânico agenda só pra si
    if (usuario.cargo === CARGOS.MECANICO) {
      exigirPerfilMecanico(usuario);
      garantirTitularidade(
        usuario,
        mecanico,
        "Você só pode agendar manutenções para você mesmo!",
      );
    }

    const inicio = toSqlDatetime(inicioPrevisto);
    const termino = toSqlDatetime(terminoPrevisto);

    if (new Date(termino) <= new Date(inicio)) {
      throw {
        status: 400,
        message: "O término previsto deve ser depois do início!",
      };
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [equip] = await connection.query(
      "SELECT * FROM equipamentos WHERE pk_equipamentoID = ? AND status = 'Ativo'",
      [equipamento],
    );

    if (equip.length === 0) {
      throw { status: 404, message: "Equipamento não encontrado ou inativo!" };
    }

    if (maquina) {
      const [maq] = await connection.query(
        "SELECT * FROM maquinas WHERE pk_maquinaID = ? AND fk_equipamentoID = ?",
        [maquina, equipamento],
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
      [mecanico],
    );

    if (mec.length === 0) {
      throw {
        status: 404,
        message: "Mecânico não encontrado, inativo ou sem perfil de mecânico!",
      };
    }

    // Mecânico precisa ter especialização compatível com a intervenção
    if (!especializacaoCompativel(especializacao, mec[0].especializacao)) {
      throw {
        status: 400,
        message: `O mecânico selecionado não possui a especialização exigida (${especializacao})!`,
      };
    }

    // Sem sobreposição e sem manutenção em dia de produção do mesmo profissional
    await validarAgendaMecanico(connection, {
      profissionalID: mecanico,
      inicio,
      termino,
    });

    const [result] = await connection.query(
      `INSERT INTO manutencoesProgramadas
        (fk_equipamentoID, fk_maquinaID, tipoManutencao, descricao, especializacao, fk_mecanicoID, inicioPrevisto, terminoPrevisto)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        equipamento,
        maquina || null,
        tipoManutencao || null,
        descricao,
        especializacao,
        mecanico,
        inicio,
        termino,
      ],
    );

    await connection.commit();

    return NextResponse.json({
      message: "Manutenção programada com sucesso!",
      id: result.insertId,
    });
  } catch (err) {
    if (connection) await connection.rollback();

    console.log("Manutencoes POST : ", err);

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

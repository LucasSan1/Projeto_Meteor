import { NextResponse } from "next/server";
import pool from "../../../lib/connSql";
import { checkAuthPosition, CARGOS } from "../../../utils/authChecker";
import { hashPass } from "../../../utils/hash";
import { papeisDoCargo } from "../../../utils/papeisProfissional";

const CARGOS_VALIDOS = Object.values(CARGOS);

async function buscarProfissional(fkUsuarioID) {
  const [rows] = await pool.query(
    "SELECT * FROM profissionais WHERE fk_usuarioID = ?",
    [fkUsuarioID],
  );

  return rows[0] || null;
}

async function garantirSemOrdensAbertas(
  profissionalID,
  contexto = "Resolva antes de desativar!",
) {
  const [ordensAbertas] = await pool.query(
    `SELECT codigo FROM ordensProducao
     WHERE fk_operadorID = ? AND status IN ('Pendente', 'Em Produção')
     LIMIT 1`,
    [profissionalID],
  );

  if (ordensAbertas.length > 0) {
    throw {
      status: 409,
      message: `O usuário ainda tem a ordem ${ordensAbertas[0].codigo} aberta. ${contexto}`,
    };
  }
}

async function garantirSemManutencoesAbertas(
  profissionalID,
  contexto = "Resolva antes de desativar!",
) {
  const [manutencoesAbertas] = await pool.query(
    `SELECT descricao FROM manutencoesProgramadas
     WHERE fk_mecanicoID = ? AND status IN ('Programada', 'Em Execução')
     LIMIT 1`,
    [profissionalID],
  );

  if (manutencoesAbertas.length > 0) {
    throw {
      status: 409,
      message: `O usuário ainda tem a manutenção "${manutencoesAbertas[0].descricao}" aberta. ${contexto}`,
    };
  }
}


async function garantirSemAtividadesAbertas(fkUsuarioID) {
  const profissional = await buscarProfissional(fkUsuarioID);

  if (!profissional) return;

  await garantirSemOrdensAbertas(profissional.pk_profissionalID);
  await garantirSemManutencoesAbertas(profissional.pk_profissionalID);
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const {
    nome,
    email,
    cargo,
    senha,
    status,
    ehOperador,
    ehMecanico,
    especializacao,
    telefone,
  } = body;

  try {
    const usuarioLogado = await checkAuthPosition(request);

    const [exist] = await pool.query(
      "SELECT * FROM usuarios WHERE id = ?",
      [id],
    );

    if (exist.length === 0) {
      throw { status: 404, message: "Usuário não encontrado!" };
    }

    if (cargo && !CARGOS_VALIDOS.includes(cargo)) {
      throw { status: 400, message: "Cargo inválido!" };
    }

    const usuario = exist[0];

    const nomeFinal = nome?.trim() ? nome.trim() : usuario.nome;
    const emailFinal = email?.trim() ? email.trim() : usuario.email;
    const cargoFinal = cargo || usuario.cargo;
    const statusFinal = status || usuario.status;

    // Ninguém desativa a própria conta e fica trancado do lado de fora
    if (Number(id) === Number(usuarioLogado.id) && statusFinal === "Desativado") {
      throw {
        status: 400,
        message: "Você não pode desativar a própria conta!",
      };
    }

    if (Number(id) === Number(usuarioLogado.id) && cargoFinal !== CARGOS.GERENTE) {
      throw {
        status: 400,
        message: "Você não pode remover o próprio acesso de gestor!",
      };
    }

    const profissional = await buscarProfissional(id);

    const viraGestor = cargoFinal === "gerente";
    const perfilFicaAtivo = statusFinal === "Ativo" && !viraGestor;

    if (usuario.status === "Ativo" && statusFinal === "Desativado") {
      await garantirSemAtividadesAbertas(id);
    }


    if (viraGestor && profissional?.status === "Ativo") {
      await garantirSemAtividadesAbertas(id);
    }

    const papeis = viraGestor
      ? null
      : papeisDoCargo(
          cargoFinal,
          ehOperador === undefined ? profissional?.ehOperador : ehOperador,
          ehMecanico === undefined ? profissional?.ehMecanico : ehMecanico,
        );

    // Tirar um papel de quem tem atividade aberta deixa a operação órfã
    if (profissional && papeis) {
      if (profissional.ehOperador && !papeis.operador) {
        await garantirSemOrdensAbertas(
          profissional.pk_profissionalID,
          "Resolva antes de remover o perfil de operador!",
        );
      }

      if (profissional.ehMecanico && !papeis.mecanico) {
        await garantirSemManutencoesAbertas(
          profissional.pk_profissionalID,
          "Resolva antes de remover o perfil de mecânico!",
        );
      }
    }

    const espFinal =
      especializacao !== undefined
        ? especializacao
        : profissional?.especializacao ?? null;

    const telFinal =
      telefone !== undefined ? telefone : profissional?.telefone ?? null;

    // Senha só muda se vier algo; senão mantém o hash atual
    const senhaFinal = senha?.trim() ? await hashPass(senha) : usuario.senha;

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
        "UPDATE usuarios SET nome = ?, email = ?, cargo = ?, senha = ?, status = ? WHERE id = ?",
        [nomeFinal, emailFinal, cargoFinal, senhaFinal, statusFinal, id],
      );

      if (result.affectedRows === 0) {
        throw { status: 400, message: "Não foi possível atualizar o usuário!" };
      }

      if (profissional) {
        if (viraGestor) {
          await connection.query(
            "UPDATE profissionais SET status = 'Desativado' WHERE pk_profissionalID = ?",
            [profissional.pk_profissionalID],
          );
        } else {
          await connection.query(
            `UPDATE profissionais
             SET ehOperador = ?, ehMecanico = ?, especializacao = ?, telefone = ?, status = ?
             WHERE pk_profissionalID = ?`,
            [
              papeis.operador,
              papeis.mecanico,
              espFinal,
              telFinal,
              perfilFicaAtivo ? "Ativo" : "Desativado",
              profissional.pk_profissionalID,
            ],
          );
        }
      } else if (perfilFicaAtivo) {
      
        await connection.query(
          `INSERT INTO profissionais
            (fk_usuarioID, ehOperador, ehMecanico, especializacao, telefone)
           VALUES (?, ?, ?, ?, ?)`,
          [id, papeis.operador, papeis.mecanico, espFinal, telFinal],
        );
      }

      await connection.commit();

      return NextResponse.json(
        { message: `Usuário ${nomeFinal} atualizado!` },
        { status: 200 },
      );
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.log("Usuarios PATCH : ", err);

    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { message: "Já existe um usuário com esse e-mail!" },
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

export async function DELETE(request, { params }) {
  const { id } = await params;

  try {
    const usuarioLogado = await checkAuthPosition(request);

    const [exist] = await pool.query(
      "SELECT * FROM usuarios WHERE id = ?",
      [id],
    );

    if (exist.length === 0) {
      throw { status: 404, message: "Usuário não encontrado!" };
    }

    if (Number(id) === Number(usuarioLogado.id)) {
      throw {
        status: 400,
        message: "Você não pode desativar a própria conta!",
      };
    }

    if (exist[0].status === "Ativo") {
      await garantirSemAtividadesAbertas(id);
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
        "UPDATE usuarios SET status = 'Desativado' WHERE id = ? AND status = 'Ativo'",
        [id],
      );

      await connection.query(
        "UPDATE profissionais SET status = 'Desativado' WHERE fk_usuarioID = ? AND status = 'Ativo'",
        [id],
      );

      await connection.commit();

      if (result.affectedRows === 0) {
        return NextResponse.json(
          { message: "Usuário já desativado!" },
          { status: 200 },
        );
      }

      return NextResponse.json(
        { message: "Usuário desativado com sucesso!" },
        { status: 200 },
      );
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.log("Usuarios DELETE : ", err);

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

export async function PUT(request, { params }) {
  const { id } = await params;

  try {
    await checkAuthPosition(request);

    const [exist] = await pool.query(
      "SELECT * FROM usuarios WHERE id = ?",
      [id],
    );

    if (exist.length === 0) {
      throw { status: 404, message: "Usuário não encontrado!" };
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
        "UPDATE usuarios SET status = 'Ativo' WHERE id = ? AND status = 'Desativado'",
        [id],
      );

      // Só reativa o perfil de quem realmente é alocável
      if (exist[0].cargo !== "gerente") {
        await connection.query(
          "UPDATE profissionais SET status = 'Ativo' WHERE fk_usuarioID = ? AND status = 'Desativado'",
          [id],
        );
      }

      await connection.commit();

      if (result.affectedRows === 0) {
        return NextResponse.json(
          { message: "Usuário já ativo!" },
          { status: 200 },
        );
      }

      return NextResponse.json(
        { message: "Usuário ativado com sucesso!" },
        { status: 200 },
      );
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.log("Usuarios PUT : ", err);

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

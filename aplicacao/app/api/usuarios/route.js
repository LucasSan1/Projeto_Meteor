import { NextResponse } from "next/server";
import pool from "../../lib/connSql";
import { checkAuthPosition, CARGOS } from "../../utils/authChecker";
import { hashPass } from "../../utils/hash";
import { papeisDoCargo } from "../../utils/papeisProfissional";
import { normalizarTelefone } from "../../utils/mascaras";
import { ehDuplicadoDe } from "../../utils/erroDuplicado";

const CARGOS_VALIDOS = Object.values(CARGOS);

// Lista a equipe inteira já com o vínculo profissional e a disponibilidade
export async function GET(request) {
  try {
    const usuarioLogado = await checkAuthPosition(request);

    const [result] = await pool.query(`
      SELECT
        u.id,
        u.nome,
        u.email,
        u.cargo,
        u.status,
        p.pk_profissionalID,
        p.ehOperador,
        p.ehMecanico,
        p.especializacao,
        p.telefone,
        p.status AS statusProfissional,
        EXISTS (
          SELECT 1
          FROM ordensProducao op
          WHERE op.fk_operadorID = p.pk_profissionalID
            AND op.status = 'Em Produção'
        ) AS emProducao,
        EXISTS (
          SELECT 1
          FROM manutencoesProgramadas mp
          WHERE mp.fk_mecanicoID = p.pk_profissionalID
            AND mp.status = 'Em Execução'
        ) AS emManutencao
      FROM usuarios u
      LEFT JOIN profissionais p ON p.fk_usuarioID = u.id
      ORDER BY u.nome
    `);

    // gestor só enxerga a própria conta na seção de gestores
    const data = result.filter(
      (usuario) =>
        usuario.cargo !== CARGOS.GERENTE ||
        Number(usuario.id) === Number(usuarioLogado.id),
    );

    return NextResponse.json(
      {
        data,
        usuarioLogado: {
          id: usuarioLogado.id,
          nome: usuarioLogado.nome,
          email: usuarioLogado.email,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.log("Usuarios GET : ", err);

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

// Cria a conta e o vínculo profissional de uma vez
export async function POST(request) {
  const body = await request.json();
  const {
    nome,
    email,
    cargo,
    ehOperador,
    ehMecanico,
    especializacao,
    telefone,
  } = body;

  try {
    await checkAuthPosition(request);

    if (!nome?.trim() || !email?.trim() || !cargo) {
      throw { status: 400, message: "Preencha nome, e-mail e cargo!" };
    }

    if (!CARGOS_VALIDOS.includes(cargo)) {
      throw { status: 400, message: "Cargo inválido!" };
    }

    const [exist] = await pool.query(
      "SELECT id FROM usuarios WHERE email = ?",
      [email],
    );

    if (exist.length > 0) {
      throw { status: 409, message: "Já existe um usuário com esse e-mail!" };
    }

    if (!process.env.PATTERN_PASS) {
      throw {
        status: 500,
        message: "Senha padrão não configurada no ambiente!",
      };
    }

    const senhaCript = await hashPass(process.env.PATTERN_PASS);
    const papeis = papeisDoCargo(cargo, ehOperador, ehMecanico);

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
        "INSERT INTO usuarios (nome, email, cargo, senha) VALUES (?, ?, ?, ?)",
        [nome.trim(), email.trim(), cargo, senhaCript],
      );

      const usuarioID = result.insertId;

      if (cargo !== "gerente") {
        await connection.query(
          `INSERT INTO profissionais
            (fk_usuarioID, ehOperador, ehMecanico, especializacao, telefone)
           VALUES (?, ?, ?, ?, ?)`,
          [
            usuarioID,
            papeis.operador,
            papeis.mecanico,
            especializacao || null,
            normalizarTelefone(telefone),
          ],
        );
      }

      await connection.commit();

      return NextResponse.json({
        message: "Usuário cadastrado com sucesso!",
        id: usuarioID,
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.log("Usuarios POST : ", err);

    if (err.code === "ER_DUP_ENTRY") {
  
      if (ehDuplicadoDe(err, "telefone")) {
        return NextResponse.json(
          { message: "Já existe um profissional com esse telefone!" },
          { status: 409 },
        );
      }

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

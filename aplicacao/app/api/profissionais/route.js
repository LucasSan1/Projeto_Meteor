import { NextResponse } from "next/server";
import pool from "../../lib/connSql";
import { checkAuthPosition } from "../../utils/authChecker";
import { autorizar, CARGOS } from "../../utils/authMiddleware";

// Lista os profissionais junto com os dados de login (nome, e-mail, cargo)
// Gestor vê todo mundo; operador/mecânico só vê o próprio cadastro
export async function GET(request) {
  try {
    const usuario = await autorizar(request, [
      CARGOS.GERENTE,
      CARGOS.OPERADOR,
      CARGOS.MECANICO,
    ]);

    const soEleMesmo = usuario.cargo !== CARGOS.GERENTE;
    const filtro = soEleMesmo ? "WHERE p.pk_profissionalID = ?" : "";
    const params = soEleMesmo ? [usuario.profissionalID] : [];

    const [result] = await pool.query(
      `
      SELECT
        p.pk_profissionalID,
        p.fk_usuarioID,
        p.ehOperador,
        p.ehMecanico,
        p.especializacao,
        p.telefone,
        p.status,
        u.nome,
        u.email,
        u.cargo
      FROM profissionais p
      INNER JOIN usuarios u ON p.fk_usuarioID = u.id
      ${filtro}
      ORDER BY u.nome
    `,
      params,
    );

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (err) {
    console.log("Profissionais GET : ", err);

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

// Cria o vínculo de profissional pra um usuário já existente
export async function POST(request) {
  const body = await request.json();
  const { usuario, ehOperador, ehMecanico, especializacao, telefone } = body;

  try {
    await checkAuthPosition(request);

    if (!usuario) {
      throw { status: 400, message: "Selecione um usuário!" };
    }

    // Os checkboxes/selects chegam como "1"/"0" (ou true/false)
    const operador = String(ehOperador) === "1" || ehOperador === true ? 1 : 0;
    const mecanico = String(ehMecanico) === "1" || ehMecanico === true ? 1 : 0;

    if (!operador && !mecanico) {
      throw {
        status: 400,
        message: "O profissional precisa ser operador e/ou mecânico!",
      };
    }

    const [user] = await pool.query(
      "SELECT * FROM usuarios WHERE id = ? AND status = 'Ativo'",
      [usuario],
    );

    if (user.length === 0) {
      throw { status: 404, message: "Usuário não encontrado ou inativo!" };
    }

    if (!["operador", "mecanico"].includes(user[0].cargo)) {
      throw {
        status: 400,
        message: "Só usuários com cargo operador ou mecânico podem ser profissionais!",
      };
    }

    const [exist] = await pool.query(
      "SELECT pk_profissionalID FROM profissionais WHERE fk_usuarioID = ?",
      [usuario],
    );

    if (exist.length > 0) {
      throw { status: 409, message: "Esse usuário já é um profissional!" };
    }

    const [result] = await pool.query(
      "INSERT INTO profissionais (fk_usuarioID, ehOperador, ehMecanico, especializacao, telefone) VALUES (?, ?, ?, ?, ?)",
      [usuario, operador, mecanico, especializacao, telefone],
    );

    return NextResponse.json({
      message: "Profissional cadastrado com sucesso!",
      id: result.insertId,
    });
  } catch (err) {
    console.log("Profissionais POST : ", err);

    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { message: "Esse usuário já é um profissional!" },
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

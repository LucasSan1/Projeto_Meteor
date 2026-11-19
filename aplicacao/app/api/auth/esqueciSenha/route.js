import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";

import pool from "../../../lib/connSql";
import { hashPass } from "../../../utils/hash";
import { registrarAuditoria } from "../../../utils/auditoria";

const VALIDADE_MINUTOS = 10;

// Fuso do resto do banco, pra expiração não brigar com o horário de Brasília
const AGORA = "(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')";

const MENSAGEM_GENERICA =
  "Se o email estiver cadastrado, o código de recuperação foi gerado!";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim();

    if (!email) {
      return NextResponse.json(
        { message: "Informe o email!" },
        { status: 400 },
      );
    }

    const [usuarios] = await pool.query(
      "SELECT id, status FROM usuarios WHERE LOWER(email) = LOWER(?) LIMIT 1",
      [email],
    );

    const usuario = usuarios[0];

    if (!usuario || usuario.status !== "Ativo") {
      return NextResponse.json({ message: MENSAGEM_GENERICA }, { status: 200 });
    }

    const codigo = String(randomInt(0, 1000000)).padStart(6, "0");
    const codigoHash = await hashPass(codigo);

    await pool.query(
      `UPDATE recuperacaoSenha
          SET consumidoEm = ${AGORA}
        WHERE fk_usuarioID = ?
          AND consumidoEm IS NULL`,
      [usuario.id],
    );

    const [pedido] = await pool.query(
      `INSERT INTO recuperacaoSenha (fk_usuarioID, codigoHash, expiraEm)
       VALUES (?, ?, ${AGORA} + INTERVAL '${VALIDADE_MINUTOS} minutes')`,
      [usuario.id, codigoHash],
    );

    await registrarAuditoria(pool, {
      usuarioID: usuario.id,
      entidade: "usuario",
      entidadeID: usuario.id,
      acao: "solicitacaoRecuperacao",
      dadosNovos: { recuperacaoID: pedido.insertId },
      observacao: "Código de recuperação de senha solicitado",
    });

    const resposta = { message: MENSAGEM_GENERICA };

    // Num sistema de verdade o código iria por email aqui a entrega é simulada
    if (process.env.MOSTRAR_CODIGO_RESET === "true") {
      resposta.codigo = codigo;
      resposta.validadeMinutos = VALIDADE_MINUTOS;
    }

    return NextResponse.json(resposta, { status: 200 });
  } catch (err) {
    console.log("EsqueciSenha POST : ", err);

    return NextResponse.json(
      { message: "Erro ao gerar o código de recuperação!" },
      { status: 500 },
    );
  }
}

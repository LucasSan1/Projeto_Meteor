import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

import pool from "../../../lib/connSql";
import { hashPass } from "../../../utils/hash";
import { validarSenhaForte } from "../../../utils/senha";
import { normalizarNome } from "../../../utils/normalizarNome";

const MAX_TENTATIVAS = 5;

const AGORA = "(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')";

const MENSAGEM_INVALIDA = "Código ou nome incorretos!";

async function pedidoAtivo(email) {
  const [pedidos] = await pool.query(
    `SELECT
       r.pk_recuperacaoID AS id,
       r.codigoHash AS hash,
       r.tentativas,
       (r.expiraEm > ${AGORA}) AS valido,
       r.fk_usuarioID,
       u.nome
     FROM recuperacaoSenha r
     INNER JOIN usuarios u ON u.id = r.fk_usuarioID
     WHERE LOWER(u.email) = LOWER(?)
       AND u.status = 'Ativo'
       AND r.consumidoEm IS NULL
     ORDER BY r.pk_recuperacaoID DESC
     LIMIT 1`,
    [email],
  );

  return pedidos[0];
}

export async function PUT(request) {
  let connection;

  try {
    const body = await request.json();

    const email = String(body.email ?? "").trim();
    const codigo = String(body.codigo ?? "").trim();
    const nome = String(body.nome ?? "").trim();
    const novaSenha = body.novaSenha ?? "";

    if (!email || !codigo || !nome || !novaSenha) {
      return NextResponse.json(
        { message: "Preencha email, código, nome e a nova senha!" },
        { status: 400 },
      );
    }

    const erroSenha = validarSenhaForte(novaSenha);

    if (erroSenha) {
      return NextResponse.json({ message: erroSenha }, { status: 400 });
    }

    const pedido = await pedidoAtivo(email);

    if (!pedido) {
      return NextResponse.json({ message: MENSAGEM_INVALIDA }, { status: 400 });
    }

    // Venceu o prazo ou estourou as tentativas? Queima o código e manda gerar outro
    if (!pedido.valido || Number(pedido.tentativas) >= MAX_TENTATIVAS) {
      await pool.query(
        `UPDATE recuperacaoSenha SET consumidoEm = ${AGORA} WHERE pk_recuperacaoID = ?`,
        [pedido.id],
      );

      return NextResponse.json({ message: MENSAGEM_INVALIDA }, { status: 400 });
    }

    const codigoConfere =
      codigo.length === 6 && (await bcrypt.compare(codigo, pedido.hash));

    const nomeConfere = normalizarNome(nome) === normalizarNome(pedido.nome);

    if (!codigoConfere || !nomeConfere) {
      const tentativas = Number(pedido.tentativas) + 1;
      const restantes = Math.max(MAX_TENTATIVAS - tentativas, 0);

      await pool.query(
        tentativas >= MAX_TENTATIVAS
          ? `UPDATE recuperacaoSenha SET tentativas = ?, consumidoEm = ${AGORA} WHERE pk_recuperacaoID = ?`
          : "UPDATE recuperacaoSenha SET tentativas = ? WHERE pk_recuperacaoID = ?",
        [tentativas, pedido.id],
      );

      return NextResponse.json(
        {
          message:
            restantes > 0
              ? `${MENSAGEM_INVALIDA} Restam ${restantes} tentativa(s).`
              : `${MENSAGEM_INVALIDA} Gere um novo código.`,
        },
        { status: 400 },
      );
    }

    const senhaCript = await hashPass(novaSenha);

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [consumo] = await connection.query(
      `UPDATE recuperacaoSenha
          SET consumidoEm = ${AGORA}
        WHERE pk_recuperacaoID = ?
          AND consumidoEm IS NULL`,
      [pedido.id],
    );

    if (consumo.affectedRows === 0) {
      await connection.rollback();

      return NextResponse.json({ message: MENSAGEM_INVALIDA }, { status: 400 });
    }

    await connection.query(
      "UPDATE usuarios SET senha = ?, tokenVersao = tokenVersao + 1 WHERE id = ?",
      [senhaCript, pedido.fk_usuarioID],
    );

    await connection.query(
      `INSERT INTO auditoria (fk_usuarioID, entidade, entidadeID, acao, observacao)
       VALUES (?, 'usuario', ?, 'redefinicaoSenha', ?)`,
      [pedido.fk_usuarioID, pedido.fk_usuarioID, "Senha redefinida via recuperação"],
    );

    await connection.commit();

    return NextResponse.json(
      { message: "Senha redefinida com sucesso! Faça login com a nova senha." },
      { status: 200 },
    );
  } catch (err) {
    if (connection) await connection.rollback();

    console.log("RedefinirSenha PUT : ", err);

    return NextResponse.json(
      { message: "Erro ao redefinir a senha!" },
      { status: 500 },
    );
  } finally {
    if (connection) connection.release();
  }
}

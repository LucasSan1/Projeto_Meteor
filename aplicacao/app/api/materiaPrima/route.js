import { NextResponse } from "next/server";
import pool from "../../lib/connSql";
import { checkAuthPosition } from "../../utils/authChecker";
import { validarQuantidade } from "../../utils/quantidade";
import { registrarAuditoria } from "../../utils/auditoria";
import {
  comPaginacao,
  contarLinhas,
  lerPaginacao,
  paramsComPaginacao,
  respostaLista,
} from "../../utils/paginacao";

// Lista as matérias-primas com o nome do fornecedor junto
export async function GET(request) {
  try {
    await checkAuthPosition(request);

    const paginacao = lerPaginacao(request);

    const [result] = await pool.query(
      comPaginacao(
        `
        SELECT
          m.pk_materiaID,
          m.materia,
          m.fk_fornecedor,
          m.unidadeMedida,
          m.estoqueMinimo,
          m.quantidadeEstoque,
          m.dataUltimaCompra,
          m.status,
          f.nomeFornecedor AS fornecedor,
          f.status AS fornecedorStatus
        FROM materiasPrimas m
        INNER JOIN fornecedores f ON m.fk_fornecedor = f.pk_fornecedorID
        ORDER BY m.materia
      `,
        paginacao,
      ),
      paramsComPaginacao([], paginacao),
    );

    const total = paginacao
      ? await contarLinhas(
          pool,
          `SELECT COUNT(*) AS total
             FROM materiasPrimas m
             INNER JOIN fornecedores f ON m.fk_fornecedor = f.pk_fornecedorID`,
        )
      : null;

    return NextResponse.json(respostaLista(result, paginacao, total), {
      status: 200,
    });
  } catch (err) {
    console.log("Materia GET : ", err);

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

// Cadastra uma nova matéria-prima
export async function POST(request) {
  const body = await request.json();
  const {
    materia,
    fornecedor,
    unidadeMedida,
    estoqueMinimo,
    quantidadeEstoque,
    dataUltimaCompra,
  } = body;

  try {
    const usuario = await checkAuthPosition(request);

    if (!materia?.trim() || !fornecedor || !unidadeMedida?.trim()) {
      throw {
        status: 400,
        message: "Preencha nome, fornecedor e unidade de medida!",
      };
    }

    const [searchSup] = await pool.query(
      "SELECT * FROM fornecedores WHERE pk_fornecedorID = ? AND status = 'Ativo'",
      [fornecedor],
    );

    if (searchSup.length === 0) {
      throw { status: 404, message: "Fornecedor não encontrado ou inativo!" };
    }

    // Valida antes do INSERT pra não tomar 500 dos CHECKs de estoque do DDL
    const minimoFinal = validarQuantidade(estoqueMinimo, "Estoque mínimo");
    const quantidadeFinal = validarQuantidade(
      quantidadeEstoque,
      "Quantidade em estoque",
    );

    const [result] = await pool.query(
      `INSERT INTO materiasPrimas
        (materia, fk_fornecedor, unidadeMedida, estoqueMinimo, quantidadeEstoque, dataUltimaCompra)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        materia,
        fornecedor,
        unidadeMedida,
        minimoFinal,
        quantidadeFinal,
        dataUltimaCompra || null,
      ],
    );

    await registrarAuditoria(pool, {
      usuarioID: usuario.id,
      entidade: "materiaPrima",
      entidadeID: result.insertId,
      acao: "criacao",
      dadosNovos: {
        materia,
        fornecedor,
        unidadeMedida,
        estoqueMinimo: minimoFinal,
        quantidadeEstoque: quantidadeFinal,
        dataUltimaCompra: dataUltimaCompra || null,
      },
      observacao: "Matéria-prima cadastrada",
    });

    return NextResponse.json({
      message: "Matéria-prima cadastrada com sucesso!",
      id: result.insertId,
    });
  } catch (err) {
    console.log("Materia POST : ", err);

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

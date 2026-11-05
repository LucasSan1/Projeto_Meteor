import { NextResponse } from "next/server";
import pool from "../../lib/connSql";
import { checkAuthPosition } from "../../utils/authChecker";
import { validarQuantidade } from "../../utils/quantidade";

// Lista as matérias-primas com o nome do fornecedor junto
export async function GET(request) {
  try {
    await checkAuthPosition(request);

    const [result] = await pool.query(`
      SELECT
        m.pk_materiaID,
        m.materia,
        m.fk_fornecedor,
        m.unidadeMedida,
        m.estoqueMinimo,
        m.quantidadeEstoque,
        m.dataUltimaCompra,
        m.status,
        f.nomeFornecedor AS fornecedor
      FROM materiasPrimas m
      INNER JOIN fornecedores f ON m.fk_fornecedor = f.pk_fornecedorID
      ORDER BY m.materia
    `);

    return NextResponse.json({ data: result }, { status: 200 });
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
    await checkAuthPosition(request);

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

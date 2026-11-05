import { NextResponse } from "next/server";
import pool from "../../../lib/connSql";
import { checkAuthPosition } from "../../../utils/authChecker";
import { validarQuantidade } from "../../../utils/quantidade";

export async function PATCH(request, { params }) {
  const { id } = await params;
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
    checkAuthPosition(request);

    const [exist] = await pool.query(
      "SELECT * FROM materiasPrimas WHERE pk_materiaID = ? AND status = 'Ativo'",
      [id],
    );

    if (exist.length === 0) {
      throw { status: 404, message: "Matéria-prima não encontrada ou inativa!" };
    }

    const atual = exist[0];

    const materiaFinal = materia?.trim() ? materia : atual.materia;
    const fornecedorFinal = fornecedor || atual.fk_fornecedor;
    const unidadeFinal = unidadeMedida?.trim()
      ? unidadeMedida
      : atual.unidadeMedida;

    const minimoFinal = validarQuantidade(
      estoqueMinimo !== undefined && estoqueMinimo !== ""
        ? estoqueMinimo
        : atual.estoqueMinimo,
      "Estoque mínimo",
    );

    const quantidadeFinal = validarQuantidade(
      quantidadeEstoque !== undefined && quantidadeEstoque !== ""
        ? quantidadeEstoque
        : atual.quantidadeEstoque,
      "Quantidade em estoque",
    );

    const dataFinal =
      dataUltimaCompra !== undefined
        ? dataUltimaCompra || null
        : atual.dataUltimaCompra;

    const [forn] = await pool.query(
      "SELECT pk_fornecedorID FROM fornecedores WHERE pk_fornecedorID = ? AND status = 'Ativo'",
      [fornecedorFinal],
    );

    if (forn.length === 0) {
      throw { status: 404, message: "Fornecedor inválido!" };
    }

    const [result] = await pool.query(
      `UPDATE materiasPrimas
       SET materia = ?, fk_fornecedor = ?, unidadeMedida = ?, estoqueMinimo = ?, quantidadeEstoque = ?, dataUltimaCompra = ?
       WHERE pk_materiaID = ? AND status = 'Ativo'`,
      [
        materiaFinal,
        fornecedorFinal,
        unidadeFinal,
        minimoFinal,
        quantidadeFinal,
        dataFinal,
        id,
      ],
    );

    if (result.affectedRows === 0) {
      throw { status: 400, message: "Não foi possível atualizar o cadastro!" };
    }

    return NextResponse.json(
      { message: `Matéria-prima ${materiaFinal} atualizada!` },
      { status: 200 },
    );
  } catch (err) {
    console.log("Materia PATCH : ", err);

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
    checkAuthPosition(request);

    const [exist] = await pool.query(
      "SELECT * FROM materiasPrimas WHERE pk_materiaID = ?",
      [id],
    );

    if (exist.length === 0) {
      throw { status: 404, message: "Matéria-prima não encontrada!" };
    }

    const [result] = await pool.query(
      "UPDATE materiasPrimas SET status = 'Desativado' WHERE pk_materiaID = ? AND status = 'Ativo'",
      [id],
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: "Matéria-prima já desativada!" },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { message: "Matéria-prima desativada com sucesso!" },
      { status: 200 },
    );
  } catch (err) {
    console.log("Materia DELETE : ", err);

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
    checkAuthPosition(request);

    const [exist] = await pool.query(
      "SELECT * FROM materiasPrimas WHERE pk_materiaID = ?",
      [id],
    );

    if (exist.length === 0) {
      throw { status: 404, message: "Matéria-prima não encontrada!" };
    }

    const [result] = await pool.query(
      "UPDATE materiasPrimas SET status = 'Ativo' WHERE pk_materiaID = ? AND status = 'Desativado'",
      [id],
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: "Matéria-prima já ativa!" },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { message: "Matéria-prima ativada com sucesso!" },
      { status: 200 },
    );
  } catch (err) {
    console.log("Materia PUT : ", err);

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

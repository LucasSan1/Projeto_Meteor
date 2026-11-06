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
    await checkAuthPosition(request);

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

    // Depois que o material entra no livro-razão, origem e unidade ficam congeladas
    const [movimentacoes] = await pool.query(
      "SELECT COUNT(*) AS total FROM movimentacoesEstoque WHERE fk_materiaID = ?",
      [id],
    );

    const temMovimentacao = Number(movimentacoes[0].total) > 0;

    if (temMovimentacao) {
      if (unidadeFinal !== atual.unidadeMedida) {
        throw {
          status: 400,
          message: "A unidade de medida não pode mudar depois de movimentações!",
        };
      }

      if (Number(fornecedorFinal) !== Number(atual.fk_fornecedor)) {
        throw {
          status: 400,
          message: "O fornecedor não pode mudar depois de movimentações!",
        };
      }
    }

    // Saldo é coisa de movimentação, não de edição de cadastro
    // Se o front mandar um valor diferente, avisa em vez de deixar passar batido
    const quantidadeInformada =
      quantidadeEstoque !== undefined && quantidadeEstoque !== ""
        ? validarQuantidade(quantidadeEstoque, "Quantidade em estoque")
        : null;

    if (
      quantidadeInformada !== null &&
      Number(quantidadeInformada) !== Number(atual.quantidadeEstoque)
    ) {
      throw {
        status: 400,
        message:
          "O saldo só pode ser ajustado pela tela de movimentações de estoque!",
      };
    }

    const minimoFinal = validarQuantidade(
      estoqueMinimo !== undefined && estoqueMinimo !== ""
        ? estoqueMinimo
        : atual.estoqueMinimo,
      "Estoque mínimo",
    );

    const quantidadeFinal = validarQuantidade(
      atual.quantidadeEstoque,
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
    await checkAuthPosition(request);

    const [exist] = await pool.query(
      "SELECT * FROM materiasPrimas WHERE pk_materiaID = ?",
      [id],
    );

    if (exist.length === 0) {
      throw { status: 404, message: "Matéria-prima não encontrada!" };
    }

    // Material em ordem aberta não pode sumir do mapa
    const [ordensAbertas] = await pool.query(
      `SELECT op.codigo
       FROM ordemMateriais om
       INNER JOIN ordensProducao op ON op.pk_ordemID = om.fk_ordemID
       WHERE om.fk_materiaID = ?
         AND op.status IN ('Pendente', 'Em Produção')
       LIMIT 1`,
      [id],
    );

    if (ordensAbertas.length > 0) {
      throw {
        status: 409,
        message: `A matéria-prima está em uso pela ordem ${ordensAbertas[0].codigo}. Resolva a ordem antes de desativar!`,
      };
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
    await checkAuthPosition(request);

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

import { describe, expect, it } from "vitest";

import { GET as dashboard } from "../../app/api/dashboard/route";
import {
  POST as criarFornecedor,
  GET as listarFornecedores,
} from "../../app/api/fornecedores/route";
import {
  DELETE as desativarFornecedor,
  PUT as ativarFornecedor,
} from "../../app/api/fornecedores/[id]/route";
import { POST as criarMateria } from "../../app/api/materiaPrima/route";
import {
  DELETE as desativarMateria,
  PATCH as editarMateria,
  PUT as ativarMateria,
} from "../../app/api/materiaPrima/[id]/route";
import { POST as movimentarEstoque } from "../../app/api/movimentacoesEstoque/route";
import { diaBrasilia } from "../apoio/datas";
import { chamar, tokenDe } from "./apoio/api";
import { um } from "./apoio/banco";
import { EMAILS, contar } from "./apoio/dados";

// CT01 - Com PostgreSQL em produção (banco separado só para testes): constraints, vínculos e movimentações
describe("CT01 - fornecedores, matérias-primas e estoque", () => {
  it("RN01 - bloqueia dois fornecedores com o mesmo CNPJ", async () => {
    const token = await tokenDe(EMAILS.gerente);

    const fornecedor = {
      nome: "Fornecedor Repetido",
      cnpj: "99.999.999/0001-99",
      endereco: "Rua do Teste, 100",
      contato: "(11) 99999-0000",
      avaliacao: 8.5,
    };

    const primeira = await chamar(criarFornecedor, {
      method: "POST",
      path: "/api/fornecedores",
      body: fornecedor,
      token,
    });

    expect(primeira.status).toBe(200);

    // Mesmo CNPJ com máscara diferente: o banco guarda só dígitos
    const segunda = await chamar(criarFornecedor, {
      method: "POST",
      path: "/api/fornecedores",
      body: { ...fornecedor, cnpj: "99999999000199" },
      token,
    });

    expect(segunda.status).toBe(409);
    expect(segunda.body.message).toMatch(/já existe um fornecedor com esse CNPJ/i);

    expect(
      await contar("SELECT COUNT(*) FROM fornecedores WHERE cnpj = $1", [
        "99999999000199",
      ]),
    ).toBe(1);
  });

  it("RN01 - exige CNPJ com 14 dígitos e avaliação até 9.9", async () => {
    const token = await tokenDe(EMAILS.gerente);

    const base = {
      nome: "Fornecedor Inválido",
      endereco: "Rua X, 1",
      contato: "(11) 90000-0000",
    };

    const cnpjCurto = await chamar(criarFornecedor, {
      method: "POST",
      path: "/api/fornecedores",
      body: { ...base, cnpj: "1234567890123" },
      token,
    });

    expect(cnpjCurto.status).toBe(400);
    expect(cnpjCurto.body.message).toMatch(/14 dígitos/);

    const notaDez = await chamar(criarFornecedor, {
      method: "POST",
      path: "/api/fornecedores",
      body: {
        ...base,
        cnpj: "88888888000188",
        avaliacao: 10,
      },
      token,
    });

    expect(notaDez.status).toBe(400);
    expect(notaDez.body.message).toMatch(/0 e 9\.9/);
  });

  it("RN03 - não cadastra matéria-prima com fornecedor inativo ou mínimo negativo", async () => {
    const token = await tokenDe(EMAILS.gerente);

    const fornecedorInativo = await chamar(criarMateria, {
      method: "POST",
      path: "/api/materiaPrima",
      body: {
        materia: "Material órfão",
        fornecedor: 5,
        unidadeMedida: "kg",
        estoqueMinimo: 0,
        quantidadeEstoque: 0,
      },
      token,
    });

    expect(fornecedorInativo.status).toBe(404);
    expect(fornecedorInativo.body.message).toMatch(/fornecedor.*inativo/i);

    const minimoNegativo = await chamar(criarMateria, {
      method: "POST",
      path: "/api/materiaPrima",
      body: {
        materia: "Material negativo",
        fornecedor: 1,
        unidadeMedida: "kg",
        estoqueMinimo: -1,
        quantidadeEstoque: 0,
      },
      token,
    });

    expect(minimoNegativo.status).toBe(400);
    expect(minimoNegativo.body.message).toMatch(/não pode ser negativo/);
  });

  it("RN03/RF03 - entrada atualiza o saldo, o livro-razão e a última compra", async () => {
    const token = await tokenDe(EMAILS.gerente);

    const antes = await um(
      "SELECT quantidadeestoque::text AS saldo FROM materiasprimas WHERE pk_materiaid = 1",
    );

    const entrada = await chamar(movimentarEstoque, {
      method: "POST",
      path: "/api/movimentacoesEstoque",
      body: {
        materia: 1,
        tipo: "Entrada",
        quantidade: 10.5,
        unidadeMedida: "kg",
        observacao: "Reposição do teste",
      },
      token,
    });

    expect(entrada.status).toBe(200);

    const depois = await um(
      "SELECT quantidadeestoque::text AS saldo, dataultimacompra::text AS ultima FROM materiasprimas WHERE pk_materiaid = 1",
    );

    expect(Number(depois.saldo)).toBe(Number(antes.saldo) + 10.5);
    expect(depois.ultima).toBe(diaBrasilia(0));

    const movimento = await um(
      `SELECT tipo, quantidade::text AS quantidade, unidademedida, observacao
         FROM movimentacoesestoque
        WHERE fk_materiaid = 1
        ORDER BY pk_movimentacaoid DESC
        LIMIT 1`,
    );

    expect(movimento).toMatchObject({
      tipo: "Entrada",
      quantidade: "10.500",
      unidademedida: "kg",
      observacao: "Reposição do teste",
    });
  });

  it("RN03 - recusa entrada com quantidade inválida, unidade errada ou fornecedor inativo", async () => {
    const token = await tokenDe(EMAILS.gerente);

    const zero = await chamar(movimentarEstoque, {
      method: "POST",
      path: "/api/movimentacoesEstoque",
      body: { materia: 1, tipo: "Entrada", quantidade: 0, unidadeMedida: "kg" },
      token,
    });

    expect(zero.status).toBe(400);

    const unidadeErrada = await chamar(movimentarEstoque, {
      method: "POST",
      path: "/api/movimentacoesEstoque",
      body: { materia: 1, tipo: "Entrada", quantidade: 1, unidadeMedida: "un" },
      token,
    });

    expect(unidadeErrada.status).toBe(400);
    expect(unidadeErrada.body.message).toMatch(/unidade/);

    // Material 5 continua ativo, mas o fornecedor 5 está desativado
    const fornecedorInativo = await chamar(movimentarEstoque, {
      method: "POST",
      path: "/api/movimentacoesEstoque",
      body: { materia: 5, tipo: "Entrada", quantidade: 1, unidadeMedida: "L" },
      token,
    });

    expect(fornecedorInativo.status).toBe(409);
    expect(fornecedorInativo.body.message).toMatch(/fornecedor ativo/);
  });

  it("RN03 - congela origem e unidade depois da primeira movimentação", async () => {
    const token = await tokenDe(EMAILS.gerente);

    const trocaUnidade = await chamar(editarMateria, {
      method: "PATCH",
      path: "/api/materiaPrima/1",
      params: { id: "1" },
      body: { unidadeMedida: "un" },
      token,
    });

    expect(trocaUnidade.status).toBe(400);
    expect(trocaUnidade.body.message).toMatch(/unidade.*não pode mudar/i);

    const trocaFornecedor = await chamar(editarMateria, {
      method: "PATCH",
      path: "/api/materiaPrima/1",
      params: { id: "1" },
      body: { fornecedor: 2 },
      token,
    });

    expect(trocaFornecedor.status).toBe(400);
    expect(trocaFornecedor.body.message).toMatch(/fornecedor.*não pode mudar/i);

    // Mudar só o mínimo, mantendo origem e unidade, continua permitido
    const minimo = await chamar(editarMateria, {
      method: "PATCH",
      path: "/api/materiaPrima/1",
      params: { id: "1" },
      body: { estoqueMinimo: 120 },
      token,
    });

    expect(minimo.status).toBe(200);

    const material = await um(
      "SELECT estoqueminimo::text AS minimo, unidademedida FROM materiasprimas WHERE pk_materiaid = 1",
    );

    expect(Number(material.minimo)).toBe(120);
    expect(material.unidademedida).toBe("kg");
  });

  it("RN03 - bloqueia desativação de material usado por ordem aberta", async () => {
    const token = await tokenDe(EMAILS.gerente);

    const material = await chamar(criarMateria, {
      method: "POST",
      path: "/api/materiaPrima",
      body: {
        materia: "Material preso na ordem",
        fornecedor: 1,
        unidadeMedida: "kg",
        estoqueMinimo: 0,
        quantidadeEstoque: 10,
      },
      token,
    });

    expect(material.status).toBe(200);

    // Ordem 3 é Em Produção no seed
    await um(
      `INSERT INTO ordemmateriais (fk_ordemid, fk_materiaid, quantidadeprevista)
       VALUES ($1, $2, $3)`,
      [3, material.body.id, 1],
    );

    const bloqueio = await chamar(desativarMateria, {
      method: "DELETE",
      path: `/api/materiaPrima/${material.body.id}`,
      params: { id: String(material.body.id) },
      token,
    });

    expect(bloqueio.status).toBe(409);
    expect(bloqueio.body.message).toMatch(/OP-2026-003/);
  });

  it("RN03/RN02 - desativação preserva histórico e vínculos", async () => {
    const token = await tokenDe(EMAILS.gerente);

    const material = await chamar(criarMateria, {
      method: "POST",
      path: "/api/materiaPrima",
      body: {
        materia: "Material histórico",
        fornecedor: 1,
        unidadeMedida: "kg",
        estoqueMinimo: 0,
        quantidadeEstoque: 5,
      },
      token,
    });

    const materiaID = material.body.id;

    await chamar(movimentarEstoque, {
      method: "POST",
      path: "/api/movimentacoesEstoque",
      body: {
        materia: materiaID,
        tipo: "Entrada",
        quantidade: 2,
        unidadeMedida: "kg",
      },
      token,
    });

    const desativacao = await chamar(desativarMateria, {
      method: "DELETE",
      path: `/api/materiaPrima/${materiaID}`,
      params: { id: String(materiaID) },
      token,
    });

    expect(desativacao.status).toBe(200);

    const materialDepois = await um(
      "SELECT status FROM materiasprimas WHERE pk_materiaid = $1",
      [materiaID],
    );

    expect(materialDepois.status).toBe("Desativado");

    // O livro-razão continua lá, com o vínculo preservado
    expect(
      await contar(
        "SELECT COUNT(*) FROM movimentacoesestoque WHERE fk_materiaid = $1",
        [materiaID],
      ),
    ).toBe(1);

    const novaEntrada = await chamar(movimentarEstoque, {
      method: "POST",
      path: "/api/movimentacoesEstoque",
      body: {
        materia: materiaID,
        tipo: "Entrada",
        quantidade: 1,
        unidadeMedida: "kg",
      },
      token,
    });

    expect(novaEntrada.status).toBe(400);
    expect(novaEntrada.body.message).toMatch(/inativa/);

    const reativacao = await chamar(ativarMateria, {
      method: "PUT",
      path: `/api/materiaPrima/${materiaID}`,
      params: { id: String(materiaID) },
      token,
    });

    expect(reativacao.status).toBe(200);
  });

  it("RN02/RN03 - desativar fornecedor não apaga as matérias-primas", async () => {
    const token = await tokenDe(EMAILS.gerente);

    const desativacao = await chamar(desativarFornecedor, {
      method: "DELETE",
      path: "/api/fornecedores/3",
      params: { id: "3" },
      token,
    });

    expect(desativacao.status).toBe(200);

    const fornecedor = await um(
      "SELECT status FROM fornecedores WHERE pk_fornecedorid = 3",
    );

    expect(fornecedor.status).toBe("Desativado");

    const material = await um(
      "SELECT fk_fornecedor, status FROM materiasprimas WHERE pk_materiaid = 3",
    );

    expect(material).toMatchObject({ fk_fornecedor: 3, status: "Ativo" });

    // Com o fornecedor inativo, entrada nova fica barrada
    const entrada = await chamar(movimentarEstoque, {
      method: "POST",
      path: "/api/movimentacoesEstoque",
      body: { materia: 3, tipo: "Entrada", quantidade: 1, unidadeMedida: "kg" },
      token,
    });

    expect(entrada.status).toBe(409);

    const reativacao = await chamar(ativarFornecedor, {
      method: "PUT",
      path: "/api/fornecedores/3",
      params: { id: "3" },
      token,
    });

    expect(reativacao.status).toBe(200);
  });

  it("RN11 - o dashboard conta os materiais no limite ou abaixo do mínimo", async () => {
    const token = await tokenDe(EMAILS.gerente);

    const { status, body } = await chamar(dashboard, {
      token,
      path: "/api/dashboard",
    });

    expect(status).toBe(200);

    const esperado = await contar(
      `SELECT COUNT(*)
         FROM materiasprimas
        WHERE status = 'Ativo' AND quantidadeestoque <= estoqueminimo`,
    );

    const ativos = await contar(
      "SELECT COUNT(*) FROM materiasprimas WHERE status = 'Ativo'",
    );

    expect(body.data.estoque.estoqueBaixo).toBe(esperado);
    expect(body.data.estoque.materias).toBe(ativos);
    expect(esperado).toBeGreaterThanOrEqual(2);
  });

  it("RN01 - listagem de fornecedores devolve o CNPJ sem máscara", async () => {
    const token = await tokenDe(EMAILS.gerente);

    const { status, body } = await chamar(listarFornecedores, {
      token,
      path: "/api/fornecedores",
    });

    expect(status).toBe(200);

    const fornecedor = body.data.find((item) => item.pk_fornecedorID === 1);

    expect(fornecedor.cnpj).toBe("11222333000181");
  });
});

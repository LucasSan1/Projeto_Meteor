import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";

import { GET as listarAuditoria } from "../../app/api/auditoria/route";
import {
  POST as login,
  PUT as trocarSenha,
} from "../../app/api/auth/login/route";
import {
  GET as listarFornecedores,
  POST as criarFornecedor,
} from "../../app/api/fornecedores/route";
import {
  GET as listarOrdens,
} from "../../app/api/osProducao/route";
import { PUT as mudarStatusOrdem } from "../../app/api/osProducao/[id]/route";
import { PATCH as editarUsuario } from "../../app/api/usuarios/[id]/route";
import { chamar, tokenDe } from "./apoio/api";
import { consultar } from "./apoio/banco";
import { EMAILS, SENHA_SEED, contar, usuarioPorEmail } from "./apoio/dados";

const SENHA_NOVA = "NovaSenha@2026";

function corpoFornecedor(cnpj = "77777777000177") {
  return {
    nome: "Fornecedor da Auditoria",
    cnpj,
    endereco: "Rua da Segurança, 42",
    contato: "(11) 97777-0042",
    avaliacao: 8,
  };
}

// CT06 - Autenticação, autorização e auditoria exercitadas no banco real
describe("CT06 - segurança, auditoria e paginação", () => {
  it("RNF01 - barra acesso sem token, com token inválido ou expirado", async () => {
    const semToken = await chamar(listarFornecedores, {
      path: "/api/fornecedores",
    });

    expect(semToken.status).toBe(401);
    expect(semToken.body.message).toMatch(/token não informado/i);

    const invalido = await chamar(listarFornecedores, {
      path: "/api/fornecedores",
      token: "token-de-festival",
    });

    expect(invalido.status).toBe(401);

    const expirado = jwt.sign(
      { email: EMAILS.gerente, cargo: "gerente", versao: 0 },
      process.env.JWT_SECRET,
      { algorithm: "HS256", expiresIn: "-1s" },
    );

    const resposta = await chamar(listarFornecedores, {
      path: "/api/fornecedores",
      token: expirado,
    });

    expect(resposta.status).toBe(401);
    expect(resposta.body.message).toMatch(/expirado/i);
  });

  it("RNF01 - operador não entra em módulo de gestor nem mexe em ordem alheia", async () => {
    const token = await tokenDe(EMAILS.irinel);

    const auditoria = await chamar(listarAuditoria, {
      token,
      path: "/api/auditoria",
    });

    expect(auditoria.status).toBe(403);
    expect(auditoria.body.message).toMatch(/acesso negado/i);

    const fornecedor = await chamar(criarFornecedor, {
      method: "POST",
      path: "/api/fornecedores",
      token,
      body: corpoFornecedor(),
    });

    expect(fornecedor.status).toBe(403);

    expect(
      await contar(
        "SELECT COUNT(*) FROM fornecedores WHERE cnpj = $1",
        ["77777777000177"],
      ),
    ).toBe(0);

    // Ordem 3 é do Fulano
    const ordemAlheia = await chamar(mudarStatusOrdem, {
      method: "PUT",
      path: "/api/osProducao/3",
      params: { id: "3" },
      token,
      body: { status: "Concluída" },
    });

    expect(ordemAlheia.status).toBe(403);
    expect(ordemAlheia.body.message).toMatch(/não está atribuída/i);
  });

  it("RNF01 - troca de senha derruba o token antigo e exige senha forte", async () => {
    const tokenAntigo = await tokenDe(EMAILS.irinel);

    const fraca = await chamar(trocarSenha, {
      method: "PUT",
      path: "/api/auth/login",
      token: tokenAntigo,
      body: { senhaAtual: SENHA_SEED, novaSenha: "abc123" },
    });

    expect(fraca.status).toBe(400);
    expect(fraca.body.message).toMatch(/letra, número e caractere especial/i);

    const troca = await chamar(trocarSenha, {
      method: "PUT",
      path: "/api/auth/login",
      token: tokenAntigo,
      body: { senhaAtual: SENHA_SEED, novaSenha: SENHA_NOVA },
    });

    expect(troca.status).toBe(200);
    expect(troca.body.token).toBeTruthy();
    expect(troca.body.primeiroAcesso).toBe(false);

    const comTokenAntigo = await chamar(listarFornecedores, {
      path: "/api/fornecedores",
      token: tokenAntigo,
    });

    expect(comTokenAntigo.status).toBe(401);
    expect(comTokenAntigo.body.message).toMatch(/sessão expirada/i);

    const comTokenNovo = await chamar(listarOrdens, {
      path: "/api/osProducao",
      token: troca.body.token,
    });

    expect(comTokenNovo.status).toBe(200);

    const usuario = await usuarioPorEmail(EMAILS.irinel);

    expect(usuario.primeiroacesso).toBe(false);
    expect(usuario.tokenversao).toBe(1);

    // A senha antiga não loga mais e a nova sim
    const loginAntigo = await chamar(login, {
      method: "POST",
      path: "/api/auth/login",
      body: { email: EMAILS.irinel, senha: SENHA_SEED },
    });

    expect(loginAntigo.status).toBe(401);

    const loginNovo = await chamar(login, {
      method: "POST",
      path: "/api/auth/login",
      body: { email: EMAILS.irinel, senha: SENHA_NOVA },
    });

    expect(loginNovo.status).toBe(200);
    expect(loginNovo.body.cargo).toBe("operador");
  });

  it("RNF01 - conta inativa não loga e o token antigo perde acesso", async () => {
    const tokenAntigo = await tokenDe(EMAILS.fulano);

    await consultar(
      "UPDATE usuarios SET status = 'Desativado' WHERE email = $1",
      [EMAILS.fulano],
    );

    const loginInativo = await chamar(login, {
      method: "POST",
      path: "/api/auth/login",
      body: { email: EMAILS.fulano, senha: SENHA_SEED },
    });

    expect(loginInativo.status).toBe(401);
    expect(loginInativo.body.message).toMatch(/usuario ou senha invalidos/i);

    const acesso = await chamar(listarOrdens, {
      path: "/api/osProducao",
      token: tokenAntigo,
    });

    expect(acesso.status).toBe(403);
    expect(acesso.body.message).toMatch(/conta desativada/i);
  });

  it("RNF01 - gestor não desativa a própria conta nem perde o próprio acesso", async () => {
    const gerente = await usuarioPorEmail(EMAILS.gerente);
    const token = await tokenDe(EMAILS.gerente);

    const desativar = await chamar(editarUsuario, {
      method: "PATCH",
      path: `/api/usuarios/${gerente.id}`,
      params: { id: String(gerente.id) },
      token,
      body: { status: "Desativado" },
    });

    expect(desativar.status).toBe(400);
    expect(desativar.body.message).toMatch(/própria conta/i);

    const rebaixar = await chamar(editarUsuario, {
      method: "PATCH",
      path: `/api/usuarios/${gerente.id}`,
      params: { id: String(gerente.id) },
      token,
      body: { cargo: "operador" },
    });

    expect(rebaixar.status).toBe(400);
    expect(rebaixar.body.message).toMatch(/próprio acesso de gestor/i);

    const depois = await usuarioPorEmail(EMAILS.gerente);

    expect(depois).toMatchObject({ cargo: "gerente", status: "Ativo" });
  });

  it("RNF02 - auditoria guarda autor, data, ação e alteração sem credenciais", async () => {
    const token = await tokenDe(EMAILS.gerente);

    const criacao = await chamar(criarFornecedor, {
      method: "POST",
      path: "/api/fornecedores",
      token,
      body: corpoFornecedor(),
    });

    expect(criacao.status).toBe(200);

    const { status, body } = await chamar(listarAuditoria, {
      token,
      path: "/api/auditoria?limit=10",
    });

    expect(status).toBe(200);

    const registro = body.data.find(
      (item) =>
        item.entidade === "fornecedor" && item.entidadeID === criacao.body.id,
    );

    expect(registro).toBeTruthy();
    expect(registro).toMatchObject({
      usuario: "Naldo Benni",
      acao: "criacao",
      observacao: "Fornecedor cadastrado",
    });

    expect(registro.dataAcao).toBeTruthy();
    expect(registro.dadosNovos).toMatchObject({
      nome: "Fornecedor da Auditoria",
      cnpj: "77777777000177",
    });

    // Nem hash, nem campo de senha podem vazar na trilha
    const serializado = JSON.stringify(body);

    expect(serializado).not.toContain("$2b$");
    expect(serializado).not.toMatch(/"senha"/i);
    expect(serializado).not.toContain(SENHA_SEED);
    expect(serializado).not.toContain(SENHA_NOVA);
  });

  it("RNF03 - paginação da auditoria devolve página e total coerentes", async () => {
    const token = await tokenDe(EMAILS.gerente);

    const total = await contar("SELECT COUNT(*) FROM auditoria");

    const primeira = await chamar(listarAuditoria, {
      token,
      path: "/api/auditoria?limit=2&page=1",
    });

    const segunda = await chamar(listarAuditoria, {
      token,
      path: "/api/auditoria?limit=2&page=2",
    });

    expect(primeira.status).toBe(200);
    expect(segunda.status).toBe(200);

    expect(primeira.body.data).toHaveLength(2);
    expect(segunda.body.data).toHaveLength(2);

    expect(primeira.body.paginacao).toMatchObject({
      pagina: 1,
      limite: 2,
      total,
      totalPaginas: Math.max(Math.ceil(total / 2), 1),
    });

    expect(segunda.body.paginacao.pagina).toBe(2);

    const idsPrimeira = primeira.body.data.map((item) => item.pk_auditoriaID);
    const idsSegunda = segunda.body.data.map((item) => item.pk_auditoriaID);

    expect(idsPrimeira.some((id) => idsSegunda.includes(id))).toBe(false);
  });

  it("RNF05 - cadastros simultâneos com o mesmo CNPJ não duplicam", async () => {
    const token = await tokenDe(EMAILS.gerente);

    const [primeira, segunda] = await Promise.all([
      chamar(criarFornecedor, {
        method: "POST",
        path: "/api/fornecedores",
        token,
        body: corpoFornecedor("88888888000188"),
      }),
      chamar(criarFornecedor, {
        method: "POST",
        path: "/api/fornecedores",
        token,
        body: corpoFornecedor("88888888000188"),
      }),
    ]);

    expect([primeira.status, segunda.status].sort()).toEqual([200, 409]);
    expect(
      await contar("SELECT COUNT(*) FROM fornecedores WHERE cnpj = $1", [
        "88888888000188",
      ]),
    ).toBe(1);
  });

  // Navegador, backup e revisão de camadas não rodam no CI
  it.skip("funciona em Chrome, Firefox e Edge, inclusive no móvel - requer execução manual", () => {});

  it.skip("restaura backup dentro da janela definida - requer ambiente de backup", () => {});

  it.skip("confronta a separação entre interface, regras e persistência - requer revisão do repositório", () => {});
});

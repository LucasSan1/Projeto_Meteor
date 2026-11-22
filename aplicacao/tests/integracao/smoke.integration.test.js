import { describe, expect, it } from "vitest";

import { GET as listarFornecedores } from "../../app/api/fornecedores/route";
import { chamar, tokenDe } from "./apoio/api";
import { EMAILS, contar, usuarioPorEmail } from "./apoio/dados";

// Cortina de fumaça, confirma que o banco de teste está seedado e que a rota responde
// Pra não cagar com o banco real em produção, não há testes de escrita aqui, só leitura
describe("conexão com o banco de teste", () => {
  it("tem o seed aplicado", async () => {
    expect(await contar("SELECT COUNT(*) FROM usuarios")).toBe(5);
    expect(await contar("SELECT COUNT(*) FROM ordensproducao")).toBe(8);
  });

  it("lista fornecedores autenticando como gerente", async () => {
    const usuario = await usuarioPorEmail(EMAILS.gerente);
    const token = await tokenDe(EMAILS.gerente);

    const { status, body } = await chamar(listarFornecedores, {
      token,
      path: "/api/fornecedores",
    });

    expect(usuario.cargo).toBe("gerente");
    expect(status).toBe(200);
    expect(body.data).toHaveLength(5);
  });
});

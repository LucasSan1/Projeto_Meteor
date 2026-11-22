import { describe, expect, it } from "vitest";

import { mascararCnpj, somenteDigitos } from "../app/utils/mascaras";
import { validarQuantidade } from "../app/utils/quantidade";

// CT01 - fornecedores, matérias-primas e estoque
describe("CT01 - fornecedores, matérias-primas e estoque", () => {
  describe("RN01 - CNPJ com 14 dígitos", () => {
    it("remove a máscara e mantém só os dígitos", () => {
      expect(somenteDigitos("12.345.678/0001-90")).toBe("12345678000190");
    });

    it("monta a máscara do CNPJ a partir dos dígitos", () => {
      expect(mascararCnpj("12345678000190")).toBe("12.345.678/0001-90");
    });

    it("ignora dígitos além dos 14, porque CNPJ não é CPF com sotaque", () => {
      expect(mascararCnpj("123456780001909999")).toBe("12.345.678/0001-90");
    });

    // A unicidade real é garantida pelo índice do banco
    it.skip("bloqueia dois fornecedores com o mesmo CNPJ - requer banco", () => {});
  });

  describe("RN03 - unidade e estoque mínimo não negativo", () => {
    it("aceita estoque mínimo zero", () => {
      expect(validarQuantidade(0, "Estoque mínimo")).toBe(0);
    });

    it("aceita quantidade fracionada dentro do limite", () => {
      expect(validarQuantidade("12.5", "Quantidade")).toBe(12.5);
    });

    it("rejeita estoque mínimo negativo", () => {
      expect(() => validarQuantidade(-1, "Estoque mínimo")).toThrow(
        /não pode ser negativo/,
      );
    });

    it("rejeita valor que não é número", () => {
      expect(() => validarQuantidade("abc", "Quantidade")).toThrow(/inválido/);
    });

    it("rejeita valor acima do teto do DECIMAL(14,3)", () => {
      expect(() => validarQuantidade(1e12, "Quantidade")).toThrow(/limite/);
    });

    it("trata campo vazio como zero, sem explodir o formulário", () => {
      expect(validarQuantidade("", "Estoque mínimo")).toBe(0);
      expect(validarQuantidade(null, "Estoque mínimo")).toBe(0);
    });
  });

  // Daqui pra baixo a regra mora no SQL e na transação, não em função pura
  it.skip("registra entrada positiva e atualiza saldo e movimentação - requer banco", () => {});

  it.skip("bloqueia exclusão de fornecedor ou material vinculado - requer banco", () => {});

  it.skip("bloqueia desativação de material usado em ordem Pendente ou Em Produção - requer banco", () => {});

  it.skip("exibe alerta quando o saldo fica igual ou abaixo do mínimo (RN11) - requer banco e tela", () => {});

  it.skip("preserva o histórico após desativação - requer banco", () => {});
});

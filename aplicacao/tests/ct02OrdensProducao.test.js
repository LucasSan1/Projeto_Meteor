import { describe, expect, it } from "vitest";

import { gerarProximoCodigoOrdem } from "../app/utils/codigoOrdem";
import { validarJanelaExecucao } from "../app/utils/agenda";
import { diaBrasilia, horaBrasilia } from "./apoio/datas";

// CT02
describe("CT02 - ordens de produção", () => {
  describe("RN05/RF05 - código sequencial da ordem", () => {
    it("começa em 001 quando ainda não existe ordem no ano", () => {
      expect(gerarProximoCodigoOrdem([], 2026)).toBe("OP-2026-001");
    });

    it("continua do maior sequencial do ano, sem se perder com buracos", () => {
      const ordens = [
        { codigo: "OP-2026-001" },
        { codigo: "OP-2026-009" },
        { codigo: "OP-2025-050" },
        { codigo: "XP-2026-100" },
      ];

      expect(gerarProximoCodigoOrdem(ordens, 2026)).toBe("OP-2026-010");
    });

    it("ignora códigos de outro ano", () => {
      expect(
        gerarProximoCodigoOrdem([{ codigo: "OP-2025-123" }], 2026),
      ).toBe("OP-2026-001");
    });

    it("preenche o sequencial com três dígitos", () => {
      expect(
        gerarProximoCodigoOrdem([{ codigo: "OP-2026-099" }], 2026),
      ).toBe("OP-2026-100");
    });

    it("ignora código malformado em vez de gerar NaN", () => {
      expect(
        gerarProximoCodigoOrdem([{ codigo: "OP-2026-abc" }], 2026),
      ).toBe("OP-2026-001");
    });
  });

  describe("RN19/RN08 - janela de execução", () => {
    it("aceita início dentro do dia previsto", () => {
      expect(
        validarJanelaExecucao(diaBrasilia(0), diaBrasilia(0), "ordem"),
      ).toEqual({ inicioAntecipado: false });
    });

    it("bloqueia início antes do previsto sem justificativa", () => {
      expect(() =>
        validarJanelaExecucao(diaBrasilia(1), diaBrasilia(1), "ordem"),
      ).toThrow(/só pode ser iniciada a partir/);
    });

    it("sinaliza antecipação quando o perfil pode justificar", () => {
      expect(
        validarJanelaExecucao(diaBrasilia(1), diaBrasilia(1), "ordem", {
          permitirAntecipacao: true,
        }),
      ).toEqual({ inicioAntecipado: true });
    });

    it("bloqueia início depois do término previsto", () => {
      expect(() =>
        validarJanelaExecucao(diaBrasilia(-1), diaBrasilia(-1), "ordem"),
      ).toThrow(/terminou/);
    });

    it("aceita intervalo com hora quando o relógio está dentro dele", () => {
      expect(
        validarJanelaExecucao(horaBrasilia(0), horaBrasilia(1), "ordem", {
          comHora: true,
        }),
      ).toEqual({ inicioAntecipado: false });
    });

    it("bloqueia intervalo com hora já vencido", () => {
      expect(() =>
        validarJanelaExecucao(horaBrasilia(-1), horaBrasilia(-1), "ordem", {
          comHora: true,
        }),
      ).toThrow(/terminou/);
    });
  });

  // O resto do CT02 depende de SQL, transação e concorrência de verdade
  it.skip("bloqueia código duplicado no cadastro - requer banco", () => {});

  it.skip("bloqueia saldo insuficiente revalidado na hora da escrita - requer banco", () => {});

  it.skip("bloqueia transições inválidas e reabertura de ordem finalizada - requer rotas e banco", () => {});

  it.skip("garante baixa única de estoque em conclusão repetida ou concorrente - requer banco", () => {});

  it.skip("grava estado, consumo, inspeção e baixa na mesma transação - requer banco", () => {});

  it.skip("registra horários efetivos de início e conclusão automaticamente - requer rotas e banco", () => {});
});

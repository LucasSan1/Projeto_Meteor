import { describe, expect, it } from "vitest";

import {
  especializacaoCompativel,
  sobrepoe,
  validarJanelaExecucao,
} from "../app/utils/agenda";
import { horaBrasilia } from "./apoio/datas";

// CT05 - Agendamento, execução e conclusão de manutenção
describe("CT05 - manutenções", () => {
  describe("RN15 - janela do mecânico", () => {
    it("detecta manutenção que invade o horário pedido", () => {
      expect(
        sobrepoe(
          "2026-01-10 09:00:00",
          "2026-01-10 11:00:00",
          "2026-01-10 08:00:00",
          "2026-01-10 10:00:00",
        ),
      ).toBe(true);
    });

    it("aceita manutenção encostada na anterior", () => {
      expect(
        sobrepoe(
          "2026-01-10 10:00:00",
          "2026-01-10 12:00:00",
          "2026-01-10 08:00:00",
          "2026-01-10 10:00:00",
        ),
      ).toBe(false);
    });

    it("não conflita com manutenção de outro dia", () => {
      expect(
        sobrepoe(
          "2026-01-11 08:00:00",
          "2026-01-11 10:00:00",
          "2026-01-10 08:00:00",
          "2026-01-10 10:00:00",
        ),
      ).toBe(false);
    });
  });

  describe("RN16 - mecânico apto", () => {
    it("aceita especialização compatível", () => {
      expect(especializacaoCompativel("Elétrica", "elétrica")).toBe(true);
    });

    it("recusa especialização diferente", () => {
      expect(especializacaoCompativel("Elétrica", "Mecânica")).toBe(false);
    });
  });

  describe("RN19 - início dentro da janela prevista", () => {
    it("aceita início no intervalo previsto", () => {
      expect(
        validarJanelaExecucao(horaBrasilia(0), horaBrasilia(1), "manutenção", {
          comHora: true,
        }),
      ).toEqual({ inicioAntecipado: false });
    });

    it("sinaliza antecipação quando o mecânico pode justificar", () => {
      expect(
        validarJanelaExecucao(horaBrasilia(1), horaBrasilia(2), "manutenção", {
          comHora: true,
          permitirAntecipacao: true,
        }),
      ).toEqual({ inicioAntecipado: true });
    });

    it("bloqueia antecipação sem permissão", () => {
      expect(() =>
        validarJanelaExecucao(horaBrasilia(1), horaBrasilia(2), "manutenção", {
          comHora: true,
        }),
      ).toThrow(/só pode ser iniciada a partir/);
    });

    it("bloqueia início de janela vencida", () => {
      expect(() =>
        validarJanelaExecucao(horaBrasilia(-1), horaBrasilia(-1), "manutenção", {
          comHora: true,
        }),
      ).toThrow(/terminou/);
    });
  });

  // Execução real passa por rota, banco e histórico
  it.skip("agenda manutenção para mecânico apto e livre - requer banco", () => {});

  it.skip("inicia e conclui somente pelo mecânico atribuído - requer rotas e banco", () => {});

  it.skip("grava serviço, custo e horários efetivos na conclusão - requer banco", () => {});

  it.skip("bloqueia custo negativo - requer rota e banco", () => {});

  it.skip("bloqueia início por terceiro - requer rotas e banco", () => {});

  it.skip("bloqueia conclusão sem início - requer rotas e banco", () => {});

  it.skip("bloqueia cancelamento de manutenção em execução - requer rotas e banco", () => {});

  it.skip("bloqueia período já ocupado por outra manutenção - requer banco", () => {});

  it.skip("não duplica histórico em conclusão repetida - requer banco", () => {});

  it.skip("mantém estado e histórico consistentes quando a gravação falha - requer banco", () => {});
});

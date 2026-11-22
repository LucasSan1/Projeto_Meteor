import { describe, expect, it } from "vitest";

import {
  diaDe,
  especializacaoCompativel,
  fimDoDia,
  inicioDoDia,
  listarDias,
  normalizarDataHora,
  sobrepoe,
} from "../app/utils/agenda";

// CT04 - Disponibilidade, jornada, sobreposição e calendário
describe("CT04 - agenda e disponibilidade", () => {
  describe("RN13 - datas e dias de uma atividade", () => {
    it("normaliza data vinda de input para o formato do banco", () => {
      expect(normalizarDataHora("2026-01-01T08:30")).toBe(
        "2026-01-01 08:30:00",
      );
    });

    it("preserva os valores de um objeto Date pelos getters locais", () => {
      expect(normalizarDataHora(new Date(2026, 0, 1, 8, 30, 0))).toBe(
        "2026-01-01 08:30:00",
      );
    });

    it("devolve null para data ausente ou inválida", () => {
      expect(normalizarDataHora(null)).toBeNull();
      expect(normalizarDataHora(new Date("invalida"))).toBeNull();
    });

    it("extrai o dia, o início e o fim do dia", () => {
      expect(diaDe("2026-01-01 08:30:00")).toBe("2026-01-01");
      expect(inicioDoDia("2026-01-01 08:30:00")).toBe("2026-01-01 00:00:00");
      expect(fimDoDia("2026-01-01 08:30:00")).toBe("2026-01-01 23:59:59");
    });
  });

  describe("RN13/RN14 - dias ocupados", () => {
    it("lista um único dia quando início e término são iguais", () => {
      expect(listarDias("2026-01-10", "2026-01-10")).toEqual(["2026-01-10"]);
    });

    it("inclui todos os dias entre início e término", () => {
      expect(listarDias("2026-01-30", "2026-02-02")).toEqual([
        "2026-01-30",
        "2026-01-31",
        "2026-02-01",
        "2026-02-02",
      ]);
    });

    it("devolve lista vazia para período inválido", () => {
      expect(listarDias(null, "2026-01-10")).toEqual([]);
    });

    it("trava em 366 dias pra atividade não virar calendário maia", () => {
      const dias = listarDias("2025-01-01", "2026-12-31");

      expect(dias).toHaveLength(366);
      expect(dias[0]).toBe("2025-01-01");
      expect(dias.at(-1)).toBe("2026-01-01");
    });
  });

  describe("RN15 - sobreposição de horários", () => {
    it("detecta horários que se cruzam", () => {
      expect(
        sobrepoe(
          "2026-01-10 08:00:00",
          "2026-01-10 10:00:00",
          "2026-01-10 09:00:00",
          "2026-01-10 11:00:00",
        ),
      ).toBe(true);
    });

    it("detecta um período dentro do outro", () => {
      expect(
        sobrepoe(
          "2026-01-10 08:00:00",
          "2026-01-10 12:00:00",
          "2026-01-10 09:00:00",
          "2026-01-10 10:00:00",
        ),
      ).toBe(true);
    });

    it("permite períodos adjacentes, porque encostar não é sobrepor", () => {
      expect(
        sobrepoe(
          "2026-01-10 08:00:00",
          "2026-01-10 10:00:00",
          "2026-01-10 10:00:00",
          "2026-01-10 12:00:00",
        ),
      ).toBe(false);
    });

    it("ignora comparação com data inválida", () => {
      expect(
        sobrepoe(null, "2026-01-10 10:00:00", "2026-01-10 09:00:00", null),
      ).toBe(false);
    });
  });

  describe("RN16 - especialização compatível", () => {
    it("aceita especialização igual, sem ligar pro caixa", () => {
      expect(especializacaoCompativel("Torno", "torno")).toBe(true);
    });

    it("aceita quando uma descrição contém a outra", () => {
      expect(especializacaoCompativel("Torno CNC", "Torno")).toBe(true);
      expect(especializacaoCompativel("Torno", "Torno CNC")).toBe(true);
    });

    it("recusa especializações diferentes", () => {
      expect(especializacaoCompativel("Fresagem", "Torno")).toBe(false);
    });

    it("não trava quando o cadastro está sem especialização", () => {
      expect(especializacaoCompativel("", "Torno")).toBe(true);
    });
  });

  // Agenda real passa por SELECT, FOR UPDATE e transação
  it.skip("impede duas atividades do mesmo Operador no dia (RN14) - requer banco", () => {});

  it.skip("impede horários sobrepostos do Mecânico (RN15) - requer banco", () => {});

  it.skip("bloqueia confirmações simultâneas conflitantes (RNF05) - requer banco", () => {});

  it.skip("valida jornada e afastamento do profissional (RN13) - requer banco", () => {});

  it.skip("reprograma liberando o período anterior só após gravar (RN17) - requer rotas e banco", () => {});

  it.skip("cancela liberando a ocupação e preservando histórico (RN17) - requer banco", () => {});

  it.skip("mantém atraso ocupando a agenda até a conclusão (RN19) - requer banco", () => {});

  it.skip("bloqueia desativação de profissional com compromisso (RN09) - requer banco", () => {});
});

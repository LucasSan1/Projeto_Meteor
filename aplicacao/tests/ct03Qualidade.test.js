import { describe, expect, it } from "vitest";

import {
  extrairProducao,
  formatarQuantidade,
  inteiroNaoNegativo,
  validarQualidade,
} from "../app/utils/producao";

// CT03 - Inspeção, rejeições e consistência dos números da qualidade
describe("CT03 - qualidade da produção", () => {
  describe("RN18 - quantidades inteiras e soma fechando", () => {
    it("aceita produção com aprovadas e rejeitadas fechando o total", () => {
      const resultado = validarQualidade({
        quantidadeProduzida: 10,
        aprovadas: 8,
        rejeitadas: 2,
        rejeicoes: [
          { quantidade: 2, motivoRejeicao: "Trinca", tipo: "Perda" },
        ],
      });

      expect(resultado).toEqual({
        quantidadeProduzida: 10,
        aprovadas: 8,
        rejeitadas: 2,
        rejeicoes: [
          {
            quantidade: 2,
            motivoRejeicao: "Trinca",
            tipo: "Perda",
            acoesCorretivas: null,
          },
        ],
      });
    });

    it("considera zero aprovadas e zero rejeitadas quando omitidas", () => {
      expect(
        validarQualidade({ quantidadeProduzida: 0 }).aprovadas,
      ).toBe(0);
    });

    it("rejeita quantidade produzida negativa", () => {
      expect(() =>
        validarQualidade({ quantidadeProduzida: -1 }),
      ).toThrow(/inteiro não negativo/);
    });

    it("rejeita quantidade produzida fracionada", () => {
      expect(() =>
        validarQualidade({ quantidadeProduzida: 2.5 }),
      ).toThrow(/inteiro não negativo/);
    });

    it("rejeita soma de aprovadas e rejeitadas diferente do total", () => {
      expect(() =>
        validarQualidade({
          quantidadeProduzida: 10,
          aprovadas: 7,
          rejeitadas: 2,
        }),
      ).toThrow(/precisa bater com o total produzido/);
    });

    it("rejeita rejeição positiva sem detalhamento", () => {
      expect(() =>
        validarQualidade({
          quantidadeProduzida: 5,
          aprovadas: 3,
          rejeitadas: 2,
        }),
      ).toThrow(/motivo das peças rejeitadas/);
    });

    it("rejeita detalhe de rejeição sem motivo", () => {
      expect(() =>
        validarQualidade({
          quantidadeProduzida: 5,
          aprovadas: 3,
          rejeitadas: 2,
          rejeicoes: [{ quantidade: 2, motivoRejeicao: "   " }],
        }),
      ).toThrow(/motivo da rejeição é obrigatório/);
    });

    it("rejeita detalhe de rejeição com quantidade zero", () => {
      expect(() =>
        validarQualidade({
          quantidadeProduzida: 5,
          aprovadas: 3,
          rejeitadas: 2,
          rejeicoes: [{ quantidade: 0, motivoRejeicao: "Trinca" }],
        }),
      ).toThrow(/maior que zero/);
    });

    it("rejeita tipo de rejeição fora de Retrabalho e Perda", () => {
      expect(() =>
        validarQualidade({
          quantidadeProduzida: 5,
          aprovadas: 3,
          rejeitadas: 2,
          rejeicoes: [
            { quantidade: 2, motivoRejeicao: "Trinca", tipo: "Refugo" },
          ],
        }),
      ).toThrow(/Tipo de rejeição inválido/);
    });

    it("rejeita quando a soma dos detalhes não bate com o total rejeitado", () => {
      expect(() =>
        validarQualidade({
          quantidadeProduzida: 5,
          aprovadas: 3,
          rejeitadas: 2,
          rejeicoes: [{ quantidade: 1, motivoRejeicao: "Trinca" }],
        }),
      ).toThrow(/soma das rejeições detalhadas/);
    });

    it("aceita rejeição sem ações corretivas e devolve null", () => {
      const resultado = validarQualidade({
        quantidadeProduzida: 4,
        aprovadas: 2,
        rejeitadas: 2,
        rejeicoes: [
          { quantidade: 2, motivoRejeicao: "Medida fora", tipo: "Retrabalho" },
        ],
      });

      expect(resultado.rejeicoes[0].acoesCorretivas).toBeNull();
    });
  });

  describe("RN10 - conversão das quantidades", () => {
    it("rejeita valor que não é inteiro", () => {
      expect(() => inteiroNaoNegativo("1.2", "Quantidade")).toThrow(
        /inteiro não negativo/,
      );
    });

    it("formata quantidade no padrão brasileiro", () => {
      expect(formatarQuantidade(12.5)).toBe("12,5");
    });
  });

  describe("compatibilidade do corpo da requisição", () => {
    it("aceita o formato novo com bloco producao", () => {
      expect(
        extrairProducao({
          producao: {
            quantidadeProduzida: 5,
            aprovadas: 4,
            rejeitadas: 1,
            observacoes: "Lote ok",
          },
          rejeicoes: [{ quantidade: 1, motivoRejeicao: "Rebarba" }],
          maquinaID: 2,
          consumo: [{ materiaID: 1, quantidade: 3 }],
        }),
      ).toMatchObject({
        quantidadeProduzida: 5,
        aprovadas: 4,
        rejeitadas: 1,
        observacoes: "Lote ok",
        maquinaID: 2,
      });
    });

    it("aceita o formato antigo com totalProduzido solto", () => {
      expect(
        extrairProducao({
          totalProduzido: 7,
          aprovadas: 7,
          maquinaID: 3,
        }),
      ).toMatchObject({
        quantidadeProduzida: 7,
        aprovadas: 7,
        maquinaID: 3,
      });
    });
  });

  // Indicadores e vínculos são calculados em SQL, então ficam pra integração
  it.skip("calcula indicadores por ordem, operador e período - requer banco", () => {});

  it.skip("mostra não calculável quando o total inspecionado é zero - requer banco e tela", () => {});

  it.skip("não conta a mesma rejeição duas vezes - requer banco", () => {});

  it.skip("vincula aprovação e rejeição à inspeção da ordem - requer banco", () => {});
});

// Validações compartilhadas entre criação, edição e conclusão de ordens
export function inteiroNaoNegativo(valor, campo) {
  const numero = Number(valor);

  if (!Number.isInteger(numero) || numero < 0) {
    throw {
      status: 400,
      message: `${campo} precisa ser um número inteiro não negativo!`,
    };
  }

  return numero;
}

export function formatarQuantidade(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    maximumFractionDigits: 3,
  });
}

function normalizarMateriais(materiais) {
  if (!Array.isArray(materiais) || materiais.length === 0) {
    throw {
      status: 400,
      message: "Informe pelo menos uma matéria-prima para a ordem!",
    };
  }

  const vistos = new Set();

  return materiais.map((item) => {
    const materiaID = Number(
      item.materiaID ?? item.fk_materiaID ?? item.materia,
    );
    const quantidadePrevista = Number(
      item.quantidadePrevista ?? item.quantidade,
    );

    if (!materiaID || materiaID <= 0) {
      throw { status: 400, message: "Matéria-prima inválida na ordem!" };
    }

    if (!Number.isFinite(quantidadePrevista) || quantidadePrevista <= 0) {
      throw {
        status: 400,
        message: "A quantidade planejada de cada material deve ser maior que zero!",
      };
    }

    if (vistos.has(materiaID)) {
      throw {
        status: 400,
        message: "Não repita a mesma matéria-prima na ordem!",
      };
    }

    vistos.add(materiaID);

    return { materiaID, quantidadePrevista };
  });
}

// Confere se cada material existe, está ativo e tem saldo pro planejado
export async function validarMateriaisPlanejados(connection, materiais) {
  const normalizados = normalizarMateriais(materiais);
  const ids = normalizados.map((item) => item.materiaID);

  const [rows] = await connection.query(
    `SELECT pk_materiaID, materia, unidadeMedida, quantidadeEstoque, status
     FROM materiasPrimas
     WHERE pk_materiaID IN (?)
     FOR UPDATE`,
    [ids],
  );

  const porId = new Map(rows.map((row) => [Number(row.pk_materiaID), row]));

  return normalizados.map((item) => {
    const materia = porId.get(item.materiaID);

    if (!materia) {
      throw {
        status: 404,
        message: "Uma das matérias-primas informadas não existe!",
      };
    }

    if (materia.status !== "Ativo") {
      throw {
        status: 400,
        message: `A matéria-prima "${materia.materia}" está inativa e não pode compor novas ordens!`,
      };
    }

    if (Number(materia.quantidadeEstoque) < item.quantidadePrevista) {
      throw {
        status: 400,
        message: `Saldo insuficiente de "${materia.materia}": disponível ${formatarQuantidade(materia.quantidadeEstoque)} ${materia.unidadeMedida}, planejado ${formatarQuantidade(item.quantidadePrevista)} ${materia.unidadeMedida}!`,
      };
    }

    return {
      ...item,
      materia: materia.materia,
      unidadeMedida: materia.unidadeMedida,
    };
  });
}

// Na conclusão, valida o consumo efetivo de cada material e o saldo vigente
export async function validarConsumoConclusao(connection, fkOrdemID, consumo) {
  const [materiais] = await connection.query(
    `SELECT om.fk_materiaID, om.quantidadePrevista,
            m.materia, m.unidadeMedida, m.quantidadeEstoque
     FROM ordemMateriais om
     INNER JOIN materiasPrimas m ON m.pk_materiaID = om.fk_materiaID
     WHERE om.fk_ordemID = ?
     ORDER BY om.fk_materiaID
     FOR UPDATE`,
    [fkOrdemID],
  );

  if (materiais.length === 0) return [];

  if (!Array.isArray(consumo) || consumo.length === 0) {
    throw {
      status: 400,
      message: "Informe o consumo efetivo de cada matéria-prima da ordem!",
    };
  }

  const consumidoPorId = new Map();

  for (const item of consumo) {
    const materiaID = Number(
      item.materiaID ?? item.fk_materiaID ?? item.materia,
    );
    const quantidade = Number(item.quantidade ?? item.quantidadeConsumida);

    if (!Number.isFinite(quantidade) || quantidade < 0) {
      throw {
        status: 400,
        message: "O consumo efetivo não pode ser negativo!",
      };
    }

    consumidoPorId.set(materiaID, quantidade);
  }

  return materiais.map((materia) => {
    const materiaID = Number(materia.fk_materiaID);

    if (!consumidoPorId.has(materiaID)) {
      throw {
        status: 400,
        message: `Informe o consumo efetivo de "${materia.materia}"!`,
      };
    }

    const quantidade = consumidoPorId.get(materiaID);

    if (Number(materia.quantidadeEstoque) < quantidade) {
      throw {
        status: 400,
        message: `Saldo insuficiente de "${materia.materia}": disponível ${formatarQuantidade(materia.quantidadeEstoque)} ${materia.unidadeMedida}, consumo ${formatarQuantidade(quantidade)} ${materia.unidadeMedida}!`,
      };
    }

    return {
      materiaID,
      quantidade,
      materia: materia.materia,
      unidadeMedida: materia.unidadeMedida,
    };
  });
}

// Quantidades inteiras, soma fechando e motivo obrigatório em rejeição
export function validarQualidade({
  quantidadeProduzida,
  aprovadas,
  rejeitadas,
  rejeicoes,
}) {
  const produzida = inteiroNaoNegativo(
    quantidadeProduzida,
    "A quantidade produzida",
  );
  const aprov = inteiroNaoNegativo(aprovadas ?? 0, "A quantidade aprovada");
  const rejeit = inteiroNaoNegativo(rejeitadas ?? 0, "A quantidade rejeitada");

  if (aprov + rejeit !== produzida) {
    throw {
      status: 400,
      message: "Aprovadas + rejeitadas precisa bater com o total produzido!",
    };
  }

  const detalhes = [];

  if (rejeit > 0) {
    if (!Array.isArray(rejeicoes) || rejeicoes.length === 0) {
      throw {
        status: 400,
        message: "Informe o motivo das peças rejeitadas!",
      };
    }

    let soma = 0;

    for (const item of rejeicoes) {
      const quantidade = inteiroNaoNegativo(
        item.quantidade,
        "A quantidade da rejeição",
      );

      if (quantidade === 0) {
        throw {
          status: 400,
          message: "Toda rejeição detalhada precisa ter quantidade maior que zero!",
        };
      }

      const motivo = String(item.motivoRejeicao || "").trim();

      if (!motivo) {
        throw { status: 400, message: "O motivo da rejeição é obrigatório!" };
      }

      const tipo = item.tipo || "Perda";

      if (!["Retrabalho", "Perda"].includes(tipo)) {
        throw { status: 400, message: "Tipo de rejeição inválido!" };
      }

      soma += quantidade;
      detalhes.push({
        quantidade,
        motivoRejeicao: motivo,
        tipo,
        acoesCorretivas: String(item.acoesCorretivas || "").trim() || null,
      });
    }

    if (soma !== rejeit) {
      throw {
        status: 400,
        message: `A soma das rejeições detalhadas (${soma}) precisa bater com o total rejeitado (${rejeit})!`,
      };
    }
  }

  return {
    quantidadeProduzida: produzida,
    aprovadas: aprov,
    rejeitadas: rejeit,
    rejeicoes: detalhes,
  };
}

// Aceita o formato novo ({ producao }) e o antigo com campos soltos, pra não quebrar chamadas que já existiam
export function extrairProducao(body) {
  const producao = body.producao || body;

  return {
    quantidadeProduzida:
      producao.quantidadeProduzida ?? producao.totalProduzido,
    aprovadas: producao.aprovadas,
    rejeitadas: producao.rejeitadas,
    rejeicoes: body.rejeicoes || producao.rejeicoes,
    observacoes: producao.observacoes,
    maquinaID: body.maquinaID || producao.maquinaID || null,
    consumo: body.consumo,
  };
}

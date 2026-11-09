import { getDataBrasilia } from "./Datetime";

// Datas do MySQL/inputs chegam como "YYYY-MM-DD HH:mm:ss", mas o mysql também pode devolver DATETIME como objeto Date
// Comparar texto no formato SQL é seguro porque ele é ordenávl
export function normalizarDataHora(valor) {
  if (!valor) return null;

  // mysql entrega DATETIME como Date, converter com os getters locais mantém os mesmos valores que estão gravados no banco
  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) return null;

    const pad = (n) => String(n).padStart(2, "0");

    return `${valor.getFullYear()}-${pad(valor.getMonth() + 1)}-${pad(valor.getDate())} ${pad(valor.getHours())}:${pad(valor.getMinutes())}:${pad(valor.getSeconds())}`;
  }

  const texto = String(valor).replace("T", " ").trim();

  return texto.length === 16 ? `${texto}:00` : texto;
}

export function diaDe(valor) {
  const data = normalizarDataHora(valor);

  return data ? data.slice(0, 10) : null;
}

// Lista todos os dias entre duas datas (inclusive), sem cair em fuso horário
export function listarDias(inicio, termino) {
  const diaInicio = diaDe(inicio);
  const diaTermino = diaDe(termino);

  if (!diaInicio || !diaTermino) return [];

  const dias = [];
  const cursor = new Date(`${diaInicio}T00:00:00Z`);
  const fim = new Date(`${diaTermino}T00:00:00Z`);

  // Trava de segurança, uma atividade de mais de um ano só pode ser erro
  let limite = 0;

  while (cursor <= fim && limite < 366) {
    dias.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    limite += 1;
  }

  return dias;
}

export function sobrepoe(inicioA, terminoA, inicioB, terminoB) {
  const aIni = normalizarDataHora(inicioA);
  const aFim = normalizarDataHora(terminoA);
  const bIni = normalizarDataHora(inicioB);
  const bFim = normalizarDataHora(terminoB);

  if (!aIni || !aFim || !bIni || !bFim) return false;

  return aIni < bFim && bIni < aFim;
}

export function formatarDia(dia) {
  if (!dia) return "-";

  const [ano, mes, data] = dia.split("-");

  return `${data}/${mes}/${ano}`;
}

// Aptidão por especialização
export function especializacaoCompativel(exigida, doProfissional) {
  const requerida = String(exigida || "").trim().toLowerCase();
  const cadastrada = String(doProfissional || "").trim().toLowerCase();

  if (!requerida || !cadastrada) return true;

  return requerida.includes(cadastrada) || cadastrada.includes(requerida);
}

// A execução só começa dentro da janela prevista
// Operador/mecânico podem antecipar, mas a rota exige uma observação nesse caso
export function validarJanelaExecucao(
  inicioPrevisto,
  terminoPrevisto,
  entidade,
  { permitirAntecipacao = false } = {},
) {
  const agora = getDataBrasilia();
  const inicio = normalizarDataHora(inicioPrevisto);
  const termino = normalizarDataHora(terminoPrevisto);

  if (agora < inicio) {
    if (permitirAntecipacao) {
      return { inicioAntecipado: true };
    }

    throw {
      status: 400,
      message: `A ${entidade} só pode ser iniciada a partir de ${inicio}!`,
    };
  }

  if (agora >= termino) {
    throw {
      status: 400,
      message: `O período previsto da ${entidade} terminou. Peça ao gestor para reprogramar antes de iniciar!`,
    };
  }

  return { inicioAntecipado: false };
}

// Nenhuma pessoa pode iniciar outra atividade com uma execução aberta
export async function validarExecucaoAberta(
  connection,
  profissionalID,
  { ignorarOrdemID = null, ignorarManutencaoID = null } = {},
) {
  const [ordens] = await connection.query(
    `SELECT codigo
     FROM ordensProducao
     WHERE fk_operadorID = ? AND status = 'Em Produção' AND pk_ordemID <> ?`,
    [profissionalID, ignorarOrdemID || 0],
  );

  if (ordens.length > 0) {
    throw {
      status: 409,
      message: `Você já tem a ordem ${ordens[0].codigo} em produção. Conclua antes de iniciar outra atividade!`,
    };
  }

  const [manutencoes] = await connection.query(
    `SELECT descricao
     FROM manutencoesProgramadas
     WHERE fk_mecanicoID = ? AND status = 'Em Execução' AND pk_manutencaoID <> ?`,
    [profissionalID, ignorarManutencaoID || 0],
  );

  if (manutencoes.length > 0) {
    throw {
      status: 409,
      message: `Você já tem a manutenção "${manutencoes[0].descricao}" em execução. Conclua antes de iniciar outra atividade!`,
    };
  }
}

// Junta os dias ocupados por uma ordem (previstos + efetivos quando iniciada)
function diasDaOrdem(ordem) {
  const dias = new Set();

  if (ordem.status === "Concluída") {
    const inicioReal = ordem.inicioEfetivo || ordem.inicioPlanejado;
    const fimReal = ordem.conclusaoEfetiva || ordem.terminoPlanejado;

    listarDias(inicioReal, fimReal).forEach((dia) => dias.add(dia));

    return dias;
  }

  listarDias(ordem.inicioPlanejado, ordem.terminoPlanejado).forEach((dia) =>
    dias.add(dia),
  );

  if (ordem.status === "Em Produção" && ordem.inicioEfetivo) {
    const fimEfetivo = ordem.conclusaoEfetiva || getDataBrasilia();

    listarDias(ordem.inicioEfetivo, fimEfetivo).forEach((dia) => dias.add(dia));
  }

  return dias;
}

// Operador, no máximo UMA atividade por dia, somando produção e manutenção
export async function validarAgendaOperador(
  connection,
  { profissionalID, inicio, termino, ignorarOrdemID = null },
) {
  const diasPedido = listarDias(inicio, termino);

  if (diasPedido.length === 0) {
    throw { status: 400, message: "Período inválido para a agenda!" };
  }

  const [ordens] = await connection.query(
    `SELECT pk_ordemID, codigo, inicioPlanejado, terminoPlanejado,
            inicioEfetivo, conclusaoEfetiva, status
     FROM ordensProducao
     WHERE fk_operadorID = ? AND status IN ('Pendente', 'Em Produção', 'Concluída')`,
    [profissionalID],
  );

  for (const ordem of ordens) {
    if (Number(ordem.pk_ordemID) === Number(ignorarOrdemID)) continue;

    const diasOcupados = diasDaOrdem(ordem);
    const conflito = diasPedido.find((dia) => diasOcupados.has(dia));

    if (conflito) {
      throw {
        status: 409,
        message: `O operador já tem a ordem ${ordem.codigo} em ${formatarDia(conflito)}. Cada operador só pode ter uma atividade por dia!`,
      };
    }
  }

  // A mesma pessoa pode ser operador e mecânico, mas a agenda é uma só
  const [manutencoes] = await connection.query(
    `SELECT pk_manutencaoID, descricao, inicioPrevisto, terminoPrevisto,
            inicioEfetivo, conclusaoEfetiva, status
     FROM manutencoesProgramadas
     WHERE fk_mecanicoID = ? AND status IN ('Programada', 'Em Execução', 'Concluída')`,
    [profissionalID],
  );

  for (const manutencao of manutencoes) {
    const diasOcupados = diasDaOrdem({
      inicioPlanejado: manutencao.inicioPrevisto,
      terminoPlanejado: manutencao.terminoPrevisto,
      inicioEfetivo: manutencao.inicioEfetivo,
      conclusaoEfetiva: manutencao.conclusaoEfetiva,
      status:
        manutencao.status === "Em Execução"
          ? "Em Produção"
          : manutencao.status === "Concluída"
            ? "Concluída"
            : "Pendente",
    });

    const conflito = diasPedido.find((dia) => diasOcupados.has(dia));

    if (conflito) {
      throw {
        status: 409,
        message: `O operador tem a manutenção "${manutencao.descricao}" em ${formatarDia(conflito)}. Se houver produção no dia, não cabe outra atividade!`,
      };
    }
  }
}

// Mecânico, várias intervenções no dia, desde que não se sobreponham
export async function validarAgendaMecanico(
  connection,
  { profissionalID, inicio, termino, ignorarManutencaoID = null },
) {
  const [manutencoes] = await connection.query(
    `SELECT pk_manutencaoID, descricao, inicioPrevisto, terminoPrevisto,
            inicioEfetivo, conclusaoEfetiva, status
     FROM manutencoesProgramadas
     WHERE fk_mecanicoID = ? AND status IN ('Programada', 'Em Execução', 'Concluída')`,
    [profissionalID],
  );

  for (const manutencao of manutencoes) {
    if (Number(manutencao.pk_manutencaoID) === Number(ignorarManutencaoID)) {
      continue;
    }

    // Concluída usa o período real; os demais usam efetivo (se iniciado) ou previsto
    const concluida = manutencao.status === "Concluída";

    const inicioOcupado = concluida
      ? manutencao.inicioEfetivo || manutencao.inicioPrevisto
      : manutencao.status === "Em Execução" && manutencao.inicioEfetivo
        ? manutencao.inicioEfetivo
        : manutencao.inicioPrevisto;

    const terminoOcupado = concluida
      ? manutencao.conclusaoEfetiva || manutencao.terminoPrevisto
      : manutencao.status === "Em Execução" && manutencao.inicioEfetivo
        ? manutencao.conclusaoEfetiva || manutencao.terminoPrevisto
        : manutencao.terminoPrevisto;

    if (sobrepoe(inicio, termino, inicioOcupado, terminoOcupado)) {
      throw {
        status: 409,
        message: `O mecânico já tem a manutenção "${manutencao.descricao}" nesse horário. Escolha outro período!`,
      };
    }
  }

  // Se a pessoa também é operador e tem produção no dia não cabe manutenção
  const diasPedido = listarDias(inicio, termino);

  const [ordens] = await connection.query(
    `SELECT pk_ordemID, codigo, inicioPlanejado, terminoPlanejado,
            inicioEfetivo, conclusaoEfetiva, status
     FROM ordensProducao
     WHERE fk_operadorID = ? AND status IN ('Pendente', 'Em Produção', 'Concluída')`,
    [profissionalID],
  );

  for (const ordem of ordens) {
    const diasOcupados = diasDaOrdem(ordem);
    const conflito = diasPedido.find((dia) => diasOcupados.has(dia));

    if (conflito) {
      throw {
        status: 409,
        message: `O profissional tem a ordem ${ordem.codigo} em ${formatarDia(conflito)}. Quem tem produção no dia não pode receber manutenção!`,
      };
    }
  }
}

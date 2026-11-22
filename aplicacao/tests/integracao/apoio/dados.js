import { hashPass } from "../../../app/utils/hash";
import { diaBrasilia } from "../../apoio/datas";
import { consultar, um } from "./banco";

export const SENHA_SEED = "Meteor@2026";

export const EMAILS = {
  gerente: "naldo.benni@meteor.com",
  irinel: "irinel@meteor.com",
  fulano: "fulano.detal@meteor.com",
  serjao: "serjao.berranteiro@meteor.com",
  galo: "galo.cego@meteor.com",
};

export async function usuarioPorEmail(email) {
  return um(
    `SELECT id, nome, email, cargo, status, tokenversao, primeiroacesso
       FROM usuarios
      WHERE email = $1`,
    [email],
  );
}

export async function profissionalPorEmail(email) {
  return um(
    `SELECT p.pk_profissionalid AS id,
            p.ehoperador,
            p.ehmecanico,
            p.especializacao,
            p.telefone,
            p.status
       FROM profissionais p
       INNER JOIN usuarios u ON u.id = p.fk_usuarioid
      WHERE u.email = $1`,
    [email],
  );
}

export async function criarUsuarioTeste({
  nome,
  email,
  cargo = "operador",
  senha = SENHA_SEED,
  status = "Ativo",
  tokenVersao = 0,
}) {
  const hash = await hashPass(senha);

  return um(
    `INSERT INTO usuarios
       (nome, email, cargo, senha, status, primeiroacesso, tokenversao)
     VALUES ($1, $2, $3, $4, $5, false, $6)
     RETURNING id`,
    [nome, email, cargo, hash, status, tokenVersao],
  );
}

export async function criarProfissionalTeste({
  usuarioID,
  ehOperador = 0,
  ehMecanico = 1,
  especializacao = null,
  telefone = null,
  status = "Ativo",
}) {
  return um(
    `INSERT INTO profissionais
       (fk_usuarioid, ehoperador, ehmecanico, especializacao, telefone, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING pk_profissionalid AS id`,
    [usuarioID, ehOperador, ehMecanico, especializacao, telefone, status],
  );
}

export async function criarOrdemDireta({
  codigo,
  pecaID = 1,
  quantidadePlanejada = 1,
  especializacao = "Usinagem",
  operadorID,
  inicioPlanejado,
  terminoPlanejado,
  inicioEfetivo = null,
  conclusaoEfetiva = null,
  status = "Pendente",
}) {
  return um(
    `INSERT INTO ordensproducao
       (codigo, fk_pecaid, quantidadeplanejada, especializacao, fk_operadorid,
        inicioplanejado, terminoplanejado, inicioefetivo, conclusaoefetiva, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING pk_ordemid AS id`,
    [
      codigo,
      pecaID,
      quantidadePlanejada,
      especializacao,
      operadorID,
      inicioPlanejado,
      terminoPlanejado,
      inicioEfetivo,
      conclusaoEfetiva,
      status,
    ],
  );
}

export async function adicionarMaterialOrdem({
  ordemID,
  materiaID,
  quantidadePrevista,
}) {
  return um(
    `INSERT INTO ordemmateriais (fk_ordemid, fk_materiaid, quantidadeprevista)
     VALUES ($1, $2, $3)
     RETURNING pk_ordemmateriaid AS id`,
    [ordemID, materiaID, quantidadePrevista],
  );
}

export async function contar(sql, params = []) {
  const linha = await um(sql, params);

  return linha ? Number(Object.values(linha)[0]) : 0;
}

// Atalho pra montar um período de N dias a partir de hoje
export function periodoFuturo(inicioEmDias, duracaoEmDias = 0) {
  return {
    inicio: diaBrasilia(inicioEmDias),
    termino: diaBrasilia(inicioEmDias + duracaoEmDias),
  };
}

// Soma minutos num "YYYY-MM-DD HH:mm:ss" mantendo o fuso de Brasília
export function somarMinutos(dataHora, minutos) {
  const base = new Date(`${String(dataHora).replace(" ", "T")}-03:00`);

  base.setUTCMinutes(base.getUTCMinutes() + minutos);

  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .format(base)
    .replace("T", " ");
}

export async function listar(sql, params = []) {
  return consultar(sql, params);
}

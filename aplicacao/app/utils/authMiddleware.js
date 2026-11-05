import pool from "../lib/connSql";
import { isvalid } from "./jwt";

// Cargos do sistema, do jeito que o ENUM do banco espera
export const CARGOS = {
  GERENTE: "gerente",
  OPERADOR: "operador",
  MECANICO: "mecanico",
};

// Lê o token, valida assinatura/expiração e recarrega o usuário no banco
// Recarregar do banco é o que impede um token antigo de continuar valendo depois que a conta foi desativada ou o cargo mudou
export async function autenticar(request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    throw { status: 401, message: "Token não informado!" };
  }

  const payload = isvalid(authHeader);

  if (payload === "TokenExpiredError") {
    throw { status: 401, message: "Token expirado!" };
  }

  if (payload === "JsonWebTokenError" || typeof payload === "string") {
    throw { status: 401, message: "Não autorizado!" };
  }

  const [rows] = await pool.query(
    `SELECT
       u.id,
       u.nome,
       u.email,
       u.cargo,
       u.status,
       p.pk_profissionalID,
       p.ehOperador,
       p.ehMecanico,
       p.especializacao,
       p.status AS statusProfissional
     FROM usuarios u
     LEFT JOIN profissionais p ON p.fk_usuarioID = u.id
     WHERE u.email = ?
     LIMIT 1`,
    [payload.email],
  );

  if (rows.length === 0) {
    throw { status: 401, message: "Usuário não encontrado!" };
  }

  const usuario = rows[0];

  // O cargo vale o que está no banco, não o que está gravado no token
  if (usuario.status !== "Ativo") {
    throw { status: 403, message: "Conta desativada!" };
  }

  return {
    ...usuario,
    profissionalID: usuario.pk_profissionalID,
    ativoComoProfissional: usuario.statusProfissional === "Ativo",
  };
}

// Autentica e confere se o cargo está na lista de quem pode entrar
export async function autorizar(request, cargos) {
  const usuario = await autenticar(request);

  if (!cargos.includes(usuario.cargo)) {
    throw { status: 403, message: "Acesso negado para o seu perfil!" };
  }

  return usuario;
}

// Atalho pro caso mais comum: módulos administrativos só do gestor
export async function autorizarGestor(request) {
  return autorizar(request, [CARGOS.GERENTE]);
}

// Confere se o usuário é o responsável pelo registro, gestor passa direto porque tem acesso total
export function garantirTitularidade(usuario, profissionalID, mensagem) {
  if (usuario.cargo === CARGOS.GERENTE) return;

  if (
    !usuario.profissionalID ||
    Number(usuario.profissionalID) !== Number(profissionalID)
  ) {
    throw {
      status: 403,
      message: mensagem || "Esse registro não está atribuído a você!",
    };
  }
}

// Operador precisa ter vínculo de operador ativo pra mexer em produção
export function exigirPerfilOperador(usuario) {
  if (
    usuario.cargo === CARGOS.OPERADOR &&
    (!usuario.ehOperador || !usuario.ativoComoProfissional)
  ) {
    throw {
      status: 403,
      message: "Seu perfil não está habilitado como operador!",
    };
  }
}

// Mecânico precisa ter vínculo de mecânico ativo pra mexer em manutenção
export function exigirPerfilMecanico(usuario) {
  if (
    usuario.cargo === CARGOS.MECANICO &&
    (!usuario.ehMecanico || !usuario.ativoComoProfissional)
  ) {
    throw {
      status: 403,
      message: "Seu perfil não está habilitado como mecânico!",
    };
  }
}

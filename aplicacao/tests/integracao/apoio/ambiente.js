import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";

// Carrega o .env da aplicação. Em CI as variáveis já podem estar no ambiente, e nesse caso o loadEnvFile não sobrescreve o que já existe
const arquivoEnv = fileURLToPath(new URL("../../../.env", import.meta.url));

try {
  loadEnvFile(arquivoEnv);
} catch (erro) {
  if (erro.code !== "ENOENT") throw erro;
}

function exigir(nome) {
  const valor = process.env[nome];

  if (!valor) {
    throw new Error(
      `Variável ${nome} não configurada. Os testes de integração precisam do banco de teste no .env`,
    );
  }

  return valor;
}

const refProjeto = (process.env.TESTE_HOST || "").match(
  /db\.([a-z0-9]+)\.supabase\.co/,
)?.[1];

// A conexão direta do Supabase só resolve IPv6; o pooler resolve IPv4
const host = process.env.TESTE_POOLER_HOST || exigir("TESTE_HOST");
const porta = Number(
  process.env.TESTE_POOLER_PORT || process.env.TESTE_PORT || 5432,
);
const database = exigir("TESTE_DATABASE");
const senha = exigir("TESTE_PASSWORD");

let usuario = exigir("TESTE_USER");

// No pooler o usuário precisa do sufixo do projeto: postgres.<ref>
if (
  /pooler\.supabase\.com$/.test(host) &&
  !usuario.includes(".") &&
  refProjeto
) {
  usuario = `${usuario}.${refProjeto}`;
}

// Trava de segurança: nunca apontar a suíte para o banco de produção
const refProducao = String(process.env.user || "").split(".")[1];
const mesmoProjeto =
  Boolean(refProjeto) &&
  Boolean(refProducao) &&
  refProjeto === refProducao;
const mesmoHostEDatabase =
  host === process.env.host && database === process.env.database;

if (mesmoProjeto || (mesmoHostEDatabase && usuario === process.env.user)) {
  throw new Error(
    "Os testes de integração estão apontando para o banco de produção. Configure TESTE_* com o banco de teste",
  );
}

const usaSSL = !/^(localhost|127\.0\.0\.1|::1)$/.test(host);

export const configuracaoTeste = {
  host,
  port: porta,
  database,
  user: usuario,
  password: senha,
  ssl: usaSSL ? { rejectUnauthorized: false } : undefined,
};

// O connSql lê PG* (ou DATABASE_URL). Apontamos tudo pro banco de teste
// antes de qualquer rota ser importada
process.env.PGHOST = host;
process.env.PGPORT = String(porta);
process.env.PGDATABASE = database;
process.env.PGUSER = usuario;
process.env.PGPASSWORD = senha;
delete process.env.DATABASE_URL;

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET não configurado no .env");
}

// ============================================================
//  Conexão com o banco - PostgreSQL (Supabase)
//
//  O app foi escrito em cima do mysql2, então este módulo mantém o
//  mesmo contrato que as rotas já conhecem:
//    - pool.query(...) devolve [rows, fields]
//    - INSERT devolve insertId
//    - UPDATE/DELETE devolvem affectedRows
//    - getConnection() devolve beginTransaction/commit/rollback/release/ping
//
//  Assim não precisa reescrever as todas as queries de uma vez
// ============================================================

// ---------- MYSQL (modo antigo, guardado pra emergência) ----------
// import mysql from "mysql2/promise";
//
// const pool = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// });
// ------------------------------------------------------------------

import pg from "pg";
import mapaColunas from "./mapaColunas";

const { Pool, types } = pg;

// COUNT(*) chega como BIGINT (string no pg), mas o mysql2 devolvia número
// Sem isso o dashboard começaria a receber "5" em vez de 5 no JSON
types.setTypeParser(20, (valor) => Number(valor));

// Aceita tanto uma DATABASE_URL quanto as variáveis soltas do .env
const connectionString = process.env.DATABASE_URL;

const host = connectionString
  ? new URL(connectionString).hostname
  : process.env.PGHOST || process.env.host;

// localhost normalmente não tem SSL; Supabase exige
// Dá pra forçar desligado com PGSSL=false.
const usaSSL =
  process.env.PGSSL !== "false" &&
  !/^(localhost|127\.0\.0\.1|::1)$/.test(host || "");

const configuracao = {
  ...(connectionString
    ? { connectionString }
    : {
        host,
        port: Number(process.env.PGPORT || process.env.port || 5432),
        database: process.env.PGDATABASE || process.env.database,
        user: process.env.PGUSER || process.env.user,
        password: process.env.PGPASSWORD || process.env.password,
      }),
  ssl: usaSSL ? { rejectUnauthorized: false } : undefined,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

// Em dev o Next recompila e reimporta os módulos, o que criaria um pool
// novo a cada mudança e vazaria conexão até estourar o limite do pooler
// Guardar no globalThis reaproveita o mesmo pool entre recompilações
const pgPool = globalThis.__cosmosPgPool ?? new Pool(configuracao);

globalThis.__cosmosPgPool = pgPool;

// Troca os "?" do mysql2 pelos "$1, $2..." do pg, sem mexer nos "?"
// que estiverem dentro de string ou comentário (senão vira arqueologia)
//
// De quebra faz a expansão de array que o mysql2 fazia sozinho
// Sem isso, o pg recebe um array inteiro num único parâmetro e reclama
function paraPlaceholders(sql, params) {
  const valores = [];
  let posParam = 0;
  let saida = "";
  let i = 0;

  // Um "?" com array vira N placeholders, o array de parâmetros acompanha
  function adicionarParam(valor) {
    if (!Array.isArray(valor)) {
      valores.push(valor);
      return `$${valores.length}`;
    }

    // Array vazio: o mysql2 também mandava NULL, e é o que o SQL espera
    if (valor.length === 0) return "NULL";

    // Array de arrays (bulk insert), cada linha vira um grupo entre parênteses
    if (Array.isArray(valor[0])) {
      const grupos = valor.map(
        (linha) => `(${linha.map(adicionarParam).join(", ")})`,
      );

      return grupos.join(", ");
    }

    // Array simples (IN): vira uma lista solta, as aspas do SQL já existem
    return valor.map(adicionarParam).join(", ");
  }

  while (i < sql.length) {
    const char = sql[i];

    // String literal: copia inteira e ignora interrogações no meio
    if (char === "'" || char === '"') {
      const fecha = char;
      saida += char;
      i += 1;

      while (i < sql.length) {
        const atual = sql[i];
        saida += atual;

        // Aspas duplicadas são escape no SQL ('' vira uma aspa literal)
        if (atual === fecha && sql[i + 1] === fecha) {
          saida += sql[i + 1];
          i += 2;
          continue;
        }

        // Backslash também escapa no MySQL (ex: \')
        if (atual === "\\" && i + 1 < sql.length) {
          saida += sql[i + 1];
          i += 2;
          continue;
        }

        i += 1;

        if (atual === fecha) break;
      }

      continue;
    }

    // Comentário de linha
    if (char === "-" && sql[i + 1] === "-") {
      const fim = sql.indexOf("\n", i);
      const trecho = fim === -1 ? sql.slice(i) : sql.slice(i, fim + 1);

      saida += trecho;
      i += trecho.length;
      continue;
    }

    // Comentário de bloco
    if (char === "/" && sql[i + 1] === "*") {
      const fim = sql.indexOf("*/", i + 2);
      const trecho = fim === -1 ? sql.slice(i) : sql.slice(i, fim + 2);

      saida += trecho;
      i += trecho.length;
      continue;
    }

    if (char === "?") {
      saida += adicionarParam(params[posParam]);
      posParam += 1;
      i += 1;
      continue;
    }

    saida += char;
    i += 1;
  }

  return { texto: saida, valores };
}

// O app só usa esse código de erro do MySQL, então traduzimos só ele
function traduzirErro(err) {
  if (err.code === "23505") err.code = "ER_DUP_ENTRY";

  return err;
}

// Cache das colunas identity por tabela, evita bater no information_schema a cada INSERT e funciona até no transaction pooler
const colunasIdentidade = new Map();

async function nomeColunaIdentidade(client, tabela) {
  if (colunasIdentidade.has(tabela)) return colunasIdentidade.get(tabela);

  const { rows } = await client.query(
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
        AND is_identity = 'YES'
      ORDER BY ordinal_position
      LIMIT 1`,
    [tabela],
  );

  const coluna = rows[0]?.column_name ?? null;

  colunasIdentidade.set(tabela, coluna);

  return coluna;
}

function tabelaDoInsert(sql) {
  const match = sql.match(
    /^\s*INSERT\s+INTO\s+(?:"?public"?\.)?"?([A-Za-z_][A-Za-z0-9_]*)"?/i,
  );

  return match ? match[1].toLowerCase() : null;
}

// O pg devolve as colunas em minúsculas (DDL sem aspas), mas o app lê
// camelCase. Aqui a gente devolve o nome original, sem tocar nas linhas que já estão no formato certo
function mapearLinhas(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return rows;

  return rows.map((linha) => {
    let mudou = false;
    const nova = {};

    for (const [chave, valor] of Object.entries(linha)) {
      const original = mapaColunas[chave] || chave;

      if (original !== chave) mudou = true;

      nova[original] = valor;
    }

    return mudou ? nova : linha;
  });
}

async function executar(client, sql, params = []) {
  try {
    const ehInsert = /^\s*INSERT\s+/i.test(sql);
    const tabela = ehInsert ? tabelaDoInsert(sql) : null;

    const { texto: comPlaceholders, valores } = paraPlaceholders(sql, params);

    let texto = comPlaceholders;

    // O pg não devolve o id do INSERT. Pedindo RETURNING * a linha volta e a gente tira a identity dela
    if (ehInsert && !/RETURNING\s/i.test(texto)) {
      texto = `${texto.replace(/;\s*$/, "")} RETURNING *`;
    }

    let resultado = await client.query(texto, valores);

    // Vários comandos numa query só viram array, o app não usa isso, mas se acontecer ficamos com o último resultado
    if (Array.isArray(resultado)) {
      resultado = resultado[resultado.length - 1];
    }

    // SELECT devolve só as linhas, igual o mysql2
    if (resultado.command === "SELECT" || resultado.command === "SHOW") {
      return [mapearLinhas(resultado.rows), resultado.fields];
    }

    // INSERT/UPDATE/DELETE devolvem o "cabeçalho" com as contagens
    resultado.affectedRows = resultado.rowCount ?? 0;
    resultado.changedRows = resultado.rowCount ?? 0;
    resultado.insertId = 0;

    if (resultado.command === "INSERT" && tabela) {
      const coluna = await nomeColunaIdentidade(client, tabela);
      const primeiraLinha = resultado.rows?.[0];

      if (coluna && primeiraLinha) {
        resultado.insertId = Number(primeiraLinha[coluna]);
      }
    }

    return [resultado, resultado.fields];
  } catch (err) {
    throw traduzirErro(err);
  }
}

// Emula o suficiente da conexão do mysql2 pra segurar as transações
function abrirConexao(client) {
  return {
    query: (sql, params = []) => executar(client, sql, params),
    beginTransaction: () => client.query("BEGIN"),
    commit: () => client.query("COMMIT"),
    rollback: () => client.query("ROLLBACK"),
    ping: () => client.query("SELECT 1"),
    release: () => client.release(),
  };
}

async function getConnection() {
  return abrirConexao(await pgPool.connect());
}

async function query(sql, params = []) {
  const client = await pgPool.connect();

  try {
    return await executar(client, sql, params);
  } finally {
    // Sempre devolve pro pool, até quando a query explode
    client.release();
  }
}

async function testConnection() {
  let connection;

  try {
    connection = await getConnection();

    await connection.ping();

    console.log("Conectado ao banco");
  } catch (err) {
    console.error("Erro ao conectar com o banco: ");
    console.error(err.message);
  } finally {
    connection?.release();
  }
}

testConnection();

// O nome "pool" continua igual pra não assustar quem já importa ele
const pool = { query, getConnection };

export default pool;

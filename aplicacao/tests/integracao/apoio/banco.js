import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { configuracaoTeste } from "./ambiente";

const ARQUIVO_DDL = fileURLToPath(
  new URL(
    "../../../../DataBase_Meteor/Cosmos DDL PostgreSQL.sql",
    import.meta.url,
  ),
);

const ARQUIVO_SEED = fileURLToPath(
  new URL(
    "../../../../DataBase_Meteor/Cosmos INSERTS PostgreSQL.sql",
    import.meta.url,
  ),
);

export const poolTeste = new pg.Pool({
  ...configuracaoTeste,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

function semBom(texto) {
  return texto.replace(/^\uFEFF/, "");
}

async function lerSql(caminho) {
  return semBom(await readFile(caminho, "utf8"));
}

// Recria o schema e aplica o seed oficial do projeto
export async function prepararBanco() {
  const [ddl, seed] = await Promise.all([
    lerSql(ARQUIVO_DDL),
    lerSql(ARQUIVO_SEED),
  ]);

  const client = await poolTeste.connect();

  try {
    await client.query(ddl);
    await client.query(seed);

    // O seed nasce com primeiroAcesso = true, o que bloquearia as rotas
    // No banco de teste a gente já considera os usuários "apresentados"
    await client.query("UPDATE usuarios SET primeiroAcesso = false");
  } finally {
    client.release();
  }
}

export async function consultar(sql, params = []) {
  const { rows } = await poolTeste.query(sql, params);

  return rows;
}

export async function um(sql, params = []) {
  const rows = await consultar(sql, params);

  return rows[0] ?? null;
}

export async function fecharBanco() {
  await poolTeste.end();
}

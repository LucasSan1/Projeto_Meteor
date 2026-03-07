import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();

    await connection.ping();

    console.log("Conectado ao banco");

    connection.release();
  } catch (err) {
    console.error("Erro ao conectar com o banco: ");
    console.error(err.message);
  }
}

testConnection();

export default pool;
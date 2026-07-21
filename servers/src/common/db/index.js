import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "zhixiang_cloud",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const query = async (sql, params = []) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

export const queryOne = async (sql, params = []) => {
  const rows = await query(sql, params);
  return rows[0] ?? null;
};

export const execute = async (sql, params = []) => {
  const [result] = await pool.execute(sql, params);
  return result;
};

export const transaction = async (callback) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export default pool;

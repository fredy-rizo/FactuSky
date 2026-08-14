import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 10,
});

export const MySQL = async () => {
  try {
    const connection = await db.getConnection();
    console.log("MySQL Connected");
    connection.release();
  } catch (err) {
    console.error("Error al conectar MySQL", err);
    process.exit(1);
  }
};

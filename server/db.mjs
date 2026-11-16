import mysql from "mysql2/promise";

// 앱 전용 계정(chiikawa_app)으로 접속: SELECT + quiz_attempts INSERT 만 가능
export const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "chiikawa_study",
  charset: "utf8mb4",
  connectionLimit: 5,
  dateStrings: true, // posted_at 을 'YYYY-MM-DD' 문자열로 (시간대 변환 방지)
});

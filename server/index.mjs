// 실행: npm run dev  (http://localhost:3000)
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./db.mjs";
import { scenesRouter } from "./routes/scenes.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT || 3000);

const app = express();
app.use(express.json({ limit: "10kb" }));

app.use("/api/scenes", scenesRouter);
app.use("/api", (_req, res) => res.status(404).json({ error: "없는 API" }));

// 프론트(HTML/JS/CSS)와 장면 이미지
app.use(express.static(path.join(ROOT, "public")));

// 에러 응답에 DB 정보 등 내부 내용을 싣지 않는다
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "서버 오류" });
});

try {
  await pool.query("SELECT 1");
} catch (e) {
  console.error(`DB 접속 실패 (${e.code ?? e.message}) — .env 의 DB_* 값과 MySQL 실행 여부를 확인하세요.`);
  await pool.end();
  process.exitCode = 1;
}

if (!process.exitCode) {
  app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
}

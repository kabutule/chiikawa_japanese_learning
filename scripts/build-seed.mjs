// data/scenes/*.json → db/seed.sql
// 실행: npm run build:seed   (적용: mysql -u root -p chiikawa_study < db/seed.sql)
//
// 다시 실행해도 안전함: 해당 장면들을 지우고(CASCADE) 다시 넣는다.
// ID 는 JSON 의 장면 id 기준으로 고정 (이미지 = id*100+n, 퀴즈 = id*100+n) → URL/기록이 시드 재실행에도 유지됨.
import { writeFile, access } from "node:fs/promises";
import path from "node:path";
import { ROOT, loadScenes, validateScenes } from "./lib/scenes.mjs";

const LAYER_ORDER = ["ko", "furigana", "ja"]; // 번역본 → 요미가나 → 원문

function q(v) {
  if (v == null) return "NULL"; // 빈 문자열은 '' 로 (NULL 이 필요하면 호출부에서 || null)
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  return "'" + String(v).replace(/\\/g, "\\\\").replace(/'/g, "''") + "'";
}

const scenes = await loadScenes();
const { errors, warnings } = validateScenes(scenes);
warnings.forEach((w) => console.warn("경고:", w));
if (errors.length) {
  errors.forEach((e) => console.error("오류:", e));
  console.error(`\n오류 ${errors.length}건 — seed.sql 을 만들지 않았습니다.`);
  process.exit(1);
}

// 이미지 파일 존재 확인 (/images/... → public/images/...). 외부 URL 은 건너뜀.
for (const { file, data: s } of scenes) {
  for (const layer of LAYER_ORDER) {
    const url = s.images[layer];
    if (/^https?:\/\//.test(url)) continue;
    try {
      await access(path.join(ROOT, "public", url));
    } catch {
      console.warn(`경고: ${file}: 이미지 없음 public${url}`);
    }
  }
}

const out = [];
out.push("-- 자동 생성 파일: scripts/build-seed.mjs 로 다시 만드세요. 직접 수정 금지.");
out.push("SET NAMES utf8mb4;");
out.push("USE chiikawa_study;");
out.push("START TRANSACTION;");
out.push("");
out.push(`DELETE FROM scenes WHERE id IN (${scenes.map((s) => s.data.id).join(", ")});`);

for (const { data: s } of scenes) {
  out.push("");
  out.push(`-- ===== 장면 ${s.id}: ${s.title.replace(/\n/g, " ")}`);
  out.push(
    `INSERT INTO scenes (id, title, source_url, posted_at, level, sort_order) VALUES (${[s.id, s.title, s.source_url || null, s.posted_at, s.level, s.sort_order ?? 0].map(q).join(", ")});`
  );

  LAYER_ORDER.forEach((layer, i) => {
    out.push(
      `INSERT INTO scene_images (id, scene_id, layer, image_url, sort_order) VALUES (${[s.id * 100 + i + 1, s.id, layer, s.images[layer], i + 1].map(q).join(", ")});`
    );
  });

  s.lines.forEach((l, i) => {
    out.push(
      `INSERT INTO scene_lines (scene_id, sort_order, ja_text, reading, ko_text) VALUES (${[s.id, i + 1, l.ja, l.reading || null, l.ko || null].map(q).join(", ")});`
    );
  });

  for (const v of s.vocab ?? []) {
    out.push(
      `INSERT INTO vocab (surface, reading, meaning, kind, jlpt_level) VALUES (${[v.surface, v.reading ?? "", v.meaning, v.kind, v.jlpt_level].map(q).join(", ")}) ` +
        `ON DUPLICATE KEY UPDATE meaning = VALUES(meaning), kind = VALUES(kind), jlpt_level = VALUES(jlpt_level);`
    );
    out.push(
      `INSERT INTO scene_vocab (scene_id, vocab_id) SELECT ${s.id}, id FROM vocab WHERE surface = ${q(v.surface)} AND reading = ${q(v.reading ?? "")};`
    );
  }

  s.quizzes.forEach((qz, i) => {
    const quizId = s.id * 100 + i + 1;
    out.push(
      `INSERT INTO quizzes (id, scene_id, type, question, sort_order) VALUES (${[quizId, s.id, qz.type, qz.question, i + 1].map(q).join(", ")});`
    );
    out.push(
      `INSERT INTO quiz_answers (quiz_id, answers, explanation) VALUES (${quizId}, ${q(JSON.stringify(qz.answers))}, ${q(qz.explanation || null)});`
    );
  });
}

out.push("");
out.push("COMMIT;");

const outPath = path.join(ROOT, "db", "seed.sql");
await writeFile(outPath, out.join("\n") + "\n", "utf8");
console.log(`\n${scenes.length}개 장면 → db/seed.sql (경고 ${warnings.length}건)`);

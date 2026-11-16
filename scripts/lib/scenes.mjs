// 장면 JSON 읽기 + 검증 (build-seed, gen-explanations 공용)
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const SCENES_DIR = path.join(ROOT, "data", "scenes");

const LAYERS = ["ko", "furigana", "ja"];
const KINDS = ["kanji", "word"];
const QUIZ_TYPES = ["short_answer", "diff"];

// 스키마의 VARCHAR 길이와 맞춤
const MAX = { title: 200, source_url: 500, image_url: 500, line: 500, surface: 50, reading: 100, meaning: 200, question: 300 };

export async function loadScenes() {
  const files = (await readdir(SCENES_DIR)).filter((f) => f.endsWith(".json")).sort();
  const scenes = [];
  for (const file of files) {
    const filePath = path.join(SCENES_DIR, file);
    let data;
    try {
      data = JSON.parse(await readFile(filePath, "utf8"));
    } catch (e) {
      throw new Error(`${file}: JSON 파싱 실패 — ${e.message}`);
    }
    scenes.push({ file, filePath, data });
  }
  return scenes;
}

export async function saveScene(scene) {
  await writeFile(scene.filePath, JSON.stringify(scene.data, null, 2) + "\n", "utf8");
}

/** errors: 시드 생성을 막는 문제 / warnings: 시드는 만들되 알려줄 것 */
export function validateScenes(scenes) {
  const errors = [];
  const warnings = [];
  const seenIds = new Map();

  for (const { file, data: s } of scenes) {
    const err = (msg) => errors.push(`${file}: ${msg}`);
    const warn = (msg) => warnings.push(`${file}: ${msg}`);
    const str = (v, field, max, { required = true } = {}) => {
      if (v == null || v === "") {
        if (required) err(`${field} 비어 있음`);
        return;
      }
      if (typeof v !== "string") return err(`${field} 는 문자열이어야 함`);
      if ([...v].length > max) err(`${field} 길이 ${[...v].length} > ${max}`);
      if (/\bTODO\b/.test(v)) warn(`${field} 에 TODO 남아 있음`);
    };

    if (!Number.isInteger(s.id) || s.id < 1) err("id 는 1 이상의 정수");
    else if (seenIds.has(s.id)) err(`id ${s.id} 가 ${seenIds.get(s.id)} 와 중복`);
    else seenIds.set(s.id, file);

    str(s.title, "title", MAX.title);
    str(s.source_url, "source_url", MAX.source_url, { required: false });
    if (s.posted_at != null && !/^\d{4}-\d{2}-\d{2}$/.test(s.posted_at)) err("posted_at 형식은 YYYY-MM-DD 또는 null");
    if (!Number.isInteger(s.level) || s.level < 1 || s.level > 255) err("level 은 1~255 정수");

    for (const layer of LAYERS) str(s.images?.[layer], `images.${layer}`, MAX.image_url);

    if (!Array.isArray(s.lines) || s.lines.length === 0) err("lines 가 비어 있음");
    else
      s.lines.forEach((l, i) => {
        str(l.ja, `lines[${i}].ja`, MAX.line);
        str(l.reading, `lines[${i}].reading`, MAX.line, { required: false });
        str(l.ko, `lines[${i}].ko`, MAX.line, { required: false });
        if (!l.reading) warn(`lines[${i}].reading 비어 있음`);
        if (!l.ko) warn(`lines[${i}].ko 비어 있음`);
      });

    if (!Array.isArray(s.vocab) || s.vocab.length === 0) warn("vocab 이 비어 있음");
    else {
      const keys = new Set();
      s.vocab.forEach((v, i) => {
        str(v.surface, `vocab[${i}].surface`, MAX.surface);
        str(v.reading, `vocab[${i}].reading`, MAX.reading, { required: false });
        str(v.meaning, `vocab[${i}].meaning`, MAX.meaning);
        if (!KINDS.includes(v.kind)) err(`vocab[${i}].kind 는 ${KINDS.join("|")}`);
        if (v.jlpt_level != null && !(Number.isInteger(v.jlpt_level) && v.jlpt_level >= 1 && v.jlpt_level <= 5))
          err(`vocab[${i}].jlpt_level 는 1~5 또는 null`);
        const key = `${v.surface}\u0000${v.reading ?? ""}`;
        if (keys.has(key)) err(`vocab[${i}] (${v.surface}/${v.reading}) 중복`);
        keys.add(key);
      });
    }

    if (!Array.isArray(s.quizzes) || s.quizzes.length === 0) err("quizzes 가 비어 있음");
    else
      s.quizzes.forEach((q, i) => {
        if (!QUIZ_TYPES.includes(q.type)) err(`quizzes[${i}].type 는 ${QUIZ_TYPES.join("|")}`);
        if (q.type === "diff") err(`quizzes[${i}]: diff 퀴즈는 아직 지원 안 함 (작업 순서상 잘라낼 1순위)`);
        str(q.question, `quizzes[${i}].question`, MAX.question);
        if (!Array.isArray(q.answers) || q.answers.length === 0 || q.answers.some((a) => typeof a !== "string" || !a.trim()))
          err(`quizzes[${i}].answers 는 비어 있지 않은 문자열 배열`);
        if (!q.explanation) warn(`quizzes[${i}].explanation 없음 — npm run gen:explanations 로 생성`);
      });
  }
  return { errors, warnings };
}

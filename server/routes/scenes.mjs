import { Router } from "express";
import { pool } from "../db.mjs";

// 장면 조회 API. 정답·해설(quiz_answers)은 여기서 절대 읽지 않는다 — 채점 API 에서만.
export const scenesRouter = Router();

// GET /api/scenes — 장면 목록
scenesRouter.get("/", async (_req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT id, title, level FROM scenes ORDER BY sort_order, id");
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// GET /api/scenes/:id — 장면 1개 (이미지 레이어, 대사, 단어, 퀴즈 질문)
scenesRouter.get("/:id", async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: "잘못된 장면 id" });

  try {
    const [[scene]] = await pool.query(
      "SELECT id, title, source_url, posted_at, level FROM scenes WHERE id = ?",
      [id]
    );
    if (!scene) return res.status(404).json({ error: "장면을 찾을 수 없음" });

    const [[images], [lines], [vocab], [quizzes]] = await Promise.all([
      pool.query(
        "SELECT layer, image_url AS url FROM scene_images WHERE scene_id = ? AND layer <> 'quiz_variant' ORDER BY sort_order, id",
        [id]
      ),
      pool.query("SELECT ja_text AS ja, reading, ko_text AS ko FROM scene_lines WHERE scene_id = ? ORDER BY sort_order, id", [id]),
      pool.query(
        `SELECT v.surface, v.reading, v.meaning, v.kind, v.jlpt_level
           FROM scene_vocab sv JOIN vocab v ON v.id = sv.vocab_id
          WHERE sv.scene_id = ?
          ORDER BY v.kind = 'kanji', v.id`,
        [id]
      ),
      pool.query("SELECT id, type, question FROM quizzes WHERE scene_id = ? ORDER BY sort_order, id", [id]),
    ]);

    res.json({ ...scene, images, lines, vocab, quizzes });
  } catch (e) {
    next(e);
  }
});

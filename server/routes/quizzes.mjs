import { Router } from "express";
import { pool } from "../db.mjs";
import { matchesAnswer, containsAnswer } from "../lib/normalize.mjs";
import { aiJudge } from "../lib/aiJudge.mjs";
import { rateLimit } from "../lib/rateLimit.mjs";

export const quizzesRouter = Router();

const GENERIC_HINT = "대사와 학습 단어 목록을 다시 한번 살펴보세요.";
const FALLBACK_HINT = "지금은 자세한 채점이 어려워요. 단어 목록을 다시 확인하고, 허용되는 표기(일본어 또는 한국어)로 입력해 보세요.";
const ERROR_TYPES = new Set(["vocab", "reading", "context"]);
const CLIENT_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * POST /api/quizzes/:id/answer
 * body: { answer: string, client_id?: string }
 * 응답: { correct, judged_by: "exact"|"ai"|"fallback", explanation?, alt_note?, hint?, error_type? }
 * 정답 목록(answers)은 어떤 경우에도 응답에 넣지 않는다.
 */
quizzesRouter.post("/:id/answer", rateLimit({ windowMs: 60_000, max: 20 }), async (req, res, next) => {
  const quizId = Number(req.params.id);
  if (!Number.isSafeInteger(quizId) || quizId < 1) return res.status(400).json({ error: "잘못된 퀴즈 id" });

  const submitted = typeof req.body?.answer === "string" ? req.body.answer.trim() : "";
  if (!submitted) return res.status(400).json({ error: "답을 입력해 주세요." });
  if ([...submitted].length > 300) return res.status(400).json({ error: "답이 너무 길어요 (300자 이내)." });

  const rawClientId = req.body?.client_id;
  const clientId = typeof rawClientId === "string" && CLIENT_ID_RE.test(rawClientId) ? rawClientId : null;

  try {
    const [[quiz]] = await pool.query(
      `SELECT q.id, q.scene_id, q.type, q.question, a.answers, a.explanation
         FROM quizzes q JOIN quiz_answers a ON a.quiz_id = q.id
        WHERE q.id = ?`,
      [quizId]
    );
    if (!quiz) return res.status(404).json({ error: "퀴즈를 찾을 수 없음" });
    if (quiz.type !== "short_answer") return res.status(400).json({ error: "이 퀴즈 유형은 아직 지원하지 않아요." });

    // mysql2 는 JSON 컬럼을 이미 파싱해서 준다 (드라이버 설정에 따라 문자열일 수도 있어 둘 다 처리)
    const answers = typeof quiz.answers === "string" ? JSON.parse(quiz.answers) : quiz.answers;

    let result;

    // 1) 정규화 후 정확히 일치 → AI 호출 없이 정답
    if (matchesAnswer(submitted, answers)) {
      result = { correct: true, judged_by: "exact", explanation: quiz.explanation };
    } else {
      // 2) 불일치 → AI 판정
      try {
        const [[lines], [vocab]] = await Promise.all([
          pool.query("SELECT ja_text AS ja, reading, ko_text AS ko FROM scene_lines WHERE scene_id = ? ORDER BY sort_order, id", [quiz.scene_id]),
          pool.query(
            `SELECT v.surface, v.reading, v.meaning FROM scene_vocab sv JOIN vocab v ON v.id = sv.vocab_id WHERE sv.scene_id = ?`,
            [quiz.scene_id]
          ),
        ]);
        const ai = await aiJudge({ lines, vocab, question: quiz.question, answers, submitted });

        if (ai.is_correct) {
          // 3) 의미상 정답 → 해설 + "이렇게도 표현해요"
          result = { correct: true, judged_by: "ai", explanation: quiz.explanation, alt_note: ai.alt_note?.trim() || undefined };
        } else {
          // 4) 오답 → 힌트. 힌트에 정답이 들어 있으면 일반 힌트로 대체
          let hint = ai.hint?.trim() || GENERIC_HINT;
          if (containsAnswer(hint, answers)) hint = GENERIC_HINT;
          result = {
            correct: false,
            judged_by: "ai",
            hint,
            error_type: ERROR_TYPES.has(ai.error_type) ? ai.error_type : undefined,
          };
        }
      } catch (e) {
        // AI 실패·지연 → 화면이 멈추지 않게 대체 응답
        console.warn(`AI 채점 실패 (quiz ${quizId}): ${e.name}: ${e.message}`);
        result = { correct: false, judged_by: "fallback", hint: FALLBACK_HINT };
      }
    }

    // 5) 기록 (실패해도 채점 결과는 돌려준다)
    pool
      .query(
        `INSERT INTO quiz_attempts (quiz_id, client_id, submitted, is_correct, ai_judged, error_type, hint)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [quizId, clientId, submitted, result.correct, result.judged_by === "ai", result.error_type ?? null, result.hint ?? null]
      )
      .catch((e) => console.error(`quiz_attempts 기록 실패 (quiz ${quizId}):`, e.message));

    res.json(result);
  } catch (e) {
    next(e);
  }
});

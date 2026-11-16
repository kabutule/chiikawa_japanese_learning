// 퀴즈 정답 해설을 OpenAI API 로 미리 생성해 data/scenes/*.json 에 써 넣는다.
// 실행: npm run gen:explanations          (explanation 이 비어 있는 퀴즈만)
//       npm run gen:explanations -- --force (전부 다시 생성)
//
// 필요: .env 에 OPENAI_API_KEY (모델은 OPENAI_MODEL 로 바꿀 수 있음)
// 생성 결과는 JSON 파일에 저장되므로 git diff 로 검토한 뒤 커밋하고, 그다음 build:seed 를 돌린다.
import OpenAI from "openai";
import { loadScenes, saveScene, validateScenes } from "./lib/scenes.mjs";

const MODEL = process.env.OPENAI_MODEL || "gpt-5.5";
const force = process.argv.includes("--force");

const INSTRUCTIONS = `당신은 한국인 일본어 초급 학습자를 위한 해설을 쓰는 선생님입니다.
학습자는 짧은 만화 장면을 보고 주관식 퀴즈를 맞힌 직후 "왜 정답일까?" 를 눌러 이 해설을 봅니다.

해설 작성 규칙:
- 한국어로 2~4문장. 친근한 존댓말. 해설 본문만 출력하고 제목·머리말·마크다운은 쓰지 마세요.
- 정답이 장면의 어느 대사에서 나오는지 짚고, 핵심 일본어 표현의 읽기(히라가나)와 뜻을 알려 주세요.
- 문법이나 뉘앙스 포인트가 하나 있으면 덧붙이되, 장면에 없는 내용을 지어내지 마세요.
- 제공된 대사·단어 정보가 정답과 맞지 않아 보이면 추측하지 말고 해설 첫머리에 "[확인 필요]" 를 붙이세요.`;

function buildInput(scene, quiz) {
  const lines = scene.lines
    .map((l, i) => `${i + 1}. ${l.ja}${l.reading ? ` (${l.reading})` : ""}${l.ko ? ` — ${l.ko}` : ""}`)
    .join("\n");
  const vocab = (scene.vocab ?? []).map((v) => `- ${v.surface} (${v.reading || "-"}): ${v.meaning}`).join("\n");
  return `<scene_lines>
${lines}
</scene_lines>

<vocab>
${vocab || "(없음)"}
</vocab>

<quiz>
질문: ${quiz.question}
허용 정답: ${quiz.answers.join(", ")}
</quiz>

이 퀴즈의 정답 해설을 작성해 주세요.`;
}

if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY 가 없습니다. .env.example 을 복사해 .env 를 만들고 키를 넣어 주세요.");
  process.exit(1);
}

const scenes = await loadScenes();
const { errors } = validateScenes(scenes);
if (errors.length) {
  errors.forEach((e) => console.error("오류:", e));
  console.error("장면 데이터 오류부터 고쳐 주세요.");
  process.exit(1);
}

const client = new OpenAI();
let generated = 0;
let failed = 0;
let authFailed = false;

outer: for (const scene of scenes) {
  let changed = false;
  for (const [i, quiz] of scene.data.quizzes.entries()) {
    if (quiz.explanation && !force) continue;
    if (quiz.answers.some((a) => /\bTODO\b/.test(a)) || /\bTODO\b/.test(quiz.question)) {
      console.log(`건너뜀: ${scene.file} quizzes[${i}] (TODO 남아 있음)`);
      continue;
    }

    const label = `${scene.file} quizzes[${i}]`;
    try {
      const response = await client.responses.create({
        model: MODEL,
        instructions: INSTRUCTIONS,
        input: buildInput(scene.data, quiz),
      });

      // 거절·빈 응답이면 output_text 가 비어 있음
      const text = response.output_text?.trim();
      if (!text) {
        console.error(`실패: ${label} — 빈 응답 (status=${response.status})`);
        failed++;
        continue;
      }

      quiz.explanation = text;
      changed = true;
      generated++;
      console.log(`생성: ${label}\n  ${text}\n`);
    } catch (e) {
      if (e instanceof OpenAI.AuthenticationError) {
        console.error("인증 실패: .env 의 OPENAI_API_KEY 를 확인해 주세요.");
        authFailed = true;
        break outer; // process.exit() 는 열린 연결 때문에 Windows 에서 Node 가 죽을 수 있어 쓰지 않음
      }
      if (e instanceof OpenAI.RateLimitError) console.error(`실패: ${label} — 요청 한도 초과 또는 크레딧 부족, 잠시 후 다시 실행`);
      else if (e instanceof OpenAI.APIError) console.error(`실패: ${label} — API 오류 ${e.status}: ${e.message}`);
      else console.error(`실패: ${label} — ${e.message}`);
      failed++;
    }
  }
  // 장면 단위로 저장 (중간에 멈춰도 끝난 장면은 남음)
  if (changed) await saveScene(scene);
}

if (authFailed) {
  process.exitCode = 1;
} else {
  console.log(`완료: 생성 ${generated}건, 실패 ${failed}건 (모델 ${MODEL}). git diff data/scenes 로 검토 후 npm run build:seed`);
  if (failed) process.exitCode = 1;
}

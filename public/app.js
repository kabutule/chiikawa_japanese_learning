// 장면 목록(#/) + 장면 화면(#/scenes/:id). 빌드 없이 쓰는 순수 JS.
const app = document.getElementById("app");

const LAYER_LABEL = { ko: "번역", furigana: "요미가나", ja: "원문" };

// 문자열을 HTML 에 넣을 때는 반드시 이걸로 (데이터에 < & 가 있어도 안전)
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

async function api(path) {
  const res = await fetch(`/api${path}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `요청 실패 (${res.status})`);
  return body;
}

let sceneListCache = null;
const getSceneList = async () => (sceneListCache ??= await api("/scenes"));

function showStatus(msg, isError = false) {
  app.innerHTML = `<p class="status${isError ? " error" : ""}">${esc(msg)}</p>`;
}

// ---------- 장면 목록 ----------
async function renderList() {
  showStatus("불러오는 중…");
  const scenes = await getSceneList();
  if (!scenes.length) return showStatus("등록된 장면이 없어요.");
  app.innerHTML = `
    <h1>장면 고르기</h1>
    <ul class="scene-list">
      ${scenes
        .map((s) => `<li><a href="#/scenes/${s.id}"><span>${esc(s.title)}</span><span class="level">Lv.${esc(s.level)}</span></a></li>`)
        .join("")}
    </ul>`;
}

// ---------- 장면 화면 ----------
async function renderScene(id) {
  showStatus("불러오는 중…");
  const [scene, list] = await Promise.all([api(`/scenes/${id}`), getSceneList()]);

  // 같은 이미지를 두 레이어가 가리키면(예: 번역+요미가나 합본) 한 번만 보여준다
  const layers = [];
  for (const img of scene.images) {
    const prev = layers.at(-1);
    if (prev && prev.url === img.url) prev.labels.push(LAYER_LABEL[img.layer] ?? img.layer);
    else layers.push({ url: img.url, labels: [LAYER_LABEL[img.layer] ?? img.layer] });
  }
  // 다음 레이어로 넘길 때 바로 뜨도록 미리 로드
  layers.forEach((l) => (new Image().src = l.url));

  const idx = list.findIndex((s) => s.id === scene.id);
  const prevScene = list[idx - 1];
  const nextScene = list[idx + 1];

  app.innerHTML = `
    <h1>${esc(scene.title)}</h1>

    <div class="viewer" id="viewer">
      <img id="layer-img" alt="">
      <span class="layer-tag" id="layer-tag"></span>
      <button class="nav prev" id="prev" aria-label="이전 이미지">‹</button>
      <button class="nav next" id="next" aria-label="다음 이미지">›</button>
    </div>
    <div class="dots" id="dots">
      ${layers.map((l, i) => `<button data-i="${i}">${esc(l.labels.join("+"))}</button>`).join("")}
    </div>

    <h2>대사</h2>
    <ul class="lines">
      ${scene.lines
        .map(
          (l) => `<li>
            <div class="ja" lang="ja">${esc(l.ja)}</div>
            ${l.reading ? `<div class="reading" lang="ja">${esc(l.reading)}</div>` : ""}
            ${l.ko ? `<div class="ko">${esc(l.ko)}</div>` : ""}
          </li>`
        )
        .join("")}
    </ul>

    <h2>학습 단어</h2>
    <div class="vocab">
      ${scene.vocab
        .map(
          (v) => `<div class="word ${v.kind}">
            <div class="surface" lang="ja">${esc(v.surface)}</div>
            ${v.reading ? `<div class="reading" lang="ja">${esc(v.reading)}</div>` : ""}
            <div>${esc(v.meaning)}</div>
            <div class="meta">${v.kind === "kanji" ? "한자" : "단어"}${v.jlpt_level ? ` · N${esc(v.jlpt_level)}` : ""}</div>
          </div>`
        )
        .join("")}
    </div>

    <h2>퀴즈</h2>
    <div class="quizzes">
      ${scene.quizzes
        .map(
          (q, i) => `<form class="quiz" data-quiz-id="${esc(q.id)}" novalidate>
            <label class="question" for="quiz-${esc(q.id)}"><span class="qnum">Q${i + 1}</span>${esc(q.question)}</label>
            <div class="answer-row">
              <input id="quiz-${esc(q.id)}" name="answer" type="text" maxlength="300" autocomplete="off"
                     autocapitalize="off" spellcheck="false" placeholder="일본어나 한국어로 입력" required>
              <button type="submit">제출</button>
            </div>
            <div class="result" aria-live="polite"></div>
          </form>`
        )
        .join("")}
    </div>

    <nav class="scene-nav">
      ${prevScene ? `<a href="#/scenes/${prevScene.id}">‹ ${esc(prevScene.title)}</a>` : "<span></span>"}
      ${nextScene ? `<a href="#/scenes/${nextScene.id}">${esc(nextScene.title)} ›</a>` : "<span></span>"}
    </nav>`;

  setupViewer(layers);
  document.querySelectorAll("form.quiz").forEach(setupQuiz);
}

// ---------- 퀴즈 ----------
// 비로그인 풀이 기록용 랜덤 id. 저장이 막힌 환경이면 이번 접속 동안만 쓴다.
const clientId = (() => {
  try {
    let id = localStorage.getItem("client_id");
    if (!id) localStorage.setItem("client_id", (id = crypto.randomUUID()));
    return id;
  } catch {
    return crypto.randomUUID();
  }
})();

const ERROR_TYPE_LABEL = { vocab: "단어 뜻", reading: "읽기", context: "문맥" };
const CLIENT_TIMEOUT_MS = 15000; // 서버 AI 타임아웃(10초)보다 길게

async function submitAnswer(quizId, answer) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CLIENT_TIMEOUT_MS);
  try {
    const res = await fetch(`/api/quizzes/${quizId}/answer`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ answer, client_id: clientId }),
      signal: ctrl.signal,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `채점 요청 실패 (${res.status})`);
    return body;
  } catch (e) {
    if (e.name === "AbortError") throw new Error("채점이 오래 걸리고 있어요. 잠시 후 다시 제출해 주세요.");
    if (e instanceof TypeError) throw new Error("서버에 연결할 수 없어요. 인터넷 연결을 확인해 주세요.");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

function renderResult(r) {
  if (r.correct) {
    return `
      <p class="verdict ok">정답이에요!</p>
      ${r.alt_note ? `<p class="alt-note">${esc(r.alt_note)}</p>` : ""}
      ${
        r.explanation
          ? `<details class="explain"><summary>왜 정답일까?</summary><p>${esc(r.explanation)}</p></details>`
          : ""
      }`;
  }
  const type = ERROR_TYPE_LABEL[r.error_type];
  return `
    <p class="verdict ng">아쉬워요, 다시 해 볼까요?</p>
    <p class="hint">${type ? `<span class="tag">${esc(type)}</span>` : ""}${esc(r.hint)}</p>`;
}

function setupQuiz(form) {
  const input = form.elements.answer;
  const button = form.querySelector("button");
  const result = form.querySelector(".result");

  // 일본어 IME 변환 확정용 Enter 로 제출되지 않게
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.isComposing || e.keyCode === 229)) e.preventDefault();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const answer = input.value.trim();
    if (!answer) {
      result.innerHTML = `<p class="hint">답을 입력해 주세요.</p>`;
      input.focus();
      return;
    }

    button.disabled = true;
    input.readOnly = true;
    button.textContent = "채점 중…";
    result.innerHTML = `<p class="loading"><span class="spinner" aria-hidden="true"></span>채점하고 있어요</p>`;

    try {
      const r = await submitAnswer(form.dataset.quizId, answer);
      result.innerHTML = renderResult(r);
      form.classList.toggle("solved", r.correct);
      if (r.correct) {
        button.textContent = "정답";
        return; // 맞힌 퀴즈는 잠가 둔다
      }
      input.select();
    } catch (err) {
      result.innerHTML = `<p class="hint error">${esc(err.message)}</p>`;
    }
    button.disabled = false;
    input.readOnly = false;
    button.textContent = "제출";
  });
}

function setupViewer(layers) {
  const img = document.getElementById("layer-img");
  const tag = document.getElementById("layer-tag");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const dots = [...document.querySelectorAll("#dots button")];
  const viewer = document.getElementById("viewer");
  let current = 0;

  function show(i) {
    current = Math.max(0, Math.min(layers.length - 1, i));
    const layer = layers[current];
    img.src = layer.url;
    img.alt = `${layer.labels.join("+")} 이미지`;
    tag.textContent = layer.labels.join("+");
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === layers.length - 1;
    dots.forEach((d, j) => d.setAttribute("aria-current", String(j === current)));
  }

  prevBtn.onclick = () => show(current - 1);
  nextBtn.onclick = () => show(current + 1);
  dots.forEach((d) => (d.onclick = () => show(Number(d.dataset.i))));

  // 가로 스와이프 (터치·마우스 공통)
  let startX = null;
  viewer.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    startX = e.clientX;
  });
  viewer.addEventListener("pointerup", (e) => {
    if (startX == null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) show(current + (dx < 0 ? 1 : -1));
  });
  viewer.addEventListener("pointercancel", () => (startX = null));

  show(0);
}

// 키보드 ← → 로도 넘기기
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") document.getElementById("prev")?.click();
  if (e.key === "ArrowRight") document.getElementById("next")?.click();
});

// ---------- 라우터 ----------
async function route() {
  const m = location.hash.match(/^#\/scenes\/(\d+)$/);
  try {
    if (m) await renderScene(m[1]);
    else await renderList();
    window.scrollTo(0, 0);
  } catch (e) {
    showStatus(e.message, true);
  }
}

window.addEventListener("hashchange", route);
route();

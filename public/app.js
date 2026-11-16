// 장면 목록(#/) + 장면 화면(#/scenes/:id). 빌드 없이 쓰는 순수 JS.
//
// 장면 화면은 4단계로 진행한다.
//   learn  (익히기)  모든 이미지 레이어 + 대사 + 단어를 보며 외운다
//   cards  (카드)    단어·대사 카드를 뒤집으며 스스로 확인. 헷갈린 카드는 다시 나온다
//   quiz   (퀴즈)    원문 이미지만 남기고 대사·단어를 숨긴 채 답을 떠올려 입력
//   review (확인)    결과 요약 + 숨겼던 정보 다시 공개, 다시 풀기 / 다음 장면
const app = document.getElementById("app");

const LAYER_LABEL = { ko: "번역", furigana: "요미가나", ja: "원문" };
const ERROR_TYPE_LABEL = { vocab: "단어 뜻", reading: "읽기", context: "문맥" };
const CLIENT_TIMEOUT_MS = 15000; // 서버 AI 타임아웃(10초)보다 길게

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
// 같은 이미지를 두 레이어가 가리키면(예: 번역+요미가나 합본) 한 장으로 합친다
function groupLayers(images) {
  const layers = [];
  for (const img of images) {
    const prev = layers.at(-1);
    const label = LAYER_LABEL[img.layer] ?? img.layer;
    if (prev && prev.url === img.url) prev.labels.push(label);
    else layers.push({ url: img.url, labels: [label], layers: [img.layer] });
  }
  return layers;
}

async function renderScene(id) {
  showStatus("불러오는 중…");
  const [scene, list] = await Promise.all([api(`/scenes/${id}`), getSceneList()]);

  const allLayers = groupLayers(scene.images);
  // 퀴즈 중에는 원문만. 원문이 없으면 마지막 레이어로 대신한다.
  const quizLayers = [allLayers.find((l) => l.layers.includes("ja")) ?? allLayers.at(-1)];
  allLayers.forEach((l) => (new Image().src = l.url)); // 미리 로드

  const idx = list.findIndex((s) => s.id === scene.id);
  const prevScene = list[idx - 1];
  const nextScene = list[idx + 1];

  app.innerHTML = `
    <h1>${esc(scene.title)}</h1>

    <ol class="steps" aria-label="학습 단계">
      <li data-step="learn">익히기</li>
      <li data-step="cards">카드</li>
      <li data-step="quiz">퀴즈</li>
      <li data-step="review">확인</li>
    </ol>

    <div class="phase-actions summary top" data-show="review">
      <p id="summary" class="summary-text"></p>
      <div class="button-row">
        <button class="secondary" id="retry">다시 익히고 풀기</button>
        ${nextScene ? `<a class="primary" href="#/scenes/${nextScene.id}">다음 장면 ›</a>` : `<a class="primary" href="#/">장면 목록</a>`}
      </div>
    </div>

    <div class="viewer" id="viewer">
      <img id="layer-img" alt="">
      <span class="layer-tag" id="layer-tag"></span>
      <button class="nav prev" id="prev" aria-label="이전 이미지">‹</button>
      <button class="nav next" id="next" aria-label="다음 이미지">›</button>
    </div>
    <div class="dots" id="dots"></div>

    <section class="study" id="study">
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
    </section>

    <div class="phase-actions" data-show="learn">
      <p class="note">이미지를 넘겨 보고 대사와 단어를 외워 보세요. 다음은 카드로 확인하고, 퀴즈에서는 원문 그림만 보여요.</p>
      <button class="primary" id="to-cards">다 외웠어요, 카드로 확인하기</button>
    </div>

    <section id="cards-section" data-show="cards">
      <p class="card-progress" id="card-progress"></p>
      <button type="button" class="flashcard" id="flashcard" aria-label="카드 뒤집기">
        <span class="face front" id="card-front"></span>
        <span class="face back" id="card-back"></span>
      </button>
      <div id="card-controls">
        <p class="note center" id="card-tip">떠올려 본 다음 카드를 눌러 뒷면을 확인하세요.</p>
        <div class="button-row" id="card-grade" hidden>
          <button class="secondary" id="card-again">헷갈려요</button>
          <button class="primary" id="card-know">알아요</button>
        </div>
      </div>
      <div class="summary" id="cards-done" hidden>
        <p class="summary-text" id="cards-summary"></p>
        <button class="primary" id="to-quiz">퀴즈 풀기</button>
      </div>
      <button type="button" class="text-button" id="skip-cards">카드 건너뛰고 퀴즈 풀기</button>
    </section>

    <section id="quiz-section" data-show="quiz review">
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
      <div class="phase-actions" data-show="quiz">
        <button class="secondary" id="give-up">모르겠어요, 확인하기</button>
      </div>
    </section>


    <nav class="scene-nav" data-show="learn review">
      ${prevScene ? `<a href="#/scenes/${prevScene.id}">‹ ${esc(prevScene.title)}</a>` : "<span></span>"}
      ${nextScene ? `<a href="#/scenes/${nextScene.id}">${esc(nextScene.title)} ›</a>` : "<span></span>"}
    </nav>`;

  const viewer = createViewer();
  const cards = createCards(buildDeck(scene), () => document.getElementById("to-quiz").focus());
  const forms = [...document.querySelectorAll("form.quiz")];
  // 퀴즈별 상태: 시도 횟수, 정답 여부
  let quizState = new Map();
  const resetQuizState = () => (quizState = new Map(forms.map((f) => [f.dataset.quizId, { tries: 0, solved: false }])));

  function setPhase(phase) {
    app.dataset.phase = phase;
    viewer.setLayers(phase === "quiz" ? quizLayers : allLayers);
    document.querySelectorAll(".steps li").forEach((li) => {
      const order = ["learn", "cards", "quiz", "review"];
      li.classList.toggle("current", li.dataset.step === phase);
      li.classList.toggle("done", order.indexOf(li.dataset.step) < order.indexOf(phase));
    });
    if (phase === "cards") cards.start();
    if (phase === "review") renderSummary();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderSummary() {
    const states = [...quizState.values()];
    const solved = states.filter((s) => s.solved).length;
    const firstTry = states.filter((s) => s.solved && s.tries === 1).length;
    const total = states.length;
    const msg =
      solved === total
        ? `${total}문제를 모두 맞혔어요! 한 번에 맞힌 문제는 ${firstTry}개예요.`
        : `${total}문제 중 ${solved}문제를 맞혔어요. 아래 대사와 단어를 다시 보고 한 번 더 도전해 보세요.`;
    document.getElementById("summary").textContent = msg;
    // 확인 단계에서는 입력을 잠근다
    forms.forEach((f) => {
      f.elements.answer.readOnly = true;
      f.querySelector("button").disabled = true;
    });
  }

  function onQuizResult(quizId, correct) {
    const s = quizState.get(quizId);
    s.tries += 1;
    if (correct) s.solved = true;
    if ([...quizState.values()].every((x) => x.solved)) setTimeout(() => setPhase("review"), 1200);
  }

  forms.forEach((f) => setupQuiz(f, onQuizResult));

  document.getElementById("to-cards").onclick = () => setPhase("cards");
  const startQuiz = () => {
    resetQuizState();
    setPhase("quiz");
    forms[0]?.elements.answer.focus({ preventScroll: true });
  };
  document.getElementById("to-quiz").onclick = startQuiz;
  document.getElementById("skip-cards").onclick = startQuiz;
  document.getElementById("give-up").onclick = () => setPhase("review");
  document.getElementById("retry").onclick = () => {
    forms.forEach(resetQuizForm);
    resetQuizState();
    setPhase("learn");
  };

  resetQuizState();
  setPhase("learn");
}

// ---------- 외우기 카드 ----------
// 학습 단어 + 대사로 카드 덱을 만든다. 단어와 글자가 같은 대사(예: ヤハ)는 한 장만.
function buildDeck(scene) {
  const deck = scene.vocab.map((v) => ({
    kind: v.kind === "kanji" ? "한자" : "단어",
    front: v.surface,
    reading: v.reading,
    meaning: v.meaning,
  }));
  const surfaces = new Set(scene.vocab.map((v) => v.surface));
  for (const l of scene.lines) {
    if (!surfaces.has(l.ja)) deck.push({ kind: "대사", front: l.ja, reading: l.reading, meaning: l.ko });
  }
  return deck;
}

function createCards(deck, onDone) {
  const card = document.getElementById("flashcard");
  const front = document.getElementById("card-front");
  const back = document.getElementById("card-back");
  const progress = document.getElementById("card-progress");
  const tip = document.getElementById("card-tip");
  const grade = document.getElementById("card-grade");
  const controls = document.getElementById("card-controls");
  const done = document.getElementById("cards-done");
  const summary = document.getElementById("cards-summary");
  const skip = document.getElementById("skip-cards");

  let queue = [];
  let knownFirstTry = 0;
  let current = null;

  function show() {
    current = queue[0];
    if (!current) return finish();
    const known = deck.length - new Set(queue.map((c) => c.index)).size;
    progress.textContent = `외운 카드 ${known} / ${deck.length}${current.again ? " · 다시 보는 카드" : ""}`;
    front.innerHTML = `<span class="card-kind">${esc(current.kind)}</span><span class="card-ja" lang="ja">${esc(current.front)}</span>`;
    back.innerHTML = `
      <span class="card-kind">${esc(current.kind)}</span>
      <span class="card-ja small" lang="ja">${esc(current.front)}</span>
      ${current.reading ? `<span class="reading" lang="ja">${esc(current.reading)}</span>` : ""}
      ${current.meaning ? `<span class="card-meaning">${esc(current.meaning)}</span>` : ""}`;
    card.classList.remove("flipped");
    card.setAttribute("aria-pressed", "false");
    tip.hidden = false;
    grade.hidden = true;
  }

  function flip() {
    if (!current) return;
    const flipped = card.classList.toggle("flipped");
    card.setAttribute("aria-pressed", String(flipped));
    tip.hidden = flipped;
    grade.hidden = !flipped;
  }

  function answer(known) {
    const c = queue.shift();
    if (known) {
      if (!c.again) knownFirstTry++;
    } else {
      queue.push({ ...c, again: true }); // 헷갈린 카드는 덱 맨 뒤로
    }
    show();
  }

  function finish() {
    card.hidden = controls.hidden = skip.hidden = true;
    progress.textContent = `외운 카드 ${deck.length} / ${deck.length}`;
    summary.textContent = `${deck.length}장 중 ${knownFirstTry}장은 처음부터 알고 있었어요. 이제 정보 없이 퀴즈를 풀어 봐요!`;
    done.hidden = false;
    onDone();
  }

  card.onclick = flip;
  document.getElementById("card-know").onclick = () => answer(true);
  document.getElementById("card-again").onclick = () => answer(false);

  return {
    start() {
      queue = deck.map((c, index) => ({ ...c, index }));
      knownFirstTry = 0;
      card.hidden = controls.hidden = skip.hidden = false;
      done.hidden = true;
      show();
    },
  };
}

// ---------- 이미지 뷰어 ----------
function createViewer() {
  const img = document.getElementById("layer-img");
  const tag = document.getElementById("layer-tag");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const dotsEl = document.getElementById("dots");
  const viewer = document.getElementById("viewer");
  let layers = [];
  let current = 0;

  function show(i) {
    current = Math.max(0, Math.min(layers.length - 1, i));
    const layer = layers[current];
    img.src = layer.url;
    img.alt = `${layer.labels.join("+")} 이미지`;
    tag.textContent = layer.labels.join("+");
    const single = layers.length < 2;
    prevBtn.hidden = nextBtn.hidden = single;
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === layers.length - 1;
    [...dotsEl.children].forEach((d, j) => d.setAttribute("aria-current", String(j === current)));
  }

  prevBtn.onclick = () => show(current - 1);
  nextBtn.onclick = () => show(current + 1);

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

  return {
    setLayers(next) {
      layers = next;
      dotsEl.innerHTML = layers.length < 2 ? "" : layers.map((l, i) => `<button data-i="${i}">${esc(l.labels.join("+"))}</button>`).join("");
      [...dotsEl.children].forEach((d) => (d.onclick = () => show(Number(d.dataset.i))));
      show(0);
    },
  };
}

// 키보드 ← → 로도 넘기기 (입력 중일 때는 제외)
document.addEventListener("keydown", (e) => {
  if (e.target.closest?.("input, textarea")) return;
  if (e.key === "ArrowLeft") document.getElementById("prev")?.click();
  if (e.key === "ArrowRight") document.getElementById("next")?.click();
});

// ---------- 퀴즈 ----------
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
    <p class="verdict ng">아쉬워요, 다시 떠올려 볼까요?</p>
    <p class="hint">${type ? `<span class="tag">${esc(type)}</span>` : ""}${esc(r.hint)}</p>`;
}

function resetQuizForm(form) {
  form.classList.remove("solved");
  form.elements.answer.value = "";
  form.elements.answer.readOnly = false;
  const button = form.querySelector("button");
  button.disabled = false;
  button.textContent = "제출";
  form.querySelector(".result").innerHTML = "";
}

function setupQuiz(form, onResult) {
  const input = form.elements.answer;
  const button = form.querySelector("button");
  const result = form.querySelector(".result");

  // 일본어 IME 변환 확정용 Enter 로 제출되지 않게
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.isComposing || e.keyCode === 229)) e.preventDefault();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (input.readOnly) return;
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
      onResult(form.dataset.quizId, r.correct);
      if (r.correct) {
        button.textContent = "정답";
        return; // 맞힌 퀴즈는 잠가 둔다
      }
      input.select();
    } catch (err) {
      result.innerHTML = `<p class="hint error">${esc(err.message)}</p>`;
    }
    // 그사이 확인 단계로 넘어갔으면 다시 열지 않는다
    if (app.dataset.phase !== "quiz") return;
    button.disabled = false;
    input.readOnly = false;
    button.textContent = "제출";
  });
}

// ---------- 라우터 ----------
async function route() {
  const m = location.hash.match(/^#\/scenes\/(\d+)$/);
  delete app.dataset.phase;
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

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
    <ol class="quizzes">
      ${scene.quizzes.map((q) => `<li>${esc(q.question)}</li>`).join("")}
    </ol>
    <p class="note">답 입력과 채점은 다음 단계에서 붙어요.</p>

    <nav class="scene-nav">
      ${prevScene ? `<a href="#/scenes/${prevScene.id}">‹ ${esc(prevScene.title)}</a>` : "<span></span>"}
      ${nextScene ? `<a href="#/scenes/${nextScene.id}">${esc(nextScene.title)} ›</a>` : "<span></span>"}
    </nav>`;

  setupViewer(layers);
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

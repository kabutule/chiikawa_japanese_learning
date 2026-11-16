// 답 비교용 정규화.
// - NFKC: 전각/반각, 호환 문자 통일 (ｲﾔｯ → イヤッ, Ａ → A)
// - 가타카나 → 히라가나 (イヤッ == いやっ)
// - 공백·문장부호·기호 제거 (「」、。！？!?~ 등). 장음 ー 는 글자(Lm)라 남는다.
// - 소문자
export function normalize(s) {
  return String(s ?? "")
    .normalize("NFKC")
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/[\p{P}\p{S}\s]/gu, "")
    .toLowerCase();
}

/** 정규화한 입력이 허용 정답 중 하나와 같은지 */
export function matchesAnswer(input, answers) {
  const n = normalize(input);
  return n.length > 0 && answers.some((a) => normalize(a) === n);
}

/** 텍스트 안에 정답 문자열이 (정규화 기준으로) 들어 있는지 — 힌트 유출 검사용 */
export function containsAnswer(text, answers) {
  const n = normalize(text);
  return answers.some((a) => {
    const na = normalize(a);
    return na.length > 0 && n.includes(na);
  });
}

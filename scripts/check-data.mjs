// 장면 데이터 검증만 (파일 생성 없음). 실행: npm run check:data
import { loadScenes, validateScenes } from "./lib/scenes.mjs";

const scenes = await loadScenes();
const { errors, warnings } = validateScenes(scenes);
warnings.forEach((w) => console.warn("경고:", w));
errors.forEach((e) => console.error("오류:", e));
console.log(`\n장면 ${scenes.length}개 — 오류 ${errors.length}건, 경고 ${warnings.length}건`);
process.exit(errors.length ? 1 : 0);

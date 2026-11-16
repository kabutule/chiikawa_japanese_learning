# chiikawa_japanese_learning

## 장면 데이터 → DB

1. `data/scenes/scene-00N.json` 작성 (형식은 `scene-001.json` 예시 참고)
2. 이미지 3장을 `public/images/scenes/00N/{ko,furigana,ja}.png` 에 넣기
3. `npm run check:data` — 오류/TODO 확인
4. `npm run gen:explanations` — 해설 AI 생성 (`.env` 에 `OPENAI_API_KEY`), `git diff data/scenes` 로 검토
5. `npm run build:seed` → `db/seed.sql` 생성
6. DB 적용
   ```
   mysql -u root -p < db/schema.sql          # 최초 1회
   mysql -u root -p chiikawa_study < db/seed.sql
   ```

ID 규칙: 장면 id = JSON 의 `id`, 이미지·퀴즈 id = 장면 id × 100 + 순번. 시드는 다시 실행해도 해당 장면만 지우고 새로 넣습니다.

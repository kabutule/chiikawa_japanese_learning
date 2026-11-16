-- 자동 생성 파일: scripts/build-seed.mjs 로 다시 만드세요. 직접 수정 금지.
SET NAMES utf8mb4;
USE chiikawa_study;
START TRANSACTION;

DELETE FROM scenes WHERE id IN (1, 2, 3);

-- ===== 장면 1: [예시] 주먹밥 장면 — 실제 장면으로 교체하세요
INSERT INTO scenes (id, title, source_url, posted_at, level, sort_order) VALUES (1, '[예시] 주먹밥 장면 — 실제 장면으로 교체하세요', NULL, NULL, 1, 1);
INSERT INTO scene_images (id, scene_id, layer, image_url, sort_order) VALUES (101, 1, 'ko', '/images/scenes/001/ko.png', 1);
INSERT INTO scene_images (id, scene_id, layer, image_url, sort_order) VALUES (102, 1, 'furigana', '/images/scenes/001/furigana.png', 2);
INSERT INTO scene_images (id, scene_id, layer, image_url, sort_order) VALUES (103, 1, 'ja', '/images/scenes/001/ja.png', 3);
INSERT INTO scene_lines (scene_id, sort_order, ja_text, reading, ko_text) VALUES (1, 1, 'おにぎり、食べる？', 'おにぎり、たべる？', '주먹밥 먹을래?');
INSERT INTO scene_lines (scene_id, sort_order, ja_text, reading, ko_text) VALUES (1, 2, 'うん！ありがとう！', 'うん！ありがとう！', '응! 고마워!');
INSERT INTO vocab (surface, reading, meaning, kind, jlpt_level) VALUES ('おにぎり', 'おにぎり', '주먹밥', 'word', 5) ON DUPLICATE KEY UPDATE meaning = VALUES(meaning), kind = VALUES(kind), jlpt_level = VALUES(jlpt_level);
INSERT INTO scene_vocab (scene_id, vocab_id) SELECT 1, id FROM vocab WHERE surface = 'おにぎり' AND reading = 'おにぎり';
INSERT INTO vocab (surface, reading, meaning, kind, jlpt_level) VALUES ('食べる', 'たべる', '먹다', 'word', 5) ON DUPLICATE KEY UPDATE meaning = VALUES(meaning), kind = VALUES(kind), jlpt_level = VALUES(jlpt_level);
INSERT INTO scene_vocab (scene_id, vocab_id) SELECT 1, id FROM vocab WHERE surface = '食べる' AND reading = 'たべる';
INSERT INTO vocab (surface, reading, meaning, kind, jlpt_level) VALUES ('食', 'た(べる) / しょく', '먹을 식', 'kanji', 5) ON DUPLICATE KEY UPDATE meaning = VALUES(meaning), kind = VALUES(kind), jlpt_level = VALUES(jlpt_level);
INSERT INTO scene_vocab (scene_id, vocab_id) SELECT 1, id FROM vocab WHERE surface = '食' AND reading = 'た(べる) / しょく';
INSERT INTO quizzes (id, scene_id, type, question, sort_order) VALUES (101, 1, 'short_answer', '첫 번째 대사에서 권하고 있는 음식은 무엇인가요?', 1);
INSERT INTO quiz_answers (quiz_id, answers, explanation) VALUES (101, '["おにぎり","오니기리","주먹밥"]', NULL);

-- ===== 장면 2: TODO: 장면 제목
INSERT INTO scenes (id, title, source_url, posted_at, level, sort_order) VALUES (2, 'TODO: 장면 제목', NULL, NULL, 1, 2);
INSERT INTO scene_images (id, scene_id, layer, image_url, sort_order) VALUES (201, 2, 'ko', '/images/scenes/002/ko.png', 1);
INSERT INTO scene_images (id, scene_id, layer, image_url, sort_order) VALUES (202, 2, 'furigana', '/images/scenes/002/furigana.png', 2);
INSERT INTO scene_images (id, scene_id, layer, image_url, sort_order) VALUES (203, 2, 'ja', '/images/scenes/002/ja.png', 3);
INSERT INTO scene_lines (scene_id, sort_order, ja_text, reading, ko_text) VALUES (2, 1, 'TODO', NULL, NULL);
INSERT INTO vocab (surface, reading, meaning, kind, jlpt_level) VALUES ('TODO', '', 'TODO', 'word', NULL) ON DUPLICATE KEY UPDATE meaning = VALUES(meaning), kind = VALUES(kind), jlpt_level = VALUES(jlpt_level);
INSERT INTO scene_vocab (scene_id, vocab_id) SELECT 2, id FROM vocab WHERE surface = 'TODO' AND reading = '';
INSERT INTO quizzes (id, scene_id, type, question, sort_order) VALUES (201, 2, 'short_answer', 'TODO', 1);
INSERT INTO quiz_answers (quiz_id, answers, explanation) VALUES (201, '["TODO"]', NULL);

-- ===== 장면 3: TODO: 장면 제목
INSERT INTO scenes (id, title, source_url, posted_at, level, sort_order) VALUES (3, 'TODO: 장면 제목', NULL, NULL, 1, 3);
INSERT INTO scene_images (id, scene_id, layer, image_url, sort_order) VALUES (301, 3, 'ko', '/images/scenes/003/ko.png', 1);
INSERT INTO scene_images (id, scene_id, layer, image_url, sort_order) VALUES (302, 3, 'furigana', '/images/scenes/003/furigana.png', 2);
INSERT INTO scene_images (id, scene_id, layer, image_url, sort_order) VALUES (303, 3, 'ja', '/images/scenes/003/ja.png', 3);
INSERT INTO scene_lines (scene_id, sort_order, ja_text, reading, ko_text) VALUES (3, 1, 'TODO', NULL, NULL);
INSERT INTO vocab (surface, reading, meaning, kind, jlpt_level) VALUES ('TODO', '', 'TODO', 'word', NULL) ON DUPLICATE KEY UPDATE meaning = VALUES(meaning), kind = VALUES(kind), jlpt_level = VALUES(jlpt_level);
INSERT INTO scene_vocab (scene_id, vocab_id) SELECT 3, id FROM vocab WHERE surface = 'TODO' AND reading = '';
INSERT INTO quizzes (id, scene_id, type, question, sort_order) VALUES (301, 3, 'short_answer', 'TODO', 1);
INSERT INTO quiz_answers (quiz_id, answers, explanation) VALUES (301, '["TODO"]', NULL);

COMMIT;

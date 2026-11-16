-- 자동 생성 파일: scripts/build-seed.mjs 로 다시 만드세요. 직접 수정 금지.
SET NAMES utf8mb4;
USE chiikawa_study;
START TRANSACTION;

DELETE FROM scenes WHERE id IN (1, 2, 3);

-- ===== 장면 1: 우사기 야하
INSERT INTO scenes (id, title, source_url, posted_at, level, sort_order) VALUES (1, '우사기 야하', NULL, NULL, 1, 1);
INSERT INTO scene_images (id, scene_id, layer, image_url, sort_order) VALUES (101, 1, 'ko', '/images/scenes/001/ko.png', 1);
INSERT INTO scene_images (id, scene_id, layer, image_url, sort_order) VALUES (102, 1, 'furigana', '/images/scenes/001/ko.png', 2);
INSERT INTO scene_images (id, scene_id, layer, image_url, sort_order) VALUES (103, 1, 'ja', '/images/scenes/001/ja.png', 3);
INSERT INTO scene_lines (scene_id, sort_order, ja_text, reading, ko_text) VALUES (1, 1, 'ヤハ', 'やは', '야하');
INSERT INTO vocab (surface, reading, meaning, kind, jlpt_level) VALUES ('ヤハ', 'やは', '우사기의 감탄사 (특별한 뜻 없음)', 'word', NULL) ON DUPLICATE KEY UPDATE meaning = VALUES(meaning), kind = VALUES(kind), jlpt_level = VALUES(jlpt_level);
INSERT INTO scene_vocab (scene_id, vocab_id) SELECT 1, id FROM vocab WHERE surface = 'ヤハ' AND reading = 'やは';
INSERT INTO quizzes (id, scene_id, type, question, sort_order) VALUES (101, 1, 'short_answer', '첫 번째 대사에서 발음은 무엇인가요?', 1);
INSERT INTO quiz_answers (quiz_id, answers, explanation) VALUES (101, '["ヤハ","やは","야하"]', NULL);

-- ===== 장면 2: 모몽가 이야
INSERT INTO scenes (id, title, source_url, posted_at, level, sort_order) VALUES (2, '모몽가 이야', NULL, NULL, 1, 2);
INSERT INTO scene_images (id, scene_id, layer, image_url, sort_order) VALUES (201, 2, 'ko', '/images/scenes/002/ko.png', 1);
INSERT INTO scene_images (id, scene_id, layer, image_url, sort_order) VALUES (202, 2, 'furigana', '/images/scenes/002/furigana.png', 2);
INSERT INTO scene_images (id, scene_id, layer, image_url, sort_order) VALUES (203, 2, 'ja', '/images/scenes/002/ja.png', 3);
INSERT INTO scene_lines (scene_id, sort_order, ja_text, reading, ko_text) VALUES (2, 1, 'イヤッ', 'いやっ', '싫엇');
INSERT INTO vocab (surface, reading, meaning, kind, jlpt_level) VALUES ('嫌', 'いや', '싫다, 싫음', 'word', 4) ON DUPLICATE KEY UPDATE meaning = VALUES(meaning), kind = VALUES(kind), jlpt_level = VALUES(jlpt_level);
INSERT INTO scene_vocab (scene_id, vocab_id) SELECT 2, id FROM vocab WHERE surface = '嫌' AND reading = 'いや';
INSERT INTO quizzes (id, scene_id, type, question, sort_order) VALUES (201, 2, 'short_answer', '지금 모몽가가 말하고 있는 말은 어떻게 발음할까요?', 1);
INSERT INTO quiz_answers (quiz_id, answers, explanation) VALUES (201, '["イヤッ","いやっ","이얏"]', NULL);

-- ===== 장면 3: 하치와레 니게요옷
INSERT INTO scenes (id, title, source_url, posted_at, level, sort_order) VALUES (3, '하치와레 니게요옷', NULL, NULL, 1, 3);
INSERT INTO scene_images (id, scene_id, layer, image_url, sort_order) VALUES (301, 3, 'ko', '/images/scenes/003/ko.png', 1);
INSERT INTO scene_images (id, scene_id, layer, image_url, sort_order) VALUES (302, 3, 'furigana', '/images/scenes/003/furigana.png', 2);
INSERT INTO scene_images (id, scene_id, layer, image_url, sort_order) VALUES (303, 3, 'ja', '/images/scenes/003/ja.png', 3);
INSERT INTO scene_lines (scene_id, sort_order, ja_text, reading, ko_text) VALUES (3, 1, '逃げようッ', 'にげようッ', '도망치자');
INSERT INTO vocab (surface, reading, meaning, kind, jlpt_level) VALUES ('逃げる', 'にげる', '도망치다, 달아나다', 'word', 3) ON DUPLICATE KEY UPDATE meaning = VALUES(meaning), kind = VALUES(kind), jlpt_level = VALUES(jlpt_level);
INSERT INTO scene_vocab (scene_id, vocab_id) SELECT 3, id FROM vocab WHERE surface = '逃げる' AND reading = 'にげる';
INSERT INTO vocab (surface, reading, meaning, kind, jlpt_level) VALUES ('逃', 'に(げる) / とう', '도망할 도', 'kanji', 3) ON DUPLICATE KEY UPDATE meaning = VALUES(meaning), kind = VALUES(kind), jlpt_level = VALUES(jlpt_level);
INSERT INTO scene_vocab (scene_id, vocab_id) SELECT 3, id FROM vocab WHERE surface = '逃' AND reading = 'に(げる) / とう';
INSERT INTO quizzes (id, scene_id, type, question, sort_order) VALUES (301, 3, 'short_answer', '하치와레가 말한 「逃げようッ」는 어떻게 읽을까요?', 1);
INSERT INTO quiz_answers (quiz_id, answers, explanation) VALUES (301, '["にげようッ","にげよう","니게요옷","니게요"]', NULL);
INSERT INTO quizzes (id, scene_id, type, question, sort_order) VALUES (302, 3, 'short_answer', '하치와레는 친구들에게 무엇을 하자고 말하고 있나요?', 2);
INSERT INTO quiz_answers (quiz_id, answers, explanation) VALUES (302, '["도망치자","도망가자","도망","逃げよう"]', NULL);

COMMIT;

-- 자동 생성 파일: scripts/build-seed.mjs 로 다시 만드세요. 직접 수정 금지.
SET NAMES utf8mb4;
USE chiikawa_study;
START TRANSACTION;

DELETE FROM scenes WHERE id IN (1, 2, 3, 4, 5);

-- ===== 장면 1: 우사기 야하
INSERT INTO scenes (id, title, source_url, posted_at, level, sort_order) VALUES (1, '우사기 야하', NULL, NULL, 1, 1);
INSERT INTO scene_images (id, scene_id, layer, image_url, sort_order) VALUES (101, 1, 'ko', '/images/scenes/001/ko.png', 1);
INSERT INTO scene_images (id, scene_id, layer, image_url, sort_order) VALUES (102, 1, 'furigana', '/images/scenes/001/ko.png', 2);
INSERT INTO scene_images (id, scene_id, layer, image_url, sort_order) VALUES (103, 1, 'ja', '/images/scenes/001/ja.png', 3);
INSERT INTO scene_lines (scene_id, sort_order, ja_text, reading, ko_text) VALUES (1, 1, 'ヤハ', 'やは', '야하');
INSERT INTO vocab (surface, reading, meaning, kind, jlpt_level) VALUES ('ヤハ', 'やは', '우사기의 감탄사 (특별한 뜻 없음)', 'word', NULL) ON DUPLICATE KEY UPDATE meaning = VALUES(meaning), kind = VALUES(kind), jlpt_level = VALUES(jlpt_level);
INSERT INTO scene_vocab (scene_id, vocab_id) SELECT 1, id FROM vocab WHERE surface = 'ヤハ' AND reading = 'やは';
INSERT INTO quizzes (id, scene_id, type, question, sort_order) VALUES (101, 1, 'short_answer', '첫 번째 대사에서 발음은 무엇인가요?', 1);
INSERT INTO quiz_answers (quiz_id, answers, explanation) VALUES (101, '["ヤハ","やは","야하"]', '정답은 첫 번째 대사 「ヤハ」에 바로 나와요. 「ヤハ」의 읽기는 히라가나로 「やは」이고, 한국어 발음으로는 “야하”에 가깝습니다. 이 표현은 여기서 우사기의 감탄사로 쓰인 말이라 특별한 뜻은 없어요.');

-- ===== 장면 2: 모몽가 이야
INSERT INTO scenes (id, title, source_url, posted_at, level, sort_order) VALUES (2, '모몽가 이야', NULL, NULL, 1, 2);
INSERT INTO scene_images (id, scene_id, layer, image_url, sort_order) VALUES (201, 2, 'ko', '/images/scenes/002/ko.png', 1);
INSERT INTO scene_images (id, scene_id, layer, image_url, sort_order) VALUES (202, 2, 'furigana', '/images/scenes/002/furigana.png', 2);
INSERT INTO scene_images (id, scene_id, layer, image_url, sort_order) VALUES (203, 2, 'ja', '/images/scenes/002/ja.png', 3);
INSERT INTO scene_lines (scene_id, sort_order, ja_text, reading, ko_text) VALUES (2, 1, 'イヤッ', 'いやっ', '싫엇');
INSERT INTO vocab (surface, reading, meaning, kind, jlpt_level) VALUES ('嫌', 'いや', '싫다, 싫음', 'word', 4) ON DUPLICATE KEY UPDATE meaning = VALUES(meaning), kind = VALUES(kind), jlpt_level = VALUES(jlpt_level);
INSERT INTO scene_vocab (scene_id, vocab_id) SELECT 2, id FROM vocab WHERE surface = '嫌' AND reading = 'いや';
INSERT INTO quizzes (id, scene_id, type, question, sort_order) VALUES (201, 2, 'short_answer', '지금 모몽가가 말하고 있는 말은 어떻게 발음할까요?', 1);
INSERT INTO quiz_answers (quiz_id, answers, explanation) VALUES (201, '["イヤッ","いやっ","이얏"]', '정답은 장면의 대사 「イヤッ」에서 그대로 나와요. 「イヤッ」는 히라가나로 「いやっ」라고 읽고, 「싫어!」 또는 「싫엇!」처럼 거부하는 느낌을 나타내요. 끝의 작은 「ッ」는 말을 짧고 강하게 끊는 느낌을 줍니다.');

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
INSERT INTO quiz_answers (quiz_id, answers, explanation) VALUES (301, '["にげようッ","にげよう","니게요옷","니게요"]', '정답은 하치와레의 대사 「逃げようッ」에서 바로 확인할 수 있어요. 「逃げよう」는 「にげよう」라고 읽고, 뜻은 “도망치자”예요. 동사 「逃げる(にげる, 도망치다)」에 「〜よう」가 붙으면 “~하자”라는 권유 표현이 됩니다.');
INSERT INTO quizzes (id, scene_id, type, question, sort_order) VALUES (302, 3, 'short_answer', '하치와레는 친구들에게 무엇을 하자고 말하고 있나요?', 2);
INSERT INTO quiz_answers (quiz_id, answers, explanation) VALUES (302, '["도망치자","도망가자","도망","逃げよう"]', '정답은 대사 1의 「逃げようッ(にげようッ)」에서 바로 알 수 있어요. 「逃げる(にげる)」는 ‘도망치다’라는 뜻이고, 「〜よう」는 “~하자”라고 권유할 때 쓰는 표현이라서 「逃げよう」는 “도망치자/도망가자”가 됩니다. 마지막의 작은 「ッ」는 말에 힘이 들어간 느낌을 나타내요.');

-- ===== 장면 4: 랏코 랏쿄오 쿠사잇
INSERT INTO scenes (id, title, source_url, posted_at, level, sort_order) VALUES (4, '랏코 랏쿄오 쿠사잇', NULL, NULL, 1, 4);
INSERT INTO scene_images (id, scene_id, layer, image_url, sort_order) VALUES (401, 4, 'ko', '/images/scenes/004/ko.png', 1);
INSERT INTO scene_images (id, scene_id, layer, image_url, sort_order) VALUES (402, 4, 'furigana', '/images/scenes/004/furigana.png', 2);
INSERT INTO scene_images (id, scene_id, layer, image_url, sort_order) VALUES (403, 4, 'ja', '/images/scenes/004/ja.png', 3);
INSERT INTO scene_lines (scene_id, sort_order, ja_text, reading, ko_text) VALUES (4, 1, 'クンクン…', 'くんくん…', '킁킁…');
INSERT INTO scene_lines (scene_id, sort_order, ja_text, reading, ko_text) VALUES (4, 2, '車がらっきょうくさいッ', 'くるまがらっきょうくさいッ', '차에서 락교 냄새가 나잇');
INSERT INTO vocab (surface, reading, meaning, kind, jlpt_level) VALUES ('車', 'くるま', '자동차, 차', 'word', 5) ON DUPLICATE KEY UPDATE meaning = VALUES(meaning), kind = VALUES(kind), jlpt_level = VALUES(jlpt_level);
INSERT INTO scene_vocab (scene_id, vocab_id) SELECT 4, id FROM vocab WHERE surface = '車' AND reading = 'くるま';
INSERT INTO vocab (surface, reading, meaning, kind, jlpt_level) VALUES ('車', 'くるま / しゃ', '수레 차', 'kanji', 5) ON DUPLICATE KEY UPDATE meaning = VALUES(meaning), kind = VALUES(kind), jlpt_level = VALUES(jlpt_level);
INSERT INTO scene_vocab (scene_id, vocab_id) SELECT 4, id FROM vocab WHERE surface = '車' AND reading = 'くるま / しゃ';
INSERT INTO vocab (surface, reading, meaning, kind, jlpt_level) VALUES ('らっきょう', 'らっきょう', '락교(염교). 새콤하게 절여 먹는 작은 파 뿌리 채소', 'word', NULL) ON DUPLICATE KEY UPDATE meaning = VALUES(meaning), kind = VALUES(kind), jlpt_level = VALUES(jlpt_level);
INSERT INTO scene_vocab (scene_id, vocab_id) SELECT 4, id FROM vocab WHERE surface = 'らっきょう' AND reading = 'らっきょう';
INSERT INTO vocab (surface, reading, meaning, kind, jlpt_level) VALUES ('くさい', 'くさい', '(고약한) 냄새가 나다. 명사 뒤에 붙으면 ''~냄새가 나다''', 'word', 3) ON DUPLICATE KEY UPDATE meaning = VALUES(meaning), kind = VALUES(kind), jlpt_level = VALUES(jlpt_level);
INSERT INTO scene_vocab (scene_id, vocab_id) SELECT 4, id FROM vocab WHERE surface = 'くさい' AND reading = 'くさい';
INSERT INTO vocab (surface, reading, meaning, kind, jlpt_level) VALUES ('クンクン', 'くんくん', '킁킁 (냄새를 맡는 소리)', 'word', NULL) ON DUPLICATE KEY UPDATE meaning = VALUES(meaning), kind = VALUES(kind), jlpt_level = VALUES(jlpt_level);
INSERT INTO scene_vocab (scene_id, vocab_id) SELECT 4, id FROM vocab WHERE surface = 'クンクン' AND reading = 'くんくん';
INSERT INTO quizzes (id, scene_id, type, question, sort_order) VALUES (401, 4, 'short_answer', '랏코가 말한 「車」는 어떻게 읽을까요?', 1);
INSERT INTO quiz_answers (quiz_id, answers, explanation) VALUES (401, '["くるま","クルマ","쿠루마"]', '정답은 2번 대사 「車がらっきょうくさいッ」에 나오는 「車」에서 확인할 수 있어요. 여기서 「車」는 「くるま」라고 읽고, 뜻은 ‘자동차, 차’입니다. 뒤의 「くさい」는 명사 뒤에 붙어 ‘~냄새가 나다’라는 뜻이라서, 전체적으로 “차에서 락교 냄새가 나!”라는 말이에요.');
INSERT INTO quizzes (id, scene_id, type, question, sort_order) VALUES (402, 4, 'short_answer', '「くさい」는 무슨 뜻일까요?', 2);
INSERT INTO quiz_answers (quiz_id, answers, explanation) VALUES (402, '["냄새가 나다","냄새가 난다","냄새 나","냄새나다","구리다","냄새"]', '정답은 2번 대사 「車がらっきょうくさいッ」에서 확인할 수 있어요. 「くさい(くさい)」는 ‘냄새가 나다’, 특히 고약하거나 강한 냄새가 난다는 뜻이에요. 여기서는 「らっきょうくさい」처럼 명사 뒤에 붙어 ‘락교 냄새가 나다’라는 의미가 됩니다.');
INSERT INTO quizzes (id, scene_id, type, question, sort_order) VALUES (403, 4, 'short_answer', '랏코가 냄새를 맡는 소리 「킁킁」을 일본어로 뭐라고 할까요?', 3);
INSERT INTO quiz_answers (quiz_id, answers, explanation) VALUES (403, '["クンクン","くんくん","쿤쿤"]', '정답은 1번 대사 「クンクン…」에서 바로 나와요. 「クンクン(くんくん)」은 냄새를 맡을 때 나는 소리로, 한국어의 “킁킁”에 해당합니다. 일본어 의성어·의태어는 이렇게 가타카나로 쓰면 소리나 느낌이 더 또렷하게 느껴지는 경우가 많아요.');

-- ===== 장면 5: 하치와레 요미토레나이욧
INSERT INTO scenes (id, title, source_url, posted_at, level, sort_order) VALUES (5, '하치와레 요미토레나이욧', NULL, NULL, 1, 5);
INSERT INTO scene_images (id, scene_id, layer, image_url, sort_order) VALUES (501, 5, 'ko', '/images/scenes/005/ko.png', 1);
INSERT INTO scene_images (id, scene_id, layer, image_url, sort_order) VALUES (502, 5, 'furigana', '/images/scenes/005/furigana.png', 2);
INSERT INTO scene_images (id, scene_id, layer, image_url, sort_order) VALUES (503, 5, 'ja', '/images/scenes/005/ja.png', 3);
INSERT INTO scene_lines (scene_id, sort_order, ja_text, reading, ko_text) VALUES (5, 1, 'どんな感情か…読み取れないよッ!!', 'どんなかんじょうか…よみとれないよッ!!', '어떤 감정인지… 못 읽겠어!');
INSERT INTO vocab (surface, reading, meaning, kind, jlpt_level) VALUES ('どんな', 'どんな', '어떤, 어떠한', 'word', 5) ON DUPLICATE KEY UPDATE meaning = VALUES(meaning), kind = VALUES(kind), jlpt_level = VALUES(jlpt_level);
INSERT INTO scene_vocab (scene_id, vocab_id) SELECT 5, id FROM vocab WHERE surface = 'どんな' AND reading = 'どんな';
INSERT INTO vocab (surface, reading, meaning, kind, jlpt_level) VALUES ('感情', 'かんじょう', '감정', 'word', 3) ON DUPLICATE KEY UPDATE meaning = VALUES(meaning), kind = VALUES(kind), jlpt_level = VALUES(jlpt_level);
INSERT INTO scene_vocab (scene_id, vocab_id) SELECT 5, id FROM vocab WHERE surface = '感情' AND reading = 'かんじょう';
INSERT INTO vocab (surface, reading, meaning, kind, jlpt_level) VALUES ('読み取る', 'よみとる', '읽어 내다, (속마음 등을) 알아차리다. 「読み取れない」는 ''읽어 낼 수 없다''', 'word', NULL) ON DUPLICATE KEY UPDATE meaning = VALUES(meaning), kind = VALUES(kind), jlpt_level = VALUES(jlpt_level);
INSERT INTO scene_vocab (scene_id, vocab_id) SELECT 5, id FROM vocab WHERE surface = '読み取る' AND reading = 'よみとる';
INSERT INTO vocab (surface, reading, meaning, kind, jlpt_level) VALUES ('感', 'かん', '느낄 감', 'kanji', 3) ON DUPLICATE KEY UPDATE meaning = VALUES(meaning), kind = VALUES(kind), jlpt_level = VALUES(jlpt_level);
INSERT INTO scene_vocab (scene_id, vocab_id) SELECT 5, id FROM vocab WHERE surface = '感' AND reading = 'かん';
INSERT INTO vocab (surface, reading, meaning, kind, jlpt_level) VALUES ('情', 'じょう', '뜻 정', 'kanji', 3) ON DUPLICATE KEY UPDATE meaning = VALUES(meaning), kind = VALUES(kind), jlpt_level = VALUES(jlpt_level);
INSERT INTO scene_vocab (scene_id, vocab_id) SELECT 5, id FROM vocab WHERE surface = '情' AND reading = 'じょう';
INSERT INTO vocab (surface, reading, meaning, kind, jlpt_level) VALUES ('読', 'よ(む) / どく', '읽을 독', 'kanji', 5) ON DUPLICATE KEY UPDATE meaning = VALUES(meaning), kind = VALUES(kind), jlpt_level = VALUES(jlpt_level);
INSERT INTO scene_vocab (scene_id, vocab_id) SELECT 5, id FROM vocab WHERE surface = '読' AND reading = 'よ(む) / どく';
INSERT INTO quizzes (id, scene_id, type, question, sort_order) VALUES (501, 5, 'short_answer', '하치와레가 말한 「感情」는 어떻게 읽을까요?', 1);
INSERT INTO quiz_answers (quiz_id, answers, explanation) VALUES (501, '["かんじょう","칸죠오","칸죠","간조"]', '정답은 1번 대사 「どんな感情か…」에 나오는 「感情」에서 확인할 수 있어요. 「感情」는 かんじょう라고 읽고, 뜻은 ‘감정’이에요. 「どんな感情か」는 ‘어떤 감정인지’라는 뜻으로, 뒤의 「読み取れない」와 이어져 ‘어떤 감정인지 읽어 낼 수 없다’는 의미가 됩니다.');
INSERT INTO quizzes (id, scene_id, type, question, sort_order) VALUES (502, 5, 'short_answer', '하치와레는 무엇을 읽어 낼 수 없다고 말하고 있나요?', 2);
INSERT INTO quiz_answers (quiz_id, answers, explanation) VALUES (502, '["감정","感情","かんじょう"]', '정답은 대사 「どんな感情か…読み取れないよッ!!」에서 나와요. 「感情(かんじょう)」은 ‘감정’, 「読み取れない(よみとれない)」는 ‘읽어 낼 수 없다/알아차릴 수 없다’는 뜻이라서, 어떤 감정인지 읽어 낼 수 없다고 말한 거예요. 「読めない」보다 「読み取れない」는 표정이나 분위기 속 의미를 ‘파악하지 못한다’는 뉘앙스가 있어요.');
INSERT INTO quizzes (id, scene_id, type, question, sort_order) VALUES (503, 5, 'short_answer', '「どんな」는 무슨 뜻일까요?', 3);
INSERT INTO quiz_answers (quiz_id, answers, explanation) VALUES (503, '["어떤","어떠한","무슨"]', '정답은 대사 「どんな感情か…」에 나온 「どんな(どんな)」에서 확인할 수 있어요. 「どんな」는 ‘어떤, 어떠한, 무슨’이라는 뜻으로, 여기서는 “어떤 감정인지”라는 말이에요. 뒤에 명사가 와서 「どんな＋감정」처럼 ‘어떤 ~’인지 묻거나 말할 때 자주 써요.');

COMMIT;

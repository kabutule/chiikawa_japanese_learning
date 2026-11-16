-- =========================================================
-- 치이카와 학습(가제) — MySQL 8 스키마
-- 실행: mysql -u root -p < db/schema.sql
-- =========================================================

SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS chiikawa_study
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;   -- 일본어·한국어 저장용 (utf8 말고 반드시 utf8mb4)
USE chiikawa_study;


-- ---------- 장면 ----------
CREATE TABLE scenes (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  source_url  VARCHAR(500),
  posted_at   DATE,
  level       TINYINT UNSIGNED NOT NULL DEFAULT 1,   -- 난이도
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 장면별 이미지 레이어 (번역본 → 요미가나 → 원문 순서로 넘김)
CREATE TABLE scene_images (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  scene_id    BIGINT UNSIGNED NOT NULL,
  layer       ENUM('ko','furigana','ja','quiz_variant') NOT NULL,
  image_url   VARCHAR(500) NOT NULL,               -- 정적 파일 경로 또는 S3 URL
  sort_order  INT NOT NULL DEFAULT 0,
  INDEX idx_scene_images (scene_id, sort_order),
  FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 대사 (하단 학습 영역 + AI 채점 문맥)
CREATE TABLE scene_lines (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  scene_id    BIGINT UNSIGNED NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  ja_text     VARCHAR(500) NOT NULL,
  reading     VARCHAR(500),                        -- 히라가나 읽기
  ko_text     VARCHAR(500),
  INDEX idx_scene_lines (scene_id, sort_order),
  FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- ---------- 단어/한자 ----------
CREATE TABLE vocab (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  surface     VARCHAR(50) NOT NULL,                -- 漢字 or 단어
  reading     VARCHAR(100) NOT NULL DEFAULT '',
  meaning     VARCHAR(200) NOT NULL,
  kind        ENUM('kanji','word') NOT NULL DEFAULT 'word',
  jlpt_level  TINYINT UNSIGNED,
  UNIQUE KEY uq_vocab (surface, reading)
) ENGINE=InnoDB;

CREATE TABLE scene_vocab (
  scene_id    BIGINT UNSIGNED NOT NULL,
  vocab_id    BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (scene_id, vocab_id),
  FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE,
  FOREIGN KEY (vocab_id) REFERENCES vocab(id)  ON DELETE CASCADE
) ENGINE=InnoDB;


-- ---------- 퀴즈 ----------
-- 프론트에 내려주는 부분 (정답 없음)
CREATE TABLE quizzes (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  scene_id          BIGINT UNSIGNED NOT NULL,
  type              ENUM('short_answer','diff') NOT NULL DEFAULT 'short_answer',
  question          VARCHAR(300) NOT NULL,
  variant_image_id  BIGINT UNSIGNED NULL,          -- diff 퀴즈용
  sort_order        INT NOT NULL DEFAULT 0,
  INDEX idx_quizzes (scene_id, sort_order),
  FOREIGN KEY (scene_id)         REFERENCES scenes(id)       ON DELETE CASCADE,
  FOREIGN KEY (variant_image_id) REFERENCES scene_images(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 정답 + 해설 (채점 API 안에서만 읽고, 응답으로 그대로 내보내지 않음)
CREATE TABLE quiz_answers (
  quiz_id      BIGINT UNSIGNED PRIMARY KEY,
  answers      JSON NOT NULL,                      -- 허용 정답 목록 ["おにぎり","오니기리","주먹밥"]
  explanation  TEXT,                               -- 정답 해설 (시드 때 AI로 미리 생성)
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 풀이 기록
CREATE TABLE quiz_attempts (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quiz_id      BIGINT UNSIGNED NOT NULL,
  client_id    VARCHAR(64),                        -- 비로그인용: localStorage 에 저장한 랜덤 id
  submitted    VARCHAR(300) NOT NULL,
  is_correct   BOOLEAN NOT NULL,
  ai_judged    BOOLEAN NOT NULL DEFAULT FALSE,     -- AI 가 채점했는지
  error_type   VARCHAR(20),                        -- 'vocab' | 'reading' | 'context'
  hint         TEXT,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_attempts_quiz (quiz_id),
  INDEX idx_attempts_client (client_id),
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
) ENGINE=InnoDB;


-- ---------- 앱 전용 DB 계정 ----------
-- 백엔드 서버는 root 대신 이 계정으로 접속 (테이블 삭제·변경 권한 없음)
-- 비밀번호는 바꿔서 쓰고, .env 에만 저장
CREATE USER IF NOT EXISTS 'chiikawa_app'@'%' IDENTIFIED BY 'change-me';
GRANT SELECT ON chiikawa_study.* TO 'chiikawa_app'@'%';
GRANT INSERT ON chiikawa_study.quiz_attempts TO 'chiikawa_app'@'%';
FLUSH PRIVILEGES;

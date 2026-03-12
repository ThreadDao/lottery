-- 候选者
CREATE TABLE IF NOT EXISTS candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 抽签主表
CREATE TABLE IF NOT EXISTS draws (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mode TEXT NOT NULL CHECK (mode IN ('random', 'fixed')),
  round1_count INTEGER NOT NULL,
  fixed_candidate_id INTEGER NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (fixed_candidate_id) REFERENCES candidates(id)
);

-- 抽签结果：第一轮 N 条 round=1 is_final=0，最终 1 条 round=2 is_final=1
-- candidate_name 冗余存储，清空底库后历史记录仍可展示名称
CREATE TABLE IF NOT EXISTS draw_results (
  draw_id INTEGER NOT NULL,
  round INTEGER NOT NULL CHECK (round IN (1, 2)),
  candidate_id INTEGER NOT NULL,
  candidate_name TEXT NOT NULL DEFAULT '',
  is_final INTEGER NOT NULL DEFAULT 0 CHECK (is_final IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (draw_id, round, sort_order),
  FOREIGN KEY (draw_id) REFERENCES draws(id),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id)
);

-- 当前抽签模式（单行配置，供非抽签页设置、抽签时读取）
CREATE TABLE IF NOT EXISTS draw_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  mode TEXT NOT NULL DEFAULT 'random' CHECK (mode IN ('random', 'fixed')),
  fixed_candidate_id INTEGER NULL,
  FOREIGN KEY (fixed_candidate_id) REFERENCES candidates(id)
);
INSERT OR IGNORE INTO draw_config (id, mode) VALUES (1, 'random');

CREATE INDEX IF NOT EXISTS idx_draws_created_at ON draws(created_at);
CREATE INDEX IF NOT EXISTS idx_draw_results_draw_id ON draw_results(draw_id);

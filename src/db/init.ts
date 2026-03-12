import Database from "better-sqlite3";
import * as fs from "fs";
import * as path from "path";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "lottery.db");

export function getDb(): Database.Database {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  return db;
}

export function initSchema(db: Database.Database): void {
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
  db.exec(sql);
  migrateDrawResultsCandidateName(db);
}

/** 为旧库补充 draw_results.candidate_name，便于清空底库后历史仍可展示 */
function migrateDrawResultsCandidateName(db: Database.Database): void {
  try {
    const info = db.prepare("PRAGMA table_info(draw_results)").all() as { name: string }[];
    if (info.some((c) => c.name === "candidate_name")) return;
    db.exec("ALTER TABLE draw_results ADD COLUMN candidate_name TEXT NOT NULL DEFAULT ''");
    db.exec(
      "UPDATE draw_results SET candidate_name = (SELECT name FROM candidates WHERE candidates.id = draw_results.candidate_id) WHERE candidate_name = ''"
    );
  } catch (_) {
    // 新库表结构已含 candidate_name，或表不存在
  }
}

if (require.main === module) {
  const db = getDb();
  initSchema(db);
  console.log("Schema initialized at", DB_PATH);
  db.close();
}

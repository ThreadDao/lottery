import type Database from "better-sqlite3";
import type { Candidate } from "../domain/types";

export interface ICandidateRepo {
  listAll(): Candidate[];
  listPaginated(offset: number, limit: number): Candidate[];
  count(): number;
  getById(id: number): Candidate | null;
  getByIds(ids: number[]): Candidate[];
  add(name: string): number;
  addMany(names: string[]): void;
  deleteAll(): void;
}

export function createCandidateRepo(db: Database.Database): ICandidateRepo {
  return {
    listAll(): Candidate[] {
      const rows = db.prepare("SELECT id, name FROM candidates ORDER BY id").all() as { id: number; name: string }[];
      return rows;
    },
    listPaginated(offset: number, limit: number): Candidate[] {
      const rows = db.prepare("SELECT id, name FROM candidates ORDER BY id LIMIT ? OFFSET ?").all(limit, offset) as { id: number; name: string }[];
      return rows;
    },
    count(): number {
      const row = db.prepare("SELECT COUNT(*) AS n FROM candidates").get() as { n: number };
      return row.n;
    },
    getById(id: number): Candidate | null {
      const row = db.prepare("SELECT id, name FROM candidates WHERE id = ?").get(id) as { id: number; name: string } | undefined;
      return row ?? null;
    },
    getByIds(ids: number[]): Candidate[] {
      if (ids.length === 0) return [];
      const placeholders = ids.map(() => "?").join(",");
      const rows = db.prepare(`SELECT id, name FROM candidates WHERE id IN (${placeholders})`).all(...ids) as { id: number; name: string }[];
      return rows;
    },
    add(name: string): number {
      const r = db.prepare("INSERT INTO candidates (name) VALUES (?)").run(name);
      return r.lastInsertRowid as number;
    },
    addMany(names: string[]): void {
      const stmt = db.prepare("INSERT INTO candidates (name) VALUES (?)");
      const insert = db.transaction((arr: string[]) => {
        for (const name of arr) stmt.run(name);
      });
      insert(names);
    },
    deleteAll(): void {
      // PRAGMA foreign_keys 必须在事务外执行才生效，否则会被忽略
      db.pragma("foreign_keys = OFF");
      try {
        db.prepare("DELETE FROM candidates").run();
      } finally {
        db.pragma("foreign_keys = ON");
      }
    },
  };
}

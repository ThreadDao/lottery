import type Database from "better-sqlite3";
import type { DrawResult } from "../domain/types";

export interface DrawRecord {
  id: number;
  mode: string;
  round1_count: number;
  fixed_candidate_id: number | null;
  created_at: string;
}

export interface IDrawRepo {
  create(mode: "random" | "fixed", round1Count: number, fixedCandidateId: number | null): number;
  saveResults(drawId: number, round1: { id: number; name: string }[], final: { id: number; name: string }): void;
  list(limit?: number): DrawRecord[];
  listPaginated(offset: number, limit: number): (DrawRecord & { final_name: string })[];
  count(): number;
  getById(id: number): DrawRecord | null;
  getResult(drawId: number): { round1: { id: number; name: string }[]; final: { id: number; name: string } } | null;
  /** 仅解除 draws 对 candidates 的引用，清空底库前调用 */
  nullifyFixedCandidateReferences(): void;
  /** 清空所有抽签历史（draw_results + draws） */
  deleteAllHistory(): void;
}

export function createDrawRepo(db: Database.Database): IDrawRepo {
  return {
    create(mode: "random" | "fixed", round1Count: number, fixedCandidateId: number | null): number {
      const r = db
        .prepare("INSERT INTO draws (mode, round1_count, fixed_candidate_id) VALUES (?, ?, ?)")
        .run(mode, round1Count, fixedCandidateId);
      return r.lastInsertRowid as number;
    },
    saveResults(drawId: number, round1: { id: number; name: string }[], final: { id: number; name: string }): void {
      const insert = db.prepare(
        "INSERT INTO draw_results (draw_id, round, candidate_id, candidate_name, is_final, sort_order) VALUES (?, ?, ?, ?, ?, ?)"
      );
      db.transaction(() => {
        round1.forEach((c, i) => {
          insert.run(drawId, 1, c.id, c.name, 0, i);
        });
        insert.run(drawId, 2, final.id, final.name, 1, 0);
      })();
    },
    list(limit = 50): DrawRecord[] {
      const rows = db
        .prepare("SELECT id, mode, round1_count, fixed_candidate_id, created_at FROM draws ORDER BY created_at DESC LIMIT ?")
        .all(limit) as DrawRecord[];
      return rows;
    },
    listPaginated(offset: number, limit: number): (DrawRecord & { final_name: string })[] {
      const rows = db
        .prepare(
          `SELECT d.id, d.mode, d.round1_count, d.fixed_candidate_id, d.created_at,
                  (SELECT COALESCE(dr.candidate_name, '') FROM draw_results dr WHERE dr.draw_id = d.id AND dr.round = 2 LIMIT 1) AS final_name
           FROM draws d ORDER BY d.created_at DESC LIMIT ? OFFSET ?`
        )
        .all(limit, offset) as (DrawRecord & { final_name: string })[];
      return rows.map((r) => ({ ...r, final_name: String(r.final_name ?? "").trim() || "" }));
    },
    count(): number {
      const row = db.prepare("SELECT COUNT(*) AS n FROM draws").get() as { n: number };
      return row.n;
    },
    getById(id: number): DrawRecord | null {
      const row = db.prepare("SELECT id, mode, round1_count, fixed_candidate_id, created_at FROM draws WHERE id = ?").get(id) as DrawRecord | undefined;
      return row ?? null;
    },
    getResult(drawId: number): { round1: { id: number; name: string }[]; final: { id: number; name: string } } | null {
      const rows = db
        .prepare(
          `SELECT dr.round, dr.candidate_id, dr.candidate_name, dr.is_final, dr.sort_order
           FROM draw_results dr WHERE dr.draw_id = ? ORDER BY dr.round, dr.sort_order`
        )
        .all(drawId) as { round: number; candidate_id: number; candidate_name: string; is_final: number; sort_order: number }[];
      if (rows.length === 0) return null;
      const round1 = rows.filter((r) => r.round === 1).map((r) => ({ id: r.candidate_id, name: r.candidate_name || String(r.candidate_id) }));
      const finalRow = rows.find((r) => r.is_final === 1);
      if (!finalRow) return null;
      return { round1, final: { id: finalRow.candidate_id, name: finalRow.candidate_name || String(finalRow.candidate_id) } };
    },
    nullifyFixedCandidateReferences(): void {
      db.prepare("UPDATE draws SET fixed_candidate_id = NULL").run();
    },
    deleteAllHistory(): void {
      db.prepare("DELETE FROM draw_results").run();
      db.prepare("DELETE FROM draws").run();
    },
  };
}

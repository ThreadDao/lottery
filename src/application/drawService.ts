import type { Candidate, DrawResult } from "../domain/types";
import type { IDrawStrategy } from "../domain/types";
import { RandomDrawStrategy } from "../domain/randomStrategy";
import { FixedDrawStrategy } from "../domain/fixedStrategy";
import type { IRandomProvider } from "../domain/randomStrategy";
import type { ICandidateRepo } from "../infrastructure/candidateRepo";
import type { IDrawRepo } from "../infrastructure/drawRepo";

const MIN_ROUND1 = 5;
const MAX_ROUND1 = 10;

export class DrawService {
  constructor(
    private candidateRepo: ICandidateRepo,
    private drawRepo: IDrawRepo,
    private random: IRandomProvider
  ) {}

  /** 执行一次两轮抽签。mode 不传或 random 为随机；fixed 时内定=底库第一条（id 最小），也可显式传 fixedCandidateId */
  runDraw(round1Count: number, mode: "random" | "fixed" = "random", fixedCandidateId?: number): DrawResult {
    const candidates = this.candidateRepo.listAll();
    if (candidates.length === 0) throw new Error("候选池为空");
    if (round1Count < MIN_ROUND1 || round1Count > MAX_ROUND1) {
      throw new Error(`第一轮名额须在 ${MIN_ROUND1}-${MAX_ROUND1} 之间`);
    }
    if (round1Count > candidates.length) {
      throw new Error(`第一轮名额不能大于候选数（${candidates.length}）`);
    }

    const effectiveMode = mode;
    const effectiveFixedId = mode === "fixed" ? (fixedCandidateId ?? candidates[0].id) : undefined;

    const strategy: IDrawStrategy =
      effectiveMode === "fixed" && effectiveFixedId != null
        ? new FixedDrawStrategy(this.random, effectiveFixedId)
        : new RandomDrawStrategy(this.random);

    const round1 = strategy.drawFrom(candidates, round1Count);
    const final =
      effectiveMode === "fixed" && effectiveFixedId != null
        ? round1.find((c) => c.id === effectiveFixedId)!
        : new RandomDrawStrategy(this.random).drawFrom(round1, 1)[0]!;

    const drawId = this.drawRepo.create(effectiveMode, round1Count, effectiveMode === "fixed" && effectiveFixedId != null ? effectiveFixedId : null);
    this.drawRepo.saveResults(drawId, round1.map((c) => ({ id: c.id, name: c.name })), { id: final.id, name: final.name });

    const meta = this.drawRepo.getById(drawId);
    return {
      drawId,
      round1,
      final,
      mode: effectiveMode,
      round1Count,
      createdAt: meta?.created_at ?? new Date().toISOString(),
    };
  }

  /** 仅解除 draws 对 candidates 的引用（fixed_candidate_id），清空底库前调用 */
  clearAllDrawData(): void {
    this.drawRepo.nullifyFixedCandidateReferences();
  }

  getHistory(limit = 50): { id: number; mode: string; round1_count: number; created_at: string }[] {
    return this.drawRepo.list(limit);
  }

  getHistoryPaginated(page: number, pageSize: number): { items: { id: number; mode: string; round1_count: number; created_at: string; final_name: string }[]; total: number } {
    const total = this.drawRepo.count();
    const offset = (page - 1) * pageSize;
    const items = this.drawRepo.listPaginated(offset, pageSize);
    return { items, total };
  }

  getDrawResult(drawId: number): DrawResult | null {
    const meta = this.drawRepo.getById(drawId);
    if (!meta) return null;
    const result = this.drawRepo.getResult(drawId);
    if (!result) return null;
    return {
      drawId,
      round1: result.round1,
      final: result.final,
      mode: meta.mode as "random" | "fixed",
      round1Count: meta.round1_count,
      createdAt: meta.created_at,
    };
  }

  getRound1Range(): { min: number; max: number } {
    return { min: MIN_ROUND1, max: MAX_ROUND1 };
  }

  clearHistory(): void {
    this.drawRepo.deleteAllHistory();
  }
}

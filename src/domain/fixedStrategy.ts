import type { Candidate, IDrawStrategy } from "./types";

/** 内定策略：保证指定候选在结果中，其余随机补足 */
export class FixedDrawStrategy implements IDrawStrategy {
  constructor(
    private random: { nextInt(max: number): number },
    private fixedId: number
  ) {}

  drawFrom(candidates: Candidate[], count: number): Candidate[] {
    const fixed = candidates.find((c) => c.id === this.fixedId);
    if (!fixed) throw new Error(`内定候选 id=${this.fixedId} 不在候选池中`);
    if (count <= 0) return [];
    if (count === 1) return [fixed];
    const rest = candidates.filter((c) => c.id !== this.fixedId);
    const need = count - 1;
    const picked = this.pickRandom(rest, Math.min(need, rest.length));
    const result = [fixed, ...picked];
    return this.shuffle(result);
  }

  private pickRandom(arr: Candidate[], count: number): Candidate[] {
    const copy = [...arr];
    for (let i = 0; i < count; i++) {
      const j = i + this.random.nextInt(copy.length - i);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, count);
  }

  private shuffle(arr: Candidate[]): Candidate[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.random.nextInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

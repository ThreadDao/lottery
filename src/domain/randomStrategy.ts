import type { Candidate, IDrawStrategy } from "./types";

export interface IRandomProvider {
  /** [0, max) 整数 */
  nextInt(max: number): number;
}

/** 无放回随机抽取 */
export class RandomDrawStrategy implements IDrawStrategy {
  constructor(private random: IRandomProvider) {}

  drawFrom(candidates: Candidate[], count: number): Candidate[] {
    if (count >= candidates.length) return [...candidates];
    const copy = [...candidates];
    for (let i = 0; i < count; i++) {
      const j = i + this.random.nextInt(copy.length - i);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, count);
  }
}

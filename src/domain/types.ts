export type DrawMode = "random" | "fixed";

export interface Candidate {
  id: number;
  name: string;
}

export interface DrawConfig {
  round1Count: number;
  mode: DrawMode;
  fixedCandidateId?: number;
}

export interface Round1Result {
  candidates: Candidate[];
}

export interface DrawResult {
  drawId: number;
  round1: Candidate[];
  final: Candidate;
  mode: DrawMode;
  round1Count: number;
  createdAt: string;
}

/** 从给定列表中抽取 count 个 */
export interface IDrawStrategy {
  drawFrom(candidates: Candidate[], count: number): Candidate[];
}

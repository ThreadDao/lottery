import type { Candidate } from "../domain/types";
import type { ICandidateRepo } from "../infrastructure/candidateRepo";

export class CandidateService {
  constructor(private repo: ICandidateRepo) {}

  listAll(): Candidate[] {
    return this.repo.listAll();
  }

  listPaginated(page: number, pageSize: number): { items: Candidate[]; total: number } {
    const total = this.repo.count();
    const offset = (page - 1) * pageSize;
    const items = this.repo.listPaginated(offset, pageSize);
    return { items, total };
  }

  getById(id: number): Candidate | null {
    return this.repo.getById(id);
  }

  add(name: string): Candidate {
    const id = this.repo.add(name);
    const c = this.repo.getById(id);
    if (!c) throw new Error("新增失败");
    return c;
  }

  addMany(names: string[]): void {
    this.repo.addMany(names);
  }

  clear(): void {
    this.repo.deleteAll();
  }
}

import { Router } from "express";
import multer from "multer";
import type { DrawService } from "../application/drawService";
import type { CandidateService } from "../application/candidateService";
import { parseNamesFromExcel } from "./uploadExcel";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

export function createRoutes(drawService: DrawService, candidateService: CandidateService): Router {
  const router = Router();

  // 候选池：分页 ?page=1&pageSize=20 ；无参数时返回全部（供抽签页内定下拉用）
  router.get("/candidates", (req, res) => {
    try {
      const page = Number(req.query.page);
      const pageSize = Number(req.query.pageSize);
      if (Number.isInteger(page) && page >= 1 && Number.isInteger(pageSize) && pageSize >= 1) {
        const { items, total } = candidateService.listPaginated(page, Math.min(pageSize, 100));
        res.json({ items, total });
      } else {
        res.json(candidateService.listAll());
      }
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  router.post("/candidates", (req, res) => {
    try {
      const { name } = req.body;
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "name 必填" });
      }
      const c = candidateService.add(name.trim());
      res.status(201).json(c);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  router.post("/candidates/bulk", (req, res) => {
    try {
      const { names } = req.body;
      if (!Array.isArray(names)) return res.status(400).json({ error: "names 须为数组" });
      const arr = names.filter((n: unknown) => typeof n === "string" && n.trim()).map((n: string) => n.trim());
      candidateService.addMany(arr);
      res.json({ added: arr.length });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  router.post("/candidates/upload-excel", upload.single("file"), (req, res) => {
    try {
      if (!req.file?.buffer) return res.status(400).json({ error: "请上传 Excel 文件" });
      const names = parseNamesFromExcel(req.file.buffer);
      if (names.length === 0) return res.status(400).json({ error: "Excel 中未解析到有效名称（第一列）" });
      candidateService.addMany(names);
      res.json({ added: names.length });
    } catch (e) {
      res.status(400).json({ error: String(e) });
    }
  });

  router.delete("/candidates", (_req, res) => {
    try {
      drawService.clearAllDrawData();
      candidateService.clear();
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  // 抽签配置（第一轮名额范围）
  router.get("/draw/config", (_req, res) => {
    res.json(drawService.getRound1Range());
  });

  // 执行抽签：mode 不传或 random=随机，fixed=内定（内定=底库第一条，即 id 最小）
  router.post("/draw", (req, res) => {
    try {
      const { round1Count, mode, fixedCandidateId } = req.body;
      const n = round1Count == null ? undefined : Number(round1Count);
      if (n == null || !Number.isInteger(n)) {
        return res.status(400).json({ error: "round1Count 须为 5-10 的整数" });
      }
      const m = mode === "fixed" ? "fixed" : "random";
      const fixedId = fixedCandidateId == null ? undefined : Number(fixedCandidateId);
      const result = drawService.runDraw(n, m, m === "fixed" ? fixedId : undefined);
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: String(e) });
    }
  });

  // 历史：分页 ?page=1&pageSize=20 返回 { items, total }；无分页时返回前 50 条数组（兼容）
  router.get("/draw/history", (req, res) => {
    const page = Number(req.query.page);
    const pageSize = Number(req.query.pageSize);
    if (Number.isInteger(page) && page >= 1 && Number.isInteger(pageSize) && pageSize >= 1) {
      const size = Math.min(pageSize, 100);
      res.json(drawService.getHistoryPaginated(page, size));
    } else {
      const limit = Math.min(Number(req.query.limit) || 50, 100);
      res.json(drawService.getHistory(limit));
    }
  });

  router.delete("/draw/history/clear", (_req, res) => {
    try {
      drawService.clearHistory();
      res.json({ ok: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      res.status(500).json({ error: msg || "清空失败" });
    }
  });

  router.get("/draw/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "id 须为整数" });
    const result = drawService.getDrawResult(id);
    if (!result) return res.status(404).json({ error: "未找到该抽签" });
    res.json(result);
  });

  return router;
}

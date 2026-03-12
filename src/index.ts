import express from "express";
import path from "path";
import { getDb, initSchema } from "./db/init";
import { createCandidateRepo } from "./infrastructure/candidateRepo";
import { createDrawRepo } from "./infrastructure/drawRepo";
import { cryptoRandom } from "./infrastructure/cryptoRandom";
import { DrawService } from "./application/drawService";
import { CandidateService } from "./application/candidateService";
import { createRoutes } from "./api/routes";

const db = getDb();
initSchema(db);

const candidateRepo = createCandidateRepo(db);
const drawRepo = createDrawRepo(db);
const drawService = new DrawService(candidateRepo, drawRepo, cryptoRandom);
const candidateService = new CandidateService(candidateRepo);

const app = express();
app.use(express.json());
app.use("/api", createRoutes(drawService, candidateService));
// 静态资源目录：使用编译后 dist 旁边的 public（打包成 exe 时会一起作为资源内嵌）
app.use(express.static(path.join(__dirname, "..", "public")));

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log("Lottery server at http://localhost:" + PORT);
});

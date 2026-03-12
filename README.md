# 抽签系统（Node + SQLite）

两轮抽签：第一轮从候选池抽 N 家（5–10 可配置），第二轮从第一轮结果中抽 1 家为最终结果。支持随机 / 内定模式，历史记录存 SQLite。

## 开发环境快速开始（Mac / 开发者）

```bash
npm install
npm run db:init   # 初始化数据库（生成 data/lottery.db）
npm run dev      # 开发：http://localhost:3000
# 或
npm run build && npm start
```

- 前端：浏览器打开 http://localhost:3000
- **导入底库**（/import.html）：Excel 上传（取第一表第一列）、批量粘贴（每行一个）；底库分页展示，可清空
- **抽签**（/draw.html）：第一轮名额 5–10。普通点击按钮为随机模式；按住 Shift 再点击为内定模式（默认以内存中 id 最小候选为内定对象，界面不显式展示「内定」字样）。

## Windows 一键启动（给非技术用户，单个 exe）

为方便不会操作命令行的 Windows 用户，可以打包成**单个可执行文件**，用户只需「双击 exe → 打开浏览器」：

1. 在你的 Mac 上完成构建并打包 exe：

   ```bash
   npm install
   npm run build:exe   # 生成 lottery-win.exe
   ```

2. 将生成的 `lottery-win.exe` 发给 Windows 用户（建议放在一个单独文件夹中，例如 `C:\Users\XX\Desktop\lottery\lottery-win.exe`，但用户无需自己创建其它目录或拷贝任何文件）。

3. Windows 用户的操作：
   - 双击 `lottery-win.exe`；
   - 首次运行时，程序会在当前目录下自动创建 `data\lottery.db` 等运行所需文件；
   - 看到窗口中提示 `Lottery server at http://localhost:3000` 后，在浏览器访问 `http://localhost:3000` 即可使用系统。

整个过程中，**用户不需要安装 Node / npm，也不需要手动创建 `public`、`data` 等目录**。

## API 摘要

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/candidates | 候选列表 |
| POST | /api/candidates | 添加一条 `{ "name": "xxx" }` |
| POST | /api/candidates/bulk | 批量添加 `{ "names": ["a","b"] }` |
| POST | /api/candidates/upload-excel | 上传 Excel（multipart file），第一列作为名称 |
| GET | /api/candidates?page=1&pageSize=20 | 分页列表，返回 `{ "items": [], "total": n }` |
| DELETE | /api/candidates | 清空候选池 |
| GET | /api/draw/config | 第一轮名额范围 `{ "min": 5, "max": 10 }` |
| POST | /api/draw | 抽签 `{ "round1Count": 7, "mode": "random" }` 或 `"fixed"`（内定模式，默认采用候选池中 id 最小的一条作为内定对象，可选 `fixedCandidateId` 覆盖） |
| GET | /api/draw/history | 历史列表 |
| GET | /api/draw/:id | 某次抽签详情 |

## 环境

- `PORT`：服务端口，默认 3000
- `DB_PATH`：SQLite 文件路径，默认 `data/lottery.db`

## 架构

见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。

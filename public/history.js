const API = "/api";
const PAGE_SIZE_DEFAULT = 20;

function el(id) {
  return document.getElementById(id);
}

let currentPage = 1;
let totalCount = 0;
let pageSize = PAGE_SIZE_DEFAULT;

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

/** 将后端时间（无 Z 时视为 UTC）转为北京时间 YYYY-MM-DD HH:mm:ss */
function formatBeijing(isoStr) {
  if (!isoStr) return "";
  const s = String(isoStr).trim();
  const asUtc = /Z$|[+-]\d{2}:?\d{2}$/.test(s) ? s : s.replace(" ", "T") + "Z";
  const d = new Date(asUtc);
  return d.toLocaleString("sv-SE", { timeZone: "Asia/Shanghai" }).replace("T", " ");
}

async function loadHistory() {
  const r = await fetch(API + "/draw/history?page=" + currentPage + "&pageSize=" + pageSize);
  if (!r.ok) return;
  const data = await r.json();
  const list = data.items || [];
  totalCount = data.total ?? 0;
  el("historyTotal").textContent = totalCount;
  const start = (currentPage - 1) * pageSize;
  el("historyList").innerHTML = list.length
    ? list.map((d, i) => {
        const raw = d.final_name != null ? d.final_name : d.finalName;
        const finalName = (raw != null && String(raw).trim()) ? String(raw).trim() : "—";
        return `<tr class="history-row" data-id="${d.id}"><td>${start + i + 1}</td><td>#${d.id}</td><td>${formatBeijing(d.created_at)}</td><td>${d.round1_count} 家</td><td class="col-final"><span class="final-name">${escapeHtml(finalName)}</span></td></tr>`;
      }).join("")
    : "<tr><td colspan='5' class='muted'>暂无记录</td></tr>";
  el("historyList").querySelectorAll(".history-row").forEach((tr) => {
    tr.onclick = () => showDetail(Number(tr.dataset.id));
  });
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  el("btnFirst").disabled = currentPage <= 1;
  el("btnPrev").disabled = currentPage <= 1;
  el("btnNext").disabled = currentPage >= totalPages;
  el("btnLast").disabled = currentPage >= totalPages;
  el("pageInfo").textContent = "第 " + currentPage + " / " + totalPages + " 页";
}

el("btnFirst").onclick = () => { currentPage = 1; loadHistory(); };
el("btnPrev").onclick = () => { if (currentPage > 1) { currentPage--; loadHistory(); } };
el("btnNext").onclick = () => {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  if (currentPage < totalPages) { currentPage++; loadHistory(); }
};
el("btnLast").onclick = () => {
  currentPage = Math.max(1, Math.ceil(totalCount / pageSize));
  loadHistory();
};
el("pageSize").onchange = () => {
  pageSize = Number(el("pageSize").value);
  currentPage = 1;
  loadHistory();
};

el("clearHistory").onclick = async () => {
  if (!confirm("确定清空全部历史记录？此操作不可恢复。")) return;
  try {
    const r = await fetch(API + "/draw/history/clear", { method: "DELETE" });
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      alert(data.error || "清空失败");
      return;
    }
    currentPage = 1;
    el("detailSection").style.display = "none";
    el("listSection").style.display = "block";
    loadHistory();
  } catch (e) {
    alert(e.message || "请求失败");
  }
};

async function showDetail(id) {
  const r = await fetch(API + "/draw/" + id);
  if (!r.ok) return;
  const data = await r.json();
  el("listSection").style.display = "none";
  el("detailSection").style.display = "block";
  el("detailTitle").textContent = "抽签 #" + id;
  el("detailRound1List").innerHTML = data.round1.map((c) => `<li>${c.name}</li>`).join("");
  el("detailFinal").textContent = data.final.name;
}

loadHistory();

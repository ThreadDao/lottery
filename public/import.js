const API = "/api";
const PAGE_SIZE_DEFAULT = 20;

function el(id) {
  return document.getElementById(id);
}

let currentPage = 1;
let totalCount = 0;
let pageSize = PAGE_SIZE_DEFAULT;

async function fetchPage(page, size) {
  const r = await fetch(API + "/candidates?page=" + page + "&pageSize=" + size);
  if (!r.ok) throw new Error("获取列表失败");
  return r.json();
}

function renderTable(data) {
  const tbody = el("tableBody");
  if (!data.items.length) {
    tbody.innerHTML = "<tr><td colspan='2' class='muted'>暂无数据</td></tr>";
    return;
  }
  const start = (currentPage - 1) * pageSize;
  tbody.innerHTML = data.items.map((c, i) => `<tr><td>${start + i + 1}</td><td>#${c.id} ${c.name}</td></tr>`).join("");
}

function updatePagination(total) {
  totalCount = total;
  el("totalCount").textContent = total;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  el("btnFirst").disabled = currentPage <= 1;
  el("btnPrev").disabled = currentPage <= 1;
  el("btnNext").disabled = currentPage >= totalPages;
  el("btnLast").disabled = currentPage >= totalPages;
  el("pageInfo").textContent = "第 " + currentPage + " / " + totalPages + " 页";
}

async function loadPage() {
  try {
    const data = await fetchPage(currentPage, pageSize);
    renderTable(data);
    updatePagination(data.total);
  } catch (e) {
    el("tableBody").innerHTML = "<tr><td colspan='2' class='error'>加载失败</td></tr>";
  }
}

el("btnFirst").onclick = () => { currentPage = 1; loadPage(); };
el("btnPrev").onclick = () => { if (currentPage > 1) { currentPage--; loadPage(); } };
el("btnNext").onclick = () => {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  if (currentPage < totalPages) { currentPage++; loadPage(); }
};
el("btnLast").onclick = () => {
  currentPage = Math.max(1, Math.ceil(totalCount / pageSize));
  loadPage();
};
el("pageSize").onchange = () => {
  pageSize = Number(el("pageSize").value);
  currentPage = 1;
  loadPage();
};

el("pickExcel").onclick = () => el("excelFile").click();
el("excelFile").onchange = async () => {
  const file = el("excelFile").files[0];
  el("excelFile").value = "";
  if (!file) return;
  el("excelStatus").textContent = "上传中…";
  const form = new FormData();
  form.append("file", file);
  try {
    const r = await fetch(API + "/candidates/upload-excel", { method: "POST", body: form });
    const data = await r.json();
    if (!r.ok) {
      el("excelStatus").textContent = data.error || "上传失败";
      el("excelStatus").className = "error";
      return;
    }
    el("excelStatus").textContent = "已导入 " + data.added + " 条";
    el("excelStatus").className = "muted";
    currentPage = 1;
    loadPage();
  } catch (e) {
    el("excelStatus").textContent = e.message || "上传失败";
    el("excelStatus").className = "error";
  }
};

el("clearAll").onclick = async () => {
  if (!confirm("确定清空底库？此操作不可恢复。")) return;
  try {
    const r = await fetch(API + "/candidates", { method: "DELETE" });
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      alert(data.error || "清空失败");
      return;
    }
    currentPage = 1;
    loadPage();
  } catch (e) {
    alert(e.message || "请求失败");
  }
};

loadPage();

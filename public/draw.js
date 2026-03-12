const API = "/api";

function el(id) {
  return document.getElementById(id);
}

/** 当前本次抽签的完整结果（第一轮揭晓后即已产生，最终结果仅在前端延后展示） */
let lastDrawResult = null;

function applyDrawResult(data) {
  lastDrawResult = data;
  el("configSection").style.display = "none";
  el("resultSection").style.display = "block";
  el("round1List").innerHTML = data.round1.map((c) => `<li>${escapeHtml(c.name)}</li>`).join("");
  el("finalPlaceholder").style.display = "block";
  el("finalResult").classList.remove("final-reveal");
  el("finalResult").style.display = "none";
  el("finalResult").textContent = "";
  el("revealFinal").style.display = "inline-block";
}

function getRound1Count() {
  const raw = el("round1Count").value;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 5 || n > 10) return null;
  return n;
}

el("runDraw").onclick = async (e) => {
  const round1Count = getRound1Count();
  if (round1Count == null) {
    el("drawError").textContent = "第一轮名额请填写 5～10 的整数";
    return;
  }
  const mode = e.shiftKey ? "fixed" : "random";
  el("drawError").textContent = "";
  try {
    const r = await fetch(API + "/draw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ round1Count, mode }),
    });
    const data = await r.json();
    if (!r.ok) {
      el("drawError").textContent = data.error || "抽签失败";
      return;
    }
    applyDrawResult(data);
  } catch (err) {
    el("drawError").textContent = err.message || "请求失败";
  }
};

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

el("revealFinal").onclick = () => {
  if (!lastDrawResult) return;
  el("finalPlaceholder").style.display = "none";
  el("finalResult").textContent = lastDrawResult.final.name;
  el("finalResult").classList.add("final-reveal");
  el("finalResult").style.display = "block";
  el("revealFinal").style.display = "none";
};

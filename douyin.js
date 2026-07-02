// ============================================================
// Douyin Live Scraper — Cloudflare Worker
// ============================================================

const HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Douyin Live Scraper</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0f0f12; --surface: #1a1a22; --border: #2a2a38;
      --accent: #fe2c55; --accent2: #25f4ee;
      --text: #e8e8f0; --muted: #888899;
      --live: #22c55e; --ended: #ef4444; --offline: #6b7280; --warn: #f59e0b;
    }
    body { background:var(--bg); color:var(--text); font-family:'Segoe UI',system-ui,sans-serif; min-height:100vh; padding:24px 16px; }
    header { text-align:center; margin-bottom:36px; }
    .logo { display:inline-flex; align-items:center; gap:10px; margin-bottom:8px; }
    .logo-icon { width:40px;height:40px;background:linear-gradient(135deg,var(--accent),var(--accent2));border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px; }
    h1 { font-size:1.6rem; font-weight:700; letter-spacing:-0.5px; }
    .subtitle { color:var(--muted); font-size:0.85rem; margin-top:4px; }
    .container { max-width:900px; margin:0 auto; }
    .tabs { display:flex;gap:4px;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:4px;margin-bottom:20px; }
    .tab { flex:1;padding:9px;text-align:center;font-size:0.85rem;font-weight:600;border-radius:7px;cursor:pointer;color:var(--muted);transition:all 0.2s;border:none;background:transparent; }
    .tab.active { background:var(--accent); color:#fff; }
    .card { background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:16px; }
    label { font-size:0.8rem;color:var(--muted);font-weight:600;display:block;margin-bottom:6px;letter-spacing:0.5px;text-transform:uppercase; }
    input[type="text"],textarea { width:100%;background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:10px 14px;font-size:0.9rem;outline:none;transition:border-color 0.2s;font-family:inherit; }
    input[type="text"]:focus,textarea:focus { border-color:var(--accent); }
    textarea { resize:vertical; min-height:120px; }
    .btn { display:inline-flex;align-items:center;gap:6px;padding:10px 22px;border-radius:8px;border:none;cursor:pointer;font-size:0.9rem;font-weight:600;transition:all 0.2s; }
    .btn-primary { background:var(--accent); color:#fff; }
    .btn-primary:hover { opacity:0.88; }
    .btn-primary:disabled { opacity:0.4; cursor:not-allowed; }
    .btn-outline { background:transparent;color:var(--text);border:1px solid var(--border); }
    .btn-outline:hover { border-color:var(--accent); color:var(--accent); }
    .btn-copy { background:transparent;color:var(--accent2);border:1px solid var(--accent2);padding:10px 18px; }
    .btn-copy:hover { background:rgba(37,244,238,0.08); }
    .btn-copy.copied { color:var(--live); border-color:var(--live); }
    .actions { display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;align-items:center; }
    .result-box { background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:16px;margin-top:16px; }
    .result-grid { display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px; }
    .result-label { font-size:0.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px; }
    .result-value { font-size:0.95rem;font-weight:600;word-break:break-all; }
    .badge { display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:0.8rem;font-weight:600; }
    .badge-live  { background:rgba(34,197,94,0.15); color:var(--live); }
    .badge-ended { background:rgba(239,68,68,0.15); color:var(--ended); }
    .badge-offline { background:rgba(107,114,128,0.15); color:var(--offline); }
    .badge-warn  { background:rgba(245,158,11,0.15); color:var(--warn); }
    .badge-done  { background:rgba(34,197,94,0.15); color:var(--live); }
    .badge-notfound { background:rgba(239,68,68,0.15); color:var(--ended); }
    .badge-pending { background:rgba(245,158,11,0.15); color:var(--warn); }
    .link-val a { color:var(--accent2);text-decoration:none;font-size:0.82rem; }
    .link-val a:hover { text-decoration:underline; }
    .batch-wrap { margin-top:16px; }
    .batch-table { width:100%; border-collapse:collapse; font-size:0.83rem; }
    .batch-table th { text-align:left;padding:10px 12px;background:var(--surface);color:var(--muted);border-bottom:1px solid var(--border);font-size:0.72rem;text-transform:uppercase;letter-spacing:0.5px; }
    .batch-table td { padding:10px 12px;border-bottom:1px solid var(--border);vertical-align:middle; }
    .batch-table tr:last-child td { border-bottom:none; }
    .batch-table tr:hover td { background:rgba(255,255,255,0.02); }
    .batch-table td.col-title { white-space:normal; word-break:break-word; max-width:260px; }
    .batch-table td.col-url { font-size:0.72rem;color:var(--muted);word-break:break-all;max-width:180px; }
    .loading { display:flex;align-items:center;gap:8px;color:var(--muted);font-size:0.85rem;padding:12px 0; }
    .spinner { width:16px;height:16px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin 0.7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .error-msg { color:var(--ended);font-size:0.85rem;padding:10px;background:rgba(239,68,68,0.08);border-radius:8px;margin-top:12px; }
    .hint { font-size:0.78rem;color:var(--muted);margin-top:6px; }
    .code-block { background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:14px;font-family:'Courier New',monospace;font-size:0.78rem;color:var(--accent2);white-space:pre-wrap;word-break:break-all;margin-top:10px; }
    .section-title { font-size:0.78rem;text-transform:uppercase;letter-spacing:0.6px;color:var(--muted);margin-bottom:10px;font-weight:700; }
    .summary-bar { display:flex;gap:16px;flex-wrap:wrap;padding:12px 16px;background:var(--surface);border:1px solid var(--border);border-radius:10px;margin-bottom:12px;font-size:0.82rem; }
    .summary-bar span { color:var(--muted); }
    .summary-bar strong { color:var(--text); }
  </style>
</head>
<body>
<div class="container">
  <header>
    <div class="logo">
      <div class="logo-icon">🎥</div>
      <h1>Douyin Live Scraper</h1>
    </div>
    <p class="subtitle">Live status, viewers & profile data from Douyin URLs</p>
  </header>
  <div class="tabs">
    <button class="tab active" onclick="switchTab('single')">Single URL</button>
    <button class="tab" onclick="switchTab('batch')">Batch URLs</button>
    <button class="tab" onclick="switchTab('api')">API Docs</button>
  </div>
  <div id="tab-single">
    <div class="card">
      <label>Douyin Live URL</label>
      <input type="text" id="singleUrl" placeholder="https://live.douyin.com/123456789 or room ID" />
      <p class="hint">Accepts full URL, short link, or just the room number</p>
      <div class="actions">
        <button class="btn btn-primary" id="singleBtn" onclick="scrapeSingle()">🔍 Scrape</button>
        <button class="btn btn-outline" onclick="clearSingle()">Clear</button>
      </div>
    </div>
    <div id="singleResult"></div>
  </div>
  <div id="tab-batch" style="display:none">
    <div class="card">
      <label>URLs (one per line, max 50)</label>
      <textarea id="batchUrls" placeholder="https://live.douyin.com/111111&#10;https://live.douyin.com/222222&#10;333333"></textarea>
      <div class="actions">
        <button class="btn btn-primary" id="batchBtn" onclick="scrapeBatch()">🚀 Scrape All</button>
        <button class="btn btn-outline" onclick="document.getElementById('batchUrls').value=''">Clear</button>
        <button class="btn btn-outline" id="exportBtn" onclick="exportCSV()" style="display:none">⬇ Export CSV</button>
        <button class="btn btn-copy"    id="copyBtn"   onclick="copyTable()"  style="display:none">📋 Copy Table</button>
      </div>
    </div>
    <div id="batchResult"></div>
  </div>
  <div id="tab-api" style="display:none">
    <div class="card">
      <p class="section-title">POST /api/scrape</p>
      <div class="code-block">POST /api/scrape
Content-Type: application/json
{"url":"https://live.douyin.com/123456789"}</div>
    </div>
    <div class="card">
      <p class="section-title">POST /api/scrape/batch</p>
      <div class="code-block">POST /api/scrape/batch
Content-Type: application/json
{"urls":["https://live.douyin.com/111","https://live.douyin.com/222"]}</div>
    </div>
    <div class="card">
      <p class="section-title">Base URL</p>
      <div class="code-block" id="baseUrlBlock"></div>
    </div>
  </div>
</div>
<script>
  document.getElementById("baseUrlBlock").textContent = window.location.origin;
  function switchTab(name) {
    ["single","batch","api"].forEach((t,i) => {
      document.getElementById("tab-"+t).style.display = t===name?"":"none";
      document.querySelectorAll(".tab")[i].classList.toggle("active",t===name);
    });
  }
  function badgeFor(s) {
    if(!s) return "—";
    if(s.includes("🟢")) return \`<span class="badge badge-live">\${s}</span>\`;
    if(s.includes("🔴")) return \`<span class="badge badge-ended">\${s}</span>\`;
    if(s.includes("⚠️")) return \`<span class="badge badge-warn">\${s}</span>\`;
    return \`<span class="badge badge-offline">\${s}</span>\`;
  }
  function taskBadge(ts) {
    if(!ts) return "—";
    if(ts.includes("✅")) return \`<span class="badge badge-done">\${ts}</span>\`;
    if(ts.includes("❌")) return \`<span class="badge badge-notfound">\${ts}</span>\`;
    return \`<span class="badge badge-pending">\${ts}</span>\`;
  }
  async function scrapeSingle() {
    const url = document.getElementById("singleUrl").value.trim();
    if(!url) return;
    const btn = document.getElementById("singleBtn");
    btn.disabled = true;
    const el = document.getElementById("singleResult");
    el.innerHTML = \`<div class="loading"><div class="spinner"></div>Fetching data…</div>\`;
    try {
      const res = await fetch("/api/scrape",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url})});
      const d = await res.json();
      const data = d.data || {};
      el.innerHTML = \`<div class="result-box"><div class="result-grid">
        <div><div class="result-label">Status</div><div class="result-value">\${badgeFor(data.status)}</div></div>
        <div><div class="result-label">Task</div><div class="result-value">\${taskBadge(data.taskStatus)}</div></div>
        <div><div class="result-label">Total Viewers</div><div class="result-value">\${data.totalViewers?Number(data.totalViewers).toLocaleString():"—"}</div></div>
        <div><div class="result-label">Streamer</div><div class="result-value">\${data.nickname||"—"}</div></div>
        <div style="grid-column:1/-1"><div class="result-label">Live Title</div><div class="result-value">\${data.title||"—"}</div></div>
        \${data.profileUrl?\`<div class="link-val" style="grid-column:1/-1"><div class="result-label">Profile</div><div class="result-value"><a href="\${data.profileUrl}" target="_blank">\${data.profileUrl}</a></div></div>\`:""}
      </div></div>\`;
    } catch(e) { el.innerHTML=\`<div class="error-msg">❌ \${e.message}</div>\`; }
    btn.disabled = false;
  }
  let batchData = [];
  async function scrapeBatch() {
    const raw = document.getElementById("batchUrls").value.trim();
    if(!raw) return;
    const urls = raw.split("\\n").map(u=>u.trim()).filter(Boolean).slice(0,50);
    const btn = document.getElementById("batchBtn");
    btn.disabled = true;
    document.getElementById("exportBtn").style.display="none";
    document.getElementById("copyBtn").style.display="none";
    const el = document.getElementById("batchResult");
    el.innerHTML=\`<div class="loading"><div class="spinner"></div>Scraping \${urls.length} URLs…</div>\`;
    try {
      const res = await fetch("/api/scrape/batch",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({urls})});
      const d = await res.json();
      batchData = d.results||[];
      renderBatchTable(batchData);
      if(batchData.length){document.getElementById("exportBtn").style.display="";document.getElementById("copyBtn").style.display="";}
    } catch(e){el.innerHTML=\`<div class="error-msg">❌ \${e.message}</div>\`;}
    btn.disabled=false;
  }
  function renderBatchTable(rows) {
    const el=document.getElementById("batchResult");
    if(!rows.length){el.innerHTML=\`<div class="error-msg">No results</div>\`;return;}
    const live=rows.filter(r=>r.status&&r.status.includes("🟢")).length;
    const ended=rows.filter(r=>r.status&&r.status.includes("🔴")).length;
    el.innerHTML=\`
      <div class="summary-bar">
        <span>Total: <strong>\${rows.length}</strong></span>
        <span>🟢 Live: <strong style="color:var(--live)">\${live}</strong></span>
        <span>🔴 Ended: <strong style="color:var(--ended)">\${ended}</strong></span>
        <span>⚫ Other: <strong style="color:var(--muted)">\${rows.length-live-ended}</strong></span>
      </div>
      <div class="batch-wrap"><table class="batch-table">
        <thead><tr><th>#</th><th>Status</th><th>Streamer</th><th>Viewers</th><th>Title</th><th>Task</th><th>URL</th></tr></thead>
        <tbody>\${rows.map((r,i)=>\`<tr>
          <td style="color:var(--muted)">\${i+1}</td>
          <td>\${badgeFor(r.status)}</td>
          <td>\${r.nickname||"—"}</td>
          <td>\${r.totalViewers?Number(r.totalViewers).toLocaleString():"—"}</td>
          <td class="col-title">\${r.title||"—"}</td>
          <td>\${taskBadge(r.taskStatus)}</td>
          <td class="col-url">\${r.url}</td>
        </tr>\`).join("")}</tbody>
      </table></div>\`;
  }
  function exportCSV() {
    if(!batchData.length) return;
    const header=["#","URL","Status","Streamer","Total Viewers","Title","Profile URL","Task Status"];
    const rows=batchData.map((r,i)=>[i+1,r.url,r.status,r.nickname,r.totalViewers,r.title,r.profileUrl,r.taskStatus]);
    const csv=[header,...rows].map(r=>r.map(v=>\`"\${(v||"").replace(/"/g,'""')}"\`).join(",")).join("\\n");
    const blob=new Blob(["\\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download="douyin_scrape_"+Date.now()+".csv";
    a.click();
  }
  function copyTable() {
    if(!batchData.length) return;
    const header=["#","URL","Status","Streamer","Viewers","Title","Profile URL","Task"].join("\\t");
    const rows=batchData.map((r,i)=>[i+1,r.url,r.status,r.nickname||"",r.totalViewers||"",r.title||"",r.profileUrl||"",r.taskStatus||""].join("\\t"));
    navigator.clipboard.writeText([header,...rows].join("\\n")).then(()=>{
      const btn=document.getElementById("copyBtn");
      btn.textContent="✅ Copied!";btn.classList.add("copied");
      setTimeout(()=>{btn.textContent="📋 Copy Table";btn.classList.remove("copied");},2000);
    });
  }
  function clearSingle(){document.getElementById("singleUrl").value="";document.getElementById("singleResult").innerHTML="";}
  document.getElementById("singleUrl").addEventListener("keydown",e=>{if(e.key==="Enter")scrapeSingle();});
</script>
</body>
</html>`;

// ============================================================
// Scraping helpers
// ============================================================

function normaliseLiveUrl(raw) {
  if (raw.indexOf("live.douyin.com") !== -1) return raw.split("?")[0];
  const digits = raw.replace(/[^0-9]/g, "");
  return "https://live.douyin.com/" + digits;
}

function buildHeaders() {
  return {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Referer": "https://www.douyin.com/",
    "Cache-Control": "no-cache",
  };
}

function safeDecode(str) {
  if (!str) return "";
  try { return decodeURIComponent(str); }
  catch(e) { return str; }
}

function unescape_(s) {
  if (!s) return "";
  return String(s)
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, c) => String.fromCharCode(parseInt(c, 16)))
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, c) => String.fromCharCode(parseInt(c, 16)))
    .replace(/\\n/g, " ").replace(/\\"/g, '"')
    .trim();
}

function parseWan(str) {
  const s = String(str).trim();
  const wan = s.match(/^([\d.]+)万/);
  if (wan) return Math.round(parseFloat(wan[1]) * 10000).toString();
  const num = parseFloat(s);
  return isNaN(num) ? s : Math.round(num).toString();
}

function extractTotalViewers(html) {
  const patterns = [
    /"total_user"\s*:\s*([0-9]+)/,
    /"total_user_str"\s*:\s*"([^"]+)"/,
    /"viewer_count"\s*:\s*([0-9]+)/,
    /"viewerCount"\s*:\s*([0-9]+)/,
    /"online_user"\s*:\s*([0-9]+)/,
    /"user_count"\s*:\s*([0-9]+)/,
  ];
  for (const pat of patterns) {
    const m = html.match(pat);
    if (m && m[1]) return /^\d+$/.test(m[1]) ? m[1] : parseWan(m[1]);
  }
  const wanMatch = html.match(/([\d.]+)\s*万/);
  if (wanMatch) return parseWan(wanMatch[1] + "万");
  return "";
}

function getTaskStatus(data) {
  const s = data.status || "";
  if (s.includes("⚠️") || s.includes("HTTP") || s.includes("error")) return "❌ Not Found";
  if (s.includes("🟢") || s.includes("🔴") || s.includes("⚫")) {
    if (data.title || data.nickname || data.totalViewers) return "✅ Done";
    return "⏳ Pending";
  }
  return "⏳ Pending";
}

function extractQuot(html, patterns) {
  for (const pat of patterns) {
    const m = html.match(pat);
    if (m && m[1]) return unescape_(m[1]);
  }
  return "";
}

function extract_(html, patterns) {
  for (const pat of patterns) {
    const m = html.match(pat);
    if (m && m[1]) return unescape_(m[1]);
  }
  return "";
}

function findInJson(obj, key, depth = 0) {
  if (depth > 12 || !obj || typeof obj !== "object") return null;
  if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") return obj[key];
  for (const k of Object.keys(obj)) {
    const r = findInJson(obj[k], key, depth + 1);
    if (r !== null && r !== undefined && r !== "") return r;
  }
  return null;
}

function errData(msg) {
  return { status: msg, title: "", nickname: "", secUid: "", totalViewers: "" };
}

function isUseful(d) {
  return !!(d && (d.title || d.totalViewers || d.status === "🟢 Live" || d.status === "🔴 Ended" || d.nickname));
}

function tryDataAttributes(html) {
  let nickname = "", secUid = "", title = "", statusCode = "";
  const am = html.match(/data-anchor-info="([^"]+)"/);
  if (am) {
    try {
      const anchor = JSON.parse(am[1].replace(/&quot;/g, '"').replace(/&#x2F;/g, '/'));
      nickname = anchor.nickname || "";
    } catch(e) {}
  }
  if (!title) title = extractQuot(html, [
    /&quot;title&quot;:&quot;([^&]{2,150})&quot;/,
    /&quot;roomTitle&quot;:&quot;([^&]{2,150})&quot;/,
    /&quot;live_room_name&quot;:&quot;([^&]{2,150})&quot;/,
  ]);
  if (!title) { const tm = html.match(/\\"title\\":\\"([^\\]{2,150})\\"/); if(tm) title=tm[1]; }
  secUid = extractQuot(html, [
    /&quot;sec_uid&quot;:&quot;([A-Za-z0-9_\-]{20,})&quot;/,
    /&quot;secUid&quot;:&quot;([A-Za-z0-9_\-]{20,})&quot;/,
  ]);
  if (!secUid) {
    let sm = html.match(/"sec_uid"\s*:\s*"([A-Za-z0-9_\-]{20,})"/);
    if (!sm) sm = html.match(/\\"sec_uid\\":\\"([A-Za-z0-9_\-]{20,})\\"/);
    if (sm) secUid = sm[1];
  }
  statusCode = extractQuot(html, [/&quot;status&quot;:([0-9])/]);
  if (!statusCode) {
    let sm = html.match(/\\"status\\":([0-9])/);
    if (!sm) sm = html.match(/"status"\s*:\s*([0-9])/);
    if (sm) statusCode = sm[1];
  }
  const totalViewers = extractTotalViewers(html);
  const sc = parseInt(statusCode);
  let status = "";
  if      (sc === 2)                status = "🟢 Live";
  else if (sc === 4)                status = "🔴 Ended";
  else if (!title && !totalViewers) status = "⚠️ No Data";
  else                              status = "⚫ Offline";
  return { status, title: unescape_(title), nickname: unescape_(nickname), secUid, totalViewers };
}

function extractFromParsedJson(json, html) {
  try {
    const title    = findInJson(json, "title")    || findInJson(json, "roomTitle") || "";
    const nickname = findInJson(json, "nickname") || "";
    const secUid   = findInJson(json, "sec_uid")  || findInJson(json, "secUid")   || "";
    const sc       = parseInt(findInJson(json, "status"));
    let status = sc===2?"🟢 Live":sc===4?"🔴 Ended":"⚫ Offline";
    const totalViewers = extractTotalViewers(html);
    if (!totalViewers && !title) status = "⚠️ No Data";
    return { status, title: unescape_(title), nickname: unescape_(nickname), secUid: String(secUid), totalViewers };
  } catch(e) { return null; }
}

function tryRenderData(html) {
  const m = html.match(/<script[^>]+id=["']RENDER_DATA["'][^>]*>([^<]+)<\/script>/i);
  if (!m || !m[1]) return null;
  try { return extractFromParsedJson(JSON.parse(safeDecode(m[1].trim())), html); }
  catch(e) { return null; }
}

function tryNextData(html) {
  const m = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!m || !m[1]) return null;
  try { return extractFromParsedJson(JSON.parse(m[1].trim()), html); }
  catch(e) { return null; }
}

function tryRegexFallback(html) {
  const title    = extract_(html, [/"roomTitle"\s*:\s*"([^"]{2,150})"/, /"title"\s*:\s*"([^"]{2,120})"/, /<title>\s*([^<|—\-]{5,100})/]);
  const nickname = extract_(html, [/"nickname"\s*:\s*"([^"]{2,60})"/]);
  const secUid   = extract_(html, [/"sec_uid"\s*:\s*"([A-Za-z0-9_\-]{20,})"/]);
  const isLive   = /"status"\s*:\s*2[^0-9]/.test(html);
  const isEnded  = /"status"\s*:\s*4[^0-9]/.test(html);
  const totalViewers = extractTotalViewers(html);
  const status = isEnded?"🔴 Ended":isLive?"🟢 Live":(!title&&!totalViewers)?"⚠️ No Data":"⚫ Offline";
  return { status, title, nickname, secUid, totalViewers };
}

function parseLivePage(html) {
  let d = tryDataAttributes(html); if (d && isUseful(d)) return d;
  d = tryRenderData(html);         if (d && isUseful(d)) return d;
  d = tryNextData(html);           if (d && isUseful(d)) return d;
  return tryRegexFallback(html);
}

async function scrapeUrl(rawUrl) {
  const liveUrl = normaliseLiveUrl(rawUrl.trim());
  try {
    const response = await fetch(liveUrl, {
      method: "GET",
      headers: buildHeaders(),
      redirect: "follow",
    });
    if (!response.ok) return errData("HTTP " + response.status);
    const html = await response.text();
    return parseLivePage(html);
  } catch(err) {
    return errData("Fetch error: " + String(err).substring(0, 60));
  }
}

function buildResponse(data) {
  const profileUrl = data.secUid ? "https://www.douyin.com/user/" + data.secUid : "";
  const taskStatus = getTaskStatus(data);
  return {
    success: taskStatus === "✅ Done",
    data: {
      status: data.status,
      title: data.title || "",
      nickname: data.nickname || "",
      totalViewers: data.totalViewers || "",
      profileUrl,
      secUid: data.secUid || "",
      taskStatus,
    },
  };
}

// ============================================================
// Cloudflare Worker entry point
// ============================================================

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // ── POST /api/scrape ──────────────────────────────────
    if (path === "/api/scrape" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const rawUrl = body.url || body.douyinUrl || "";
      if (!rawUrl) return Response.json({ success: false, error: "URL required" }, { headers: corsHeaders });
      const data = await scrapeUrl(rawUrl);
      return Response.json(buildResponse(data), { headers: corsHeaders });
    }

    // ── POST /api/scrape/batch ────────────────────────────
    if (path === "/api/scrape/batch" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const urls = body.urls;
      if (!Array.isArray(urls) || urls.length === 0)
        return Response.json({ success: false, error: "urls array required" }, { headers: corsHeaders });
      if (urls.length > 50)
        return Response.json({ success: false, error: "Max 50 URLs per batch" }, { headers: corsHeaders });

      const results = await Promise.all(
        urls.map(async (rawUrl) => {
          const data = await scrapeUrl(rawUrl);
          const profileUrl = data.secUid ? "https://www.douyin.com/user/" + data.secUid : "";
          return {
            url: rawUrl,
            status: data.status,
            title: data.title || "",
            nickname: data.nickname || "",
            totalViewers: data.totalViewers || "",
            profileUrl,
            taskStatus: getTaskStatus(data),
          };
        })
      );
      return Response.json({ success: true, count: results.length, results }, { headers: corsHeaders });
    }

    // ── GET /api/scrape?url= ──────────────────────────────
    if (path === "/api/scrape" && request.method === "GET") {
      const rawUrl = url.searchParams.get("url") || "";
      if (!rawUrl) return Response.json({ success: false, error: "?url= required" }, { headers: corsHeaders });
      const data = await scrapeUrl(rawUrl);
      return Response.json(buildResponse(data), { headers: corsHeaders });
    }

    // ── Frontend ──────────────────────────────────────────
    return new Response(HTML, {
      headers: { "Content-Type": "text/html;charset=UTF-8" },
    });
  },
};
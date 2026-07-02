// lib/scraper.js — core scraping logic (converted from Cloudflare Worker)

export function normaliseLiveUrl(raw) {
  if (raw.indexOf("live.douyin.com") !== -1) return raw.split("?")[0];
  const digits = raw.replace(/[^0-9]/g, "");
  return "https://live.douyin.com/" + digits;
}

export function buildHeaders() {
  return {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    Referer: "https://www.douyin.com/",
    "Cache-Control": "no-cache",
  };
}

export function safeDecode(str) {
  if (!str) return "";
  try {
    return decodeURIComponent(str);
  } catch (e) {
    return str;
  }
}

export function unescape_(s) {
  if (!s) return "";
  return String(s)
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, c) =>
      String.fromCharCode(parseInt(c, 16))
    )
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, c) =>
      String.fromCharCode(parseInt(c, 16))
    )
    .replace(/\\n/g, " ")
    .replace(/\\"/g, '"')
    .trim();
}

export function parseWan(str) {
  const s = String(str).trim();
  const wan = s.match(/^([\d.]+)万/);
  if (wan) return Math.round(parseFloat(wan[1]) * 10000).toString();
  const num = parseFloat(s);
  return isNaN(num) ? s : Math.round(num).toString();
}

export function extractTotalViewers(html) {
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

export function getTaskStatus(data) {
  const s = data.status || "";
  if (s.includes("⚠️") || s.includes("HTTP") || s.includes("error"))
    return "❌ Not Found";
  if (s.includes("🟢") || s.includes("🔴") || s.includes("⚫")) {
    if (data.title || data.nickname || data.totalViewers) return "✅ Done";
    return "⏳ Pending";
  }
  return "⏳ Pending";
}

export function extractQuot(html, patterns) {
  for (const pat of patterns) {
    const m = html.match(pat);
    if (m && m[1]) return unescape_(m[1]);
  }
  return "";
}

export function extract_(html, patterns) {
  for (const pat of patterns) {
    const m = html.match(pat);
    if (m && m[1]) return unescape_(m[1]);
  }
  return "";
}

export function findInJson(obj, key, depth = 0) {
  if (depth > 12 || !obj || typeof obj !== "object") return null;
  if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "")
    return obj[key];
  for (const k of Object.keys(obj)) {
    const r = findInJson(obj[k], key, depth + 1);
    if (r !== null && r !== undefined && r !== "") return r;
  }
  return null;
}

export function errData(msg) {
  return { status: msg, title: "", nickname: "", secUid: "", totalViewers: "" };
}

export function isUseful(d) {
  return !!(
    d &&
    (d.title ||
      d.totalViewers ||
      d.status === "🟢 Live" ||
      d.status === "🔴 Ended" ||
      d.nickname)
  );
}

export function tryDataAttributes(html) {
  let nickname = "",
    secUid = "",
    title = "",
    statusCode = "";
  const am = html.match(/data-anchor-info="([^"]+)"/);
  if (am) {
    try {
      const anchor = JSON.parse(
        am[1].replace(/&quot;/g, '"').replace(/&#x2F;/g, "/")
      );
      nickname = anchor.nickname || "";
    } catch (e) {}
  }
  if (!title)
    title = extractQuot(html, [
      /&quot;title&quot;:&quot;([^&]{2,150})&quot;/,
      /&quot;roomTitle&quot;:&quot;([^&]{2,150})&quot;/,
      /&quot;live_room_name&quot;:&quot;([^&]{2,150})&quot;/,
    ]);
  if (!title) {
    const tm = html.match(/\\"title\\":\\"([^\\]{2,150})\\"/);
    if (tm) title = tm[1];
  }
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
  if (sc === 2) status = "🟢 Live";
  else if (sc === 4) status = "🔴 Ended";
  else if (!title && !totalViewers) status = "⚠️ No Data";
  else status = "⚫ Offline";
  return {
    status,
    title: unescape_(title),
    nickname: unescape_(nickname),
    secUid,
    totalViewers,
  };
}

export function extractFromParsedJson(json, html) {
  try {
    const title =
      findInJson(json, "title") || findInJson(json, "roomTitle") || "";
    const nickname = findInJson(json, "nickname") || "";
    const secUid =
      findInJson(json, "sec_uid") || findInJson(json, "secUid") || "";
    const sc = parseInt(findInJson(json, "status"));
    let status =
      sc === 2 ? "🟢 Live" : sc === 4 ? "🔴 Ended" : "⚫ Offline";
    const totalViewers = extractTotalViewers(html);
    if (!totalViewers && !title) status = "⚠️ No Data";
    return {
      status,
      title: unescape_(title),
      nickname: unescape_(nickname),
      secUid: String(secUid),
      totalViewers,
    };
  } catch (e) {
    return null;
  }
}

export function tryRenderData(html) {
  const m = html.match(
    /<script[^>]+id=["']RENDER_DATA["'][^>]*>([^<]+)<\/script>/i
  );
  if (!m || !m[1]) return null;
  try {
    return extractFromParsedJson(
      JSON.parse(safeDecode(m[1].trim())),
      html
    );
  } catch (e) {
    return null;
  }
}

export function tryNextData(html) {
  const m = html.match(
    /<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i
  );
  if (!m || !m[1]) return null;
  try {
    return extractFromParsedJson(JSON.parse(m[1].trim()), html);
  } catch (e) {
    return null;
  }
}

export function tryRegexFallback(html) {
  const title = extract_(html, [
    /"roomTitle"\s*:\s*"([^"]{2,150})"/,
    /"title"\s*:\s*"([^"]{2,120})"/,
    /<title>\s*([^<|—\-]{5,100})/,
  ]);
  const nickname = extract_(html, [/"nickname"\s*:\s*"([^"]{2,60})"/]);
  const secUid = extract_(html, [
    /"sec_uid"\s*:\s*"([A-Za-z0-9_\-]{20,})"/,
  ]);
  const isLive = /"status"\s*:\s*2[^0-9]/.test(html);
  const isEnded = /"status"\s*:\s*4[^0-9]/.test(html);
  const totalViewers = extractTotalViewers(html);
  const status = isEnded
    ? "🔴 Ended"
    : isLive
    ? "🟢 Live"
    : !title && !totalViewers
    ? "⚠️ No Data"
    : "⚫ Offline";
  return { status, title, nickname, secUid, totalViewers };
}

export function parseLivePage(html) {
  let d = tryDataAttributes(html);
  if (d && isUseful(d)) return d;
  d = tryRenderData(html);
  if (d && isUseful(d)) return d;
  d = tryNextData(html);
  if (d && isUseful(d)) return d;
  return tryRegexFallback(html);
}

export async function scrapeUrl(rawUrl) {
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
  } catch (err) {
    return errData("Fetch error: " + String(err).substring(0, 60));
  }
}

export function buildResponse(data) {
  const profileUrl = data.secUid
    ? "https://www.douyin.com/user/" + data.secUid
    : "";
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

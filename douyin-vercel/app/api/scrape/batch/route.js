// app/api/scrape/batch/route.js — batch scrape (up to 50 URLs)

import { scrapeUrl, getTaskStatus } from "@/lib/scraper";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const urls = body.urls;
    if (!Array.isArray(urls) || urls.length === 0)
      return Response.json(
        { success: false, error: "urls array required" },
        { headers: CORS }
      );
    if (urls.length > 50)
      return Response.json(
        { success: false, error: "Max 50 URLs per batch" },
        { headers: CORS }
      );

    const results = await Promise.all(
      urls.map(async (rawUrl) => {
        const data = await scrapeUrl(rawUrl);
        const profileUrl = data.secUid
          ? "https://www.douyin.com/user/" + data.secUid
          : "";
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

    return Response.json(
      { success: true, count: results.length, results },
      { headers: CORS }
    );
  } catch (e) {
    return Response.json(
      { success: false, error: String(e) },
      { status: 500, headers: CORS }
    );
  }
}

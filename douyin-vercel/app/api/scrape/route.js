// app/api/scrape/route.js — single & GET scrape

import { scrapeUrl, buildResponse } from "@/lib/scraper";

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
    const rawUrl = body.url || body.douyinUrl || "";
    if (!rawUrl)
      return Response.json(
        { success: false, error: "URL required" },
        { headers: CORS }
      );
    const data = await scrapeUrl(rawUrl);
    return Response.json(buildResponse(data), { headers: CORS });
  } catch (e) {
    return Response.json(
      { success: false, error: String(e) },
      { status: 500, headers: CORS }
    );
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url") || "";
  if (!rawUrl)
    return Response.json(
      { success: false, error: "?url= required" },
      { headers: CORS }
    );
  const data = await scrapeUrl(rawUrl);
  return Response.json(buildResponse(data), { headers: CORS });
}

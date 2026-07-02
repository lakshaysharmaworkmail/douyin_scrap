// app/route.js — serves full HTML frontend on GET /
import { HTML } from "@/lib/html";

export async function GET() {
  return new Response(HTML, {
    headers: { "Content-Type": "text/html;charset=UTF-8" },
  });
}

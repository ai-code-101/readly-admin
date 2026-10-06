// Same-origin proxy to the Readly API (/api/v1/*). The admin token is attached
// here on the server so it never reaches the browser.
import type { NextRequest } from "next/server";

const API_URL = process.env.READLY_API_URL ?? "http://localhost:8080";
const ADMIN_TOKEN = process.env.READLY_ADMIN_TOKEN ?? "";

const FORWARDED_REQUEST_HEADERS = ["content-type", "content-length", "range", "if-none-match", "accept"];
const FORWARDED_RESPONSE_HEADERS = [
  "content-type", "content-length", "content-range", "accept-ranges",
  "etag", "cache-control", "last-modified",
];

async function proxy(req: NextRequest, ctx: RouteContext<"/api/v1/[...path]">) {
  const { path } = await ctx.params;
  const target = new URL(`/api/v1/${path.map(encodeURIComponent).join("/")}`, API_URL);
  target.search = req.nextUrl.search;

  const headers = new Headers({ Authorization: `Bearer ${ADMIN_TOKEN}` });
  for (const h of FORWARDED_REQUEST_HEADERS) {
    const v = req.headers.get(h);
    if (v) headers.set(h, v);
  }

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? req.body : undefined,
      // Required by Node's fetch when streaming a request body (uploads).
      ...(hasBody ? { duplex: "half" } : {}),
      cache: "no-store",
      redirect: "manual",
    } as RequestInit);
  } catch {
    return Response.json({ error: `Cannot reach the Readly API at ${API_URL}` }, { status: 502 });
  }

  const out = new Headers();
  for (const h of FORWARDED_RESPONSE_HEADERS) {
    const v = upstream.headers.get(h);
    if (v) out.set(h, v);
  }
  return new Response(upstream.body, { status: upstream.status, headers: out });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as DELETE };

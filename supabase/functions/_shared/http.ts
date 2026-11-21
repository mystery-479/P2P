const configuredOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

function originAllowed(origin: string): boolean {
  if (!origin) return true;
  if (
    origin === "http://localhost:5173" ||
    origin === "http://127.0.0.1:5173" ||
    configuredOrigins.includes(origin)
  ) return true;
  return /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);
}

export function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": originAllowed(origin) ? (origin || "*") : "null",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

export function jsonResponse(request: Request, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), "Content-Type": "application/json; charset=utf-8" },
  });
}

export function preflight(request: Request): Response | null {
  if (request.method !== "OPTIONS") return null;
  return new Response("ok", { headers: corsHeaders(request) });
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function bearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization");
  return header?.startsWith("Bearer ") ? header.slice(7) : null;
}

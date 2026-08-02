import { createHash } from "node:crypto";

const MAX_IMAGE_BYTES = 1_600_000;
const REQUEST_WINDOW_MS = 10 * 60 * 1000;
const REQUEST_LIMIT = 30;
const ALLOWED_PURPOSES = new Set(["token-logo", "profile-picture"]);
const decisionCache = globalThis.__rwiImageDecisionCache || new Map();
const requestWindows = globalThis.__rwiImageRequestWindows || new Map();
globalThis.__rwiImageDecisionCache = decisionCache;
globalThis.__rwiImageRequestWindows = requestWindows;

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "cache-control": "no-store",
      "content-security-policy": "default-src 'none'",
      "x-content-type-options": "nosniff",
    },
  });
}

function decodeImageDataUrl(value) {
  const match = String(value || "").match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error("IMAGE_REJECTED");
  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new Error("IMAGE_REJECTED");
  return { dataUrl: value, digest: createHash("sha256").update(bytes).digest("hex") };
}

function clientKey(request) {
  return String(
    request.headers.get("x-vercel-forwarded-for")
      || request.headers.get("x-forwarded-for")
      || request.headers.get("x-real-ip")
      || "unknown",
  ).split(",")[0].trim();
}

function enforceRequestLimit(request) {
  const key = clientKey(request);
  const now = Date.now();
  const current = requestWindows.get(key);
  if (!current || now - current.startedAt >= REQUEST_WINDOW_MS) {
    requestWindows.set(key, { startedAt: now, count: 1 });
    return;
  }
  current.count += 1;
  if (current.count > REQUEST_LIMIT) throw new Error("IMAGE_REJECTED");
}

export function imageDecision(result) {
  const first = result?.results?.[0];
  if (!first?.categories || typeof first.categories !== "object") throw new Error("IMAGE_REJECTED");
  return !Boolean(first.categories.sexual || first.categories["sexual/minors"]);
}

export async function assertImageAllowedDataUrl(imageDataUrl, options = {}) {
  const { dataUrl, digest } = decodeImageDataUrl(imageDataUrl);
  if (decisionCache.get(digest) === true) return true;
  if (decisionCache.get(digest) === false) throw new Error("IMAGE_REJECTED");

  const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("IMAGE_REJECTED");
  const fetchImpl = options.fetchImpl || fetch;
  const response = await fetchImpl("https://api.openai.com/v1/moderations", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "omni-moderation-latest",
      input: [{ type: "image_url", image_url: { url: dataUrl } }],
    }),
  });
  if (!response.ok) throw new Error("IMAGE_REJECTED");
  const allowed = imageDecision(await response.json());
  decisionCache.set(digest, allowed);
  if (!allowed) throw new Error("IMAGE_REJECTED");
  return true;
}

export async function POST(request) {
  try {
    enforceRequestLimit(request);
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_IMAGE_BYTES * 1.5) throw new Error("IMAGE_REJECTED");
    const input = await request.json();
    if (!ALLOWED_PURPOSES.has(String(input?.purpose || ""))) throw new Error("IMAGE_REJECTED");
    await assertImageAllowedDataUrl(input.imageDataUrl);
    return json({ allowed: true });
  } catch {
    return json({ allowed: false }, 422);
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
}

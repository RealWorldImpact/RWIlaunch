const ROBINHOOD_CHAIN_ID = "robinhood";
const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const UPSTREAM_TIMEOUT_MS = 8_000;
const MAX_RESPONSE_BYTES = 1_000_000;

function sendJson(response, status, payload) {
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  return response.status(status).json(payload);
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return sendJson(response, 405, { error: "Method not allowed." });
  }

  const requestUrl = new URL(request.url, `https://${request.headers.host || "rwilaunch.vercel.app"}`);
  const tokenAddress = requestUrl.searchParams.get("token") || "";
  if (!ADDRESS_PATTERN.test(tokenAddress)) return sendJson(response, 400, { error: "A valid token address is required." });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const upstreamUrl = `https://api.dexscreener.com/token-pairs/v1/${ROBINHOOD_CHAIN_ID}/${tokenAddress}`;
    const upstream = await fetch(upstreamUrl, {
      headers: { Accept: "application/json", "User-Agent": "RWI-Launchpad/1.0" },
      signal: controller.signal,
    });
    if (!upstream.ok) throw new Error(`Dexscreener returned ${upstream.status}.`);
    const raw = await upstream.text();
    if (raw.length > MAX_RESPONSE_BYTES) throw new Error("Dexscreener response was unexpectedly large.");
    const pairs = JSON.parse(raw);
    if (!Array.isArray(pairs)) throw new Error("Dexscreener returned an invalid response.");
    response.setHeader("Cache-Control", "public, max-age=0, s-maxage=20, stale-while-revalidate=40");
    return sendJson(response, 200, pairs);
  } catch (error) {
    const timedOut = error?.name === "AbortError";
    return sendJson(response, 502, { error: timedOut ? "Dexscreener timed out." : "Live market data is temporarily unavailable." });
  } finally {
    clearTimeout(timeout);
  }
}

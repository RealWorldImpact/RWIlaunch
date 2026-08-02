const crypto = require("node:crypto");

const DATA_STREAMS_HOST = "api.dataengine.chain.link";
const ETH_USD_FEED_ID = "0x000362205e10b3a147d02792eccee483dca6c7b44ecce7012cb8c6e0b68b3ae9";
const MAX_UPSTREAM_REPORT_AGE_SECONDS = 120;
const MAX_REPORT_BYTES = 12_000;

function createAuthHeaders(apiKey, apiSecret, fullPath, timestamp = Date.now()) {
  const bodyHash = crypto.createHash("sha256").update("").digest("hex");
  const stringToSign = `GET ${fullPath} ${bodyHash} ${apiKey} ${timestamp}`;
  const signature = crypto.createHmac("sha256", apiSecret).update(stringToSign).digest("hex");
  return {
    Authorization: apiKey,
    "X-Authorization-Timestamp": String(timestamp),
    "X-Authorization-Signature-SHA256": signature,
  };
}

function setSecurityHeaders(response) {
  response.setHeader("Cache-Control", "no-store, max-age=0");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "no-referrer");
}

function isSameOriginRequest(request) {
  const origin = request.headers.origin;
  const host = request.headers.host;
  if (!origin || !host) return true;
  try {
    return new URL(origin).host.toLowerCase() === String(host).toLowerCase();
  } catch {
    return false;
  }
}

async function handler(request, response) {
  setSecurityHeaders(response);
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed." });
  }
  if (!isSameOriginRequest(request)) return response.status(403).json({ error: "Cross-origin request rejected." });

  const apiKey = process.env.STREAMS_API_KEY;
  const apiSecret = process.env.STREAMS_API_SECRET;
  if (!apiKey || !apiSecret) {
    return response.status(503).json({ error: "The launch oracle service is not configured." });
  }

  const fullPath = `/api/v1/reports/latest?feedID=${ETH_USD_FEED_ID}`;
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 5_000);
  try {
    const upstream = await fetch(`https://${DATA_STREAMS_HOST}${fullPath}`, {
      method: "GET",
      headers: createAuthHeaders(apiKey, apiSecret, fullPath),
      signal: abortController.signal,
    });
    if (!upstream.ok) return response.status(502).json({ error: "A fresh oracle report is temporarily unavailable." });

    const payload = await upstream.json();
    const report = payload?.report;
    const validFromTimestamp = Number(report?.validFromTimestamp);
    const observationTimestamp = Number(report?.observationsTimestamp);
    const now = Math.floor(Date.now() / 1000);
    if (
      String(report?.feedID || "").toLowerCase() !== ETH_USD_FEED_ID
      || !/^0x[0-9a-fA-F]+$/.test(report?.fullReport || "")
      || report.fullReport.length <= 2
      || (report.fullReport.length - 2) % 2 !== 0
      || (report.fullReport.length - 2) / 2 > MAX_REPORT_BYTES
      || !Number.isInteger(validFromTimestamp)
      || !Number.isInteger(observationTimestamp)
      || validFromTimestamp > observationTimestamp
      || observationTimestamp > now + 10
      || now - observationTimestamp > MAX_UPSTREAM_REPORT_AGE_SECONDS
    ) {
      return response.status(502).json({ error: "The oracle returned an invalid or stale report." });
    }

    return response.status(200).json({
      feedID: ETH_USD_FEED_ID,
      validFromTimestamp,
      observationsTimestamp: observationTimestamp,
      fullReport: report.fullReport,
    });
  } catch {
    return response.status(502).json({ error: "A fresh oracle report is temporarily unavailable." });
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = handler;
module.exports.createAuthHeaders = createAuthHeaders;
module.exports.ETH_USD_FEED_ID = ETH_USD_FEED_ID;

import { createHash } from "node:crypto";
import { list, put } from "@vercel/blob";
import {
  Contract,
  Interface,
  JsonRpcProvider,
  getAddress,
  isAddress,
  keccak256,
  toUtf8Bytes,
  verifyMessage,
} from "ethers";
import { assertImageAllowedDataUrl } from "./image-safety.mjs";

const CHAIN_ID = 4663;
const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const FACTORY_ADDRESS = "0xEd71c58CDA0e2CCF9f22e63931f1B943D951A088";
const QUOTE_FACTORY_ADDRESS = "0x53b85f2166bF6C59c55261D3c298a3c1feD06088";
const PONS_FACTORY_ADDRESSES = [
  process.env.RWI_PONS_FACTORY_ADDRESS || "",
  ...(process.env.RWI_LEGACY_PONS_FACTORY_ADDRESSES || "").split(","),
].map((address) => address.trim()).filter((address) => isAddress(address));
const LEGACY_FACTORY_ADDRESSES = [
  "0x0Fb46f019eBf66D0767E891f8fACe687F1156088",
  "0xB725d44EA09BA4c1C8650D79aDB84C06d3CbE000",
  "0x1CD4ba989b530E0c5bf13cB780346A2d2BAaE000",
  process.env.RWI_FACTORY_ADDRESS || "",
  ...(process.env.RWI_LEGACY_FACTORY_ADDRESSES || "").split(","),
].map((address) => address.trim()).filter((address) => isAddress(address));
const LEGACY_QUOTE_FACTORY_ADDRESSES = [
  "0x424Ee23D5873F6Cc38247B79795893Bc9Bfce088",
  "0x60C288E299F6C73A0a4Fe8E037138226cC42E088",
  process.env.RWI_QUOTE_FACTORY_ADDRESS || "",
  ...(process.env.RWI_LEGACY_QUOTE_FACTORY_ADDRESSES || "").split(","),
].map((address) => address.trim()).filter((address) => isAddress(address));
const MAX_REQUEST_BYTES = 2_500_000;
const MAX_LOGO_BYTES = 1_500_000;
const METADATA_PREFIX = "rwi-launchpad/metadata/";
const LOGO_PREFIX = "rwi-launchpad/logos/";
const TOKEN_LIST_PATH = "rwi-launchpad/rwi-launchpad.tokenlist.json";
const FACTORY_ABI = [
  "function launches(address token) view returns (address creator,bytes32 poolId,uint256 positionTokenId,uint128 liquidity,bool liquidityPermanentlyLocked,uint256 tokenAmount,uint256 initialRwiAmount,int24 tickLower,int24 tickUpper)",
];
const LAUNCH_INTERFACE = new Interface([
  "function launch((string name,string symbol,uint256 devBuyRwiAmount,uint256 minimumDevBuyTokenOut) params) returns (address token,bytes32 poolId,uint256 positionTokenId,uint256 devBuyTokenAmount)",
  "event TokenLaunched(address indexed token,address indexed creator,bytes32 indexed poolId,uint256 positionTokenId,uint128 liquidity,uint256 tokenAmount,uint256 initialRwiAmount,bool liquidityPermanentlyLocked)",
]);
const QUOTE_LAUNCH_INTERFACE = new Interface([
  "function launch((string name,string symbol,uint8 quoteAsset,uint256 devBuyQuoteAmount,uint256 minimumDevBuyTokenOut) params) payable returns (address token,bytes32 poolId,uint256 positionTokenId,uint256 devBuyTokenAmount)",
  "event TokenLaunched(address indexed token,address indexed creator,bytes32 indexed poolId,uint256 positionTokenId,uint128 liquidity,uint256 tokenAmount,uint256 initialQuoteAmount,bool liquidityPermanentlyLocked)",
]);
const CORS_HEADERS = Object.freeze({
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type",
  "x-content-type-options": "nosniff",
});

function json(data, status = 200, cacheControl = "no-store") {
  return Response.json(data, {
    status,
    headers: { ...CORS_HEADERS, "cache-control": cacheControl },
  });
}

function cleanText(value, maximum, required = false) {
  const result = String(value || "").trim();
  if ((required && !result) || result.length > maximum) throw new Error("Invalid token metadata text.");
  return result;
}

function cleanAddress(value, label) {
  if (!isAddress(value)) throw new Error(`Invalid ${label} address.`);
  return getAddress(value);
}

function cleanPoolId(value) {
  const result = String(value || "").toLowerCase();
  if (!/^0x[0-9a-f]{64}$/.test(result) || /^0x0{64}$/.test(result)) throw new Error("Invalid Uniswap v4 pool ID.");
  return result;
}

function cleanUrl(kind, value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.length > 300) throw new Error("A project link is too long.");
  let candidate = raw;
  if (!/^https?:\/\//i.test(candidate)) {
    if (kind === "twitter" && /^(x\.com|twitter\.com)\//i.test(candidate)) candidate = `https://${candidate}`;
    else if (kind === "twitter") candidate = `https://x.com/${candidate.replace(/^@/, "")}`;
    else if (kind === "telegram") candidate = `https://${candidate.replace(/^@/, "t.me/")}`;
    else candidate = `https://${candidate}`;
  }
  const url = new URL(candidate);
  if (!/^https?:$/.test(url.protocol)) throw new Error("Only public HTTP or HTTPS project links are supported.");
  return url.href;
}

function canonicalLinks(links = {}) {
  return {
    website: cleanUrl("website", links.website),
    twitter: cleanUrl("twitter", links.twitter),
    telegram: cleanUrl("telegram", links.telegram),
  };
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalPayload(input) {
  const factoryAddress = cleanAddress(input.factoryAddress || FACTORY_ADDRESS, "factory");
  const allowedFactories = [FACTORY_ADDRESS, QUOTE_FACTORY_ADDRESS, ...PONS_FACTORY_ADDRESSES, ...LEGACY_FACTORY_ADDRESSES, ...LEGACY_QUOTE_FACTORY_ADDRESSES]
    .filter((address) => isAddress(address)).map((address) => getAddress(address).toLowerCase());
  if (!allowedFactories.includes(factoryAddress.toLowerCase())) throw new Error("This launch factory is not approved for public metadata.");
  return {
    factoryAddress,
    tokenAddress: cleanAddress(input.tokenAddress, "token"),
    creator: cleanAddress(input.creator, "creator"),
    poolId: cleanPoolId(input.poolId),
    name: cleanText(input.name, 60, true),
    symbol: cleanText(input.symbol, 20, true).toUpperCase(),
    description: cleanText(input.description, 500),
    links: canonicalLinks(input.links),
    logoSha256: String(input.logoSha256 || "").toLowerCase(),
  };
}

function payloadFactoryAddress(payload) {
  return getAddress(payload.factoryAddress || FACTORY_ADDRESS);
}

export function metadataSigningMessage(payload) {
  return [
    "RWI Launchpad public token metadata",
    `Chain ID: ${CHAIN_ID}`,
    `Factory: ${String(payload.factoryAddress || FACTORY_ADDRESS).toLowerCase()}`,
    `Token: ${payload.tokenAddress.toLowerCase()}`,
    `Creator: ${payload.creator.toLowerCase()}`,
    `Pool ID: ${payload.poolId.toLowerCase()}`,
    `Name: ${payload.name}`,
    `Symbol: ${payload.symbol}`,
    `Description SHA-256: ${sha256(Buffer.from(payload.description, "utf8"))}`,
    `Logo SHA-256: ${payload.logoSha256}`,
    `Links SHA-256: ${sha256(Buffer.from(JSON.stringify(payload.links), "utf8"))}`,
    "Purpose: publish this token's public logo and metadata",
  ].join("\n");
}

export function launchMetadataAuthorizationMessage(payload) {
  const creator = cleanAddress(payload.creator, "creator");
  const name = cleanText(payload.name, 60, true);
  const symbol = cleanText(payload.symbol, 20, true).toUpperCase();
  const description = cleanText(payload.description, 500);
  const links = canonicalLinks(payload.links);
  const logoSha256 = String(payload.logoSha256 || "").toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(logoSha256)) throw new Error("The public logo integrity check failed.");
  return [
    "RWI Launchpad launch metadata authorization",
    "Version: 1",
    `Chain ID: ${CHAIN_ID}`,
    `Factory: ${String(payload.factoryAddress || FACTORY_ADDRESS).toLowerCase()}`,
    `Creator: ${creator.toLowerCase()}`,
    `Name: ${name}`,
    `Symbol: ${symbol}`,
    `Description SHA-256: ${sha256(Buffer.from(description, "utf8"))}`,
    `Logo SHA-256: ${logoSha256}`,
    `Links SHA-256: ${sha256(Buffer.from(JSON.stringify(links), "utf8"))}`,
    "Purpose: bind this public logo and metadata to the signed launch transaction",
  ].join("\n");
}

export function launchMetadataCommitment(payload) {
  return keccak256(toUtf8Bytes(launchMetadataAuthorizationMessage(payload)));
}

function decodeLogo(dataUrl, expectedHash) {
  const match = String(dataUrl || "").match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error("The uploaded logo must be a PNG.");
  const bytes = Buffer.from(match[1], "base64");
  if (!bytes.length || bytes.length > MAX_LOGO_BYTES) throw new Error("The uploaded logo is too large.");
  const signature = bytes.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a" || bytes.length < 24) throw new Error("The uploaded logo is not a valid PNG.");
  if (bytes.readUInt32BE(16) !== 512 || bytes.readUInt32BE(20) !== 512) throw new Error("The public logo must be exactly 512 by 512 pixels.");
  const digest = sha256(bytes);
  if (!/^[0-9a-f]{64}$/.test(expectedHash) || digest !== expectedHash) throw new Error("The public logo integrity check failed.");
  return bytes;
}

function blobAuthMode() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "read-write-token";
  if (process.env.BLOB_STORE_ID) return "oidc";
  return "none";
}

function blobConfigured() {
  return blobAuthMode() !== "none";
}

async function findBlob(pathname) {
  const result = await list({ prefix: pathname, limit: 10 });
  return result.blobs.find((blob) => blob.pathname === pathname) || null;
}

async function fetchBlobJson(blob) {
  if (!blob?.url) return null;
  const response = await fetch(`${blob.url}${blob.url.includes("?") ? "&" : "?"}v=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) return null;
  return response.json();
}

async function allTokenMetadata() {
  const records = [];
  let cursor;
  do {
    const page = await list({ prefix: METADATA_PREFIX, limit: 1000, cursor });
    records.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor && records.length < 10_000);
  const metadata = await Promise.all(records.map((blob) => fetchBlobJson(blob).catch(() => null)));
  return metadata.filter((entry) => entry?.tokenAddress && entry?.image);
}

async function writeTokenList() {
  const metadata = await allTokenMetadata();
  const tokens = metadata
    .map((entry) => ({
      chainId: CHAIN_ID,
      address: getAddress(entry.tokenAddress),
      decimals: 18,
      name: String(entry.name || "").slice(0, 60),
      symbol: String(entry.symbol || "").slice(0, 20),
      logoURI: entry.image,
      extensions: { launchpad: "RWI" },
    }))
    .sort((left, right) => left.address.localeCompare(right.address));
  if (!tokens.length) return null;
  const tokenList = {
    name: "RWI Launchpad",
    timestamp: new Date().toISOString(),
    version: { major: 1, minor: tokens.length, patch: Math.floor(Date.now() / 1000) },
    keywords: ["RWI", "Robinhood", "launchpad"],
    tokens,
  };
  return put(TOKEN_LIST_PATH, JSON.stringify(tokenList, null, 2), {
    access: "public",
    contentType: "application/json",
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
}

async function verifyLaunch(payload, provider = new JsonRpcProvider(RPC_URL, CHAIN_ID, { staticNetwork: true })) {
  const factory = new Contract(payloadFactoryAddress(payload), FACTORY_ABI, provider);
  const token = new Contract(payload.tokenAddress, [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
  ], provider);
  const [launch, onchainName, onchainSymbol] = await Promise.all([
    factory.launches(payload.tokenAddress),
    token.name(),
    token.symbol(),
  ]);
  if (launch.creator.toLowerCase() !== payload.creator.toLowerCase()) throw new Error("The signing wallet is not this token's onchain creator.");
  if (String(launch.poolId).toLowerCase() !== payload.poolId) throw new Error("The submitted Uniswap pool does not match the factory record.");
  if (!launch.liquidityPermanentlyLocked || BigInt(launch.liquidity) === 0n) throw new Error("The factory launch is not active and permanently locked.");
  if (onchainName !== payload.name || onchainSymbol !== payload.symbol) throw new Error("The submitted name or symbol does not match the token contract.");
}

export async function verifyLaunchTransactionAuthorization(payload, transactionHash, provider) {
  const hash = String(transactionHash || "").toLowerCase();
  if (!/^0x[0-9a-f]{64}$/.test(hash)) throw new Error("Invalid launch transaction authorization.");
  const [transaction, receipt] = await Promise.all([
    provider.getTransaction(hash),
    provider.getTransactionReceipt(hash),
  ]);
  if (!transaction || !receipt || Number(receipt.status) !== 1) throw new Error("The authorized launch transaction is not confirmed.");
  const factoryAddress = payloadFactoryAddress(payload);
  if (!transaction.to || getAddress(transaction.to) !== factoryAddress) throw new Error("The authorization transaction did not call the approved factory.");
  if (getAddress(transaction.from) !== payload.creator) throw new Error("The launch transaction was not signed by this token's creator.");

  const calldata = String(transaction.data || "").toLowerCase();
  const launchInterfaces = [LAUNCH_INTERFACE, QUOTE_LAUNCH_INTERFACE];
  const launchSelectors = launchInterfaces.map((entry) => entry.getFunction("launch").selector.toLowerCase());
  const expectedCommitment = launchMetadataCommitment(payload).slice(2).toLowerCase();
  if (!launchSelectors.some((selector) => calldata.startsWith(selector)) || calldata.length < 72 || !calldata.endsWith(expectedCommitment)) {
    throw new Error("The launch transaction does not authorize this public logo and metadata.");
  }

  let launchedEvent = null;
  for (const log of receipt.logs || []) {
    if (!log?.address || getAddress(log.address) !== factoryAddress) continue;
    for (const launchInterface of launchInterfaces) {
      try {
        const parsed = launchInterface.parseLog(log);
        if (parsed?.name === "TokenLaunched") {
          launchedEvent = parsed;
          break;
        }
      } catch {
        // Non-launch factory logs are ignored.
      }
    }
    if (launchedEvent) break;
  }
  if (!launchedEvent
    || getAddress(launchedEvent.args.token) !== payload.tokenAddress
    || getAddress(launchedEvent.args.creator) !== payload.creator
    || String(launchedEvent.args.poolId).toLowerCase() !== payload.poolId) {
    throw new Error("The authorization transaction does not contain this token launch.");
  }
  return true;
}

async function verifyCreatorAuthorization(payload, input, provider) {
  if (input.launchTxHash) {
    await verifyLaunchTransactionAuthorization(payload, input.launchTxHash, provider);
    return "launch-transaction";
  }
  const signature = String(input.signature || "");
  const recovered = verifyMessage(metadataSigningMessage(payload), signature);
  if (recovered.toLowerCase() !== payload.creator.toLowerCase()) throw new Error("The public metadata signature is invalid.");
  return "message-signature";
}

async function publish(request) {
  if (!blobConfigured()) return json({ error: "Public logo storage is not configured.", code: "storage_not_configured" }, 503);
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_REQUEST_BYTES) return json({ error: "The logo upload is too large." }, 413);
  let input;
  try {
    input = await request.json();
  } catch {
    return json({ error: "Invalid metadata request." }, 400);
  }
  try {
    const payload = canonicalPayload(input);
    const logo = decodeLogo(input.imageDataUrl, payload.logoSha256);
    const provider = new JsonRpcProvider(RPC_URL, CHAIN_ID, { staticNetwork: true });
    const authorizationMode = await verifyCreatorAuthorization(payload, input, provider);
    await verifyLaunch(payload, provider);
    await assertImageAllowedDataUrl(input.imageDataUrl);

    const tokenKey = payload.tokenAddress.toLowerCase();
    const logoBlob = await put(`${LOGO_PREFIX}${tokenKey}.png`, logo, {
      access: "public",
      contentType: "image/png",
      allowOverwrite: true,
      cacheControlMaxAge: 31_536_000,
    });
    const imageUrl = `${logoBlob.url}?v=${payload.logoSha256.slice(0, 16)}`;
    const metadata = {
      schemaVersion: 2,
      chainId: CHAIN_ID,
      factoryAddress: payloadFactoryAddress(payload),
      tokenAddress: payload.tokenAddress,
      creator: payload.creator,
      poolId: payload.poolId,
      protocol: "Uniswap v4",
      name: payload.name,
      symbol: payload.symbol,
      description: payload.description,
      image: imageUrl,
      logoURI: imageUrl,
      links: payload.links,
      logo: { mimeType: "image/png", width: 512, height: 512, bytes: logo.length, sha256: payload.logoSha256 },
      verifiedByCreatorSignature: true,
      publishedAt: new Date().toISOString(),
    };
    const metadataBlob = await put(`${METADATA_PREFIX}${tokenKey}.json`, JSON.stringify(metadata, null, 2), {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true,
      cacheControlMaxAge: 60,
    });
    const tokenListBlob = await writeTokenList();
    return json({
      ok: true,
      tokenAddress: payload.tokenAddress,
      logoUrl: imageUrl,
      metadataUrl: `${metadataBlob.url}?v=${payload.logoSha256.slice(0, 16)}`,
      tokenListUrl: tokenListBlob?.url || null,
      authorizationMode,
    }, 201);
  } catch (error) {
    const message = error?.message === "IMAGE_REJECTED"
      ? "This image can't be used."
      : String(error?.shortMessage || error?.message || "Public metadata publication failed.").slice(0, 300);
    return json({ error: message }, 400);
  }
}

export async function tokenListResponse() {
  if (!blobConfigured()) return json({ error: "Public logo storage is not configured.", code: "storage_not_configured" }, 503);
  try {
    const blob = await findBlob(TOKEN_LIST_PATH);
    const tokenList = await fetchBlobJson(blob);
    if (!tokenList) return json({ error: "No public launchpad tokens have been published yet." }, 404);
    return json(tokenList, 200, "public, max-age=60, s-maxage=300, stale-while-revalidate=3600");
  } catch (error) {
    return json({ error: String(error?.message || "Token list is unavailable.").slice(0, 300) }, 500);
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (url.searchParams.get("all") === "1") {
    if (!blobConfigured()) return json({ error: "Public logo storage is not configured.", code: "storage_not_configured" }, 503);
    try {
      const tokens = await allTokenMetadata();
      return json({ tokens }, 200, "public, max-age=60, s-maxage=300, stale-while-revalidate=3600");
    } catch (error) {
      return json({ error: String(error?.message || "Public metadata directory failed.").slice(0, 300) }, 500);
    }
  }
  if (!token) {
    return json({
      configured: blobConfigured(),
      authentication: blobAuthMode(),
      chainId: CHAIN_ID,
      factoryAddress: FACTORY_ADDRESS,
      quoteFactoryAddress: QUOTE_FACTORY_ADDRESS,
      ponsFactoryAddresses: PONS_FACTORY_ADDRESSES,
      legacyFactoryAddresses: LEGACY_FACTORY_ADDRESSES,
      legacyQuoteFactoryAddresses: LEGACY_QUOTE_FACTORY_ADDRESSES,
      tokenListPath: "/api/token-list",
      purpose: "creator-authenticated public RWI token metadata",
    });
  }
  if (!blobConfigured()) return json({ error: "Public logo storage is not configured.", code: "storage_not_configured" }, 503);
  try {
    const address = cleanAddress(token, "token").toLowerCase();
    const blob = await findBlob(`${METADATA_PREFIX}${address}.json`);
    const metadata = await fetchBlobJson(blob);
    if (!metadata) return json({ error: "No public metadata has been published for this token." }, 404);
    return json(metadata, 200, "public, max-age=60, s-maxage=300, stale-while-revalidate=3600");
  } catch (error) {
    return json({ error: String(error?.message || "Public metadata lookup failed.").slice(0, 300) }, 400);
  }
}

export async function POST(request) {
  return publish(request);
}

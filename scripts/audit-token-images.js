const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const requiredPairAssets = [
  "assets/rwi-logo.jpg",
  "assets/eth-logo.png",
  "assets/usdg-logo.png",
  "assets/pons-logo.png",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function pngDimensions(buffer) {
  assert(buffer.length >= 24 && buffer.subarray(0, 8).toString("hex") === "89504e470d0a1a0a", "Invalid PNG signature");
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function validateLocalAssets() {
  for (const relativePath of requiredPairAssets) {
    const absolutePath = path.join(root, relativePath);
    assert(fs.existsSync(absolutePath), `Missing pair logo: ${relativePath}`);
    const buffer = fs.readFileSync(absolutePath);
    assert(buffer.length > 1_000, `Pair logo is unexpectedly small: ${relativePath}`);
    if (relativePath.endsWith(".png")) {
      const dimensions = pngDimensions(buffer);
      assert(dimensions.width > 0 && dimensions.height > 0, `Invalid pair logo dimensions: ${relativePath}`);
    } else {
      assert(buffer.subarray(0, 3).toString("hex") === "ffd8ff", `Invalid JPEG signature: ${relativePath}`);
    }
  }

  const referencedFiles = ["index.html", "styles.css", "pair-selector-v2.css", "app-quote-live.js"];
  const references = referencedFiles.flatMap((file) => {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    return [...source.matchAll(/["'(](assets\/[a-z0-9._/-]+\.(?:png|jpg|jpeg|webp|svg))/gi)].map((match) => match[1]);
  });
  for (const reference of new Set(references)) {
    assert(fs.existsSync(path.join(root, reference)), `Referenced image does not exist: ${reference}`);
  }
}

async function validatePublicMetadata() {
  const response = await fetch("https://rwilaunch.vercel.app/api/token-metadata?all=1", { headers: { accept: "application/json" } });
  assert(response.ok, `Public metadata directory returned HTTP ${response.status}`);
  const payload = await response.json();
  const tokens = Array.isArray(payload.tokens) ? payload.tokens : [];
  assert(tokens.length > 0, "Public metadata directory is empty");
  const addresses = new Set();
  for (const token of tokens) {
    const address = String(token.tokenAddress || "").toLowerCase();
    assert(/^0x[0-9a-f]{40}$/.test(address), "Public metadata contains an invalid token address");
    assert(!addresses.has(address), `Duplicate public metadata: ${address}`);
    addresses.add(address);
    assert(/^https:\/\//i.test(String(token.image || "")), `Missing public logo URL: ${address}`);
    const imageResponse = await fetch(token.image, { headers: { accept: "image/*" } });
    assert(imageResponse.ok, `Public logo returned HTTP ${imageResponse.status}: ${address}`);
    assert(String(imageResponse.headers.get("content-type") || "").startsWith("image/png"), `Public logo is not PNG: ${address}`);
    const image = Buffer.from(await imageResponse.arrayBuffer());
    const dimensions = pngDimensions(image);
    assert(dimensions.width === 512 && dimensions.height === 512, `Public logo is not 512x512: ${address}`);
  }

  const tokenListResponse = await fetch("https://rwilaunch.vercel.app/api/token-list", { headers: { accept: "application/json" } });
  assert(tokenListResponse.ok, `Public token list returned HTTP ${tokenListResponse.status}`);
  const tokenList = await tokenListResponse.json();
  const listed = new Map((tokenList.tokens || []).map((token) => [String(token.address).toLowerCase(), token.logoURI]));
  for (const address of addresses) assert(/^https:\/\//i.test(String(listed.get(address) || "")), `Token list is missing a logo: ${address}`);
  return tokens.length;
}

async function main() {
  validateLocalAssets();
  const publicLogoCount = process.argv.includes("--local-only") ? null : await validatePublicMetadata();
  console.log(`Token image audit passed: 4 pair assets${publicLogoCount === null ? "" : ` and ${publicLogoCount} public 512x512 logos`}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

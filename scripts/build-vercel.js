const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const outputRoot = path.join(projectRoot, "vercel-site");
const publicFiles = [
  "index.html",
  "token.html",
  "creator.html",
  "styles.css",
  "pair-selector-v2.css",
  "app.js",
  "app-quote-live.js",
  "token.js",
  "creator.js",
  "factory-config.js",
  "factory-abi.js",
  "factory-deployment.js",
  "quote-factory-config.js",
  "quote-factory-live-config.js",
  "quote-factory-abi.js",
  "quote-factory-deployment.js",
  "profile-registry-config.js",
  "profile-registry-abi.js",
  "profile-registry-deployment.js",
  "rwi-launchpad-manifest.json",
  "geckoterminal-integration.json",
  "assets/eth-logo.svg",
  "assets/usdg-logo.svg",
  "assets/testcoin.png",
  "tokens/0xc29d66d54d2ed13fffdc89323e5a9d70c197eaec.json",
  "api/token-metadata.mjs",
  "api/image-safety.mjs",
  "api/token-list.mjs",
  "api/dexscreener-market.mjs",
  "vendor/ethers.umd.min.js",
  "vercel.json",
];

const renamedPublicFiles = [
  { source: "vercel-package.json", destination: "package.json" },
];

for (const relativePath of publicFiles) {
  const source = path.join(projectRoot, relativePath);
  const destination = path.join(outputRoot, relativePath);
  if (!fs.existsSync(source)) throw new Error(`Missing required public file: ${relativePath}`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

for (const entry of renamedPublicFiles) {
  const source = path.join(projectRoot, entry.source);
  const destination = path.join(outputRoot, entry.destination);
  if (!fs.existsSync(source)) throw new Error(`Missing required public file: ${entry.source}`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

const deployedFiles = [];
function collectFiles(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) collectFiles(absolute);
    if (entry.isFile()) deployedFiles.push(path.relative(outputRoot, absolute).replaceAll("\\", "/"));
  }
}
collectFiles(outputRoot);

const expectedFiles = [...publicFiles, ...renamedPublicFiles.map((entry) => entry.destination)];
const unexpectedFiles = deployedFiles.filter((file) => !expectedFiles.includes(file));
if (unexpectedFiles.length) throw new Error(`Unexpected files already exist in vercel-site: ${unexpectedFiles.join(", ")}`);

const totalBytes = deployedFiles.reduce((sum, file) => sum + fs.statSync(path.join(outputRoot, file)).size, 0);
console.log(`Built Vercel site with ${deployedFiles.length} files (${(totalBytes / 1024).toFixed(1)} KiB).`);

const fs = require("fs");
const path = require("path");
const solc = require("solc");
const { AbiCoder, getAddress } = require("ethers");

const projectRoot = path.resolve(__dirname, "..");
const factoryTarget = {
  addressVariable: "ROBINHOOD_FACTORY_ADDRESS",
  contractName: "RobinhoodRWIV4LaunchHook",
  sourceName: "contracts/RobinhoodRWIV4LaunchHook.sol",
  artifactPath: "../artifacts/contracts/RobinhoodRWIV4LaunchHook.sol/RobinhoodRWIV4LaunchHook.json",
};
const quoteFactoryTarget = {
  addressVariable: "ROBINHOOD_QUOTE_FACTORY_ADDRESS",
  contractName: "RobinhoodEthUsdgV4LaunchHook",
  sourceName: "contracts/RobinhoodEthUsdgV4LaunchHook.sol",
  artifactPath: "../artifacts/contracts/RobinhoodEthUsdgV4LaunchHook.sol/RobinhoodEthUsdgV4LaunchHook.json",
};
const ponsFactoryTarget = {
  addressVariable: "ROBINHOOD_PONS_FACTORY_ADDRESS",
  contractName: "RobinhoodPonsV4LaunchHook",
  sourceName: "contracts/RobinhoodPonsV4LaunchHook.sol",
  artifactPath: "../artifacts/contracts/RobinhoodPonsV4LaunchHook.sol/RobinhoodPonsV4LaunchHook.json",
};
const multiPairFactoryTarget = {
  addressVariable: "ROBINHOOD_MULTI_PAIR_FACTORY_ADDRESS",
  contractName: "RobinhoodMultiPairV4LaunchHook",
  sourceName: "contracts/RobinhoodMultiPairV4LaunchHook.sol",
  artifactPath: "../artifacts/contracts/RobinhoodMultiPairV4LaunchHook.sol/RobinhoodMultiPairV4LaunchHook.json",
};
const tokenTarget = {
  addressVariable: "ROBINHOOD_TOKEN_ADDRESS",
  contractName: "RWILaunchToken",
  sourceName: "contracts/RWILaunchToken.sol",
  artifactPath: "../artifacts/contracts/RWILaunchToken.sol/RWILaunchToken.json",
};
const profileRegistryTarget = {
  addressVariable: "ROBINHOOD_PROFILE_REGISTRY_ADDRESS",
  contractName: "RWICreatorProfileRegistry",
  sourceName: "contracts/RWICreatorProfileRegistry.sol",
  artifactPath: "../artifacts/contracts/RWICreatorProfileRegistry.sol/RWICreatorProfileRegistry.json",
};

function collectProjectSources(directory, prefix = "contracts") {
  const sources = {};
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    const sourceName = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) Object.assign(sources, collectProjectSources(absolute, sourceName));
    if (entry.isFile() && entry.name.endsWith(".sol")) sources[sourceName] = { content: fs.readFileSync(absolute, "utf8") };
  }
  return sources;
}

function readSource(sourceName) {
  const candidates = [path.join(projectRoot, sourceName), path.join(projectRoot, "node_modules", sourceName)];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return fs.readFileSync(candidate, "utf8");
  }
  throw new Error(`Cannot resolve verification source ${sourceName}`);
}

function collectVerificationSources(target) {
  const sources = { [target.sourceName]: { content: readSource(target.sourceName) } };
  const queue = Object.keys(sources);
  for (let index = 0; index < queue.length; index += 1) {
    const sourceName = queue[index];
    const importPattern = /import\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']\s*;/g;
    for (const match of sources[sourceName].content.matchAll(importPattern)) {
      const imported = match[1];
      const resolvedName = imported.startsWith(".")
        ? path.posix.normalize(path.posix.join(path.posix.dirname(sourceName), imported))
        : imported;
      if (sources[resolvedName]) continue;
      sources[resolvedName] = { content: readSource(resolvedName) };
      queue.push(resolvedName);
    }
  }
  return sources;
}

async function main() {
  const target = process.env.ROBINHOOD_MULTI_PAIR_FACTORY_ADDRESS
    ? multiPairFactoryTarget
    : process.env.ROBINHOOD_PONS_FACTORY_ADDRESS
      ? ponsFactoryTarget
    : process.env.ROBINHOOD_QUOTE_FACTORY_ADDRESS
      ? quoteFactoryTarget
    : process.env.ROBINHOOD_TOKEN_ADDRESS
      ? tokenTarget
      : process.env.ROBINHOOD_PROFILE_REGISTRY_ADDRESS
        ? profileRegistryTarget
        : factoryTarget;
  const address = process.env[target.addressVariable];
  if (!/^0x[0-9a-fA-F]{40}$/.test(address || "")) throw new Error(`Set ${target.addressVariable} before verification.`);

  const input = {
    language: "Solidity",
    sources: collectVerificationSources(target),
    settings: {
      optimizer: { enabled: true, runs: 1 },
      viaIR: true,
      evmVersion: "shanghai",
      outputSelection: { "*": { "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object", "evm.deployedBytecode.immutableReferences"] } },
    },
  };

  const compilation = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = (compilation.errors || []).filter((entry) => entry.severity === "error");
  if (errors.length) throw new Error(`Verification input does not compile: ${errors[0].formattedMessage}`);
  const compiledBytecode = `0x${compilation.contracts[target.sourceName][target.contractName].evm.bytecode.object}`;
  const reviewedArtifact = require(target.artifactPath);
  if (compiledBytecode !== reviewedArtifact.bytecode) throw new Error("Verification input does not reproduce the reviewed creation bytecode.");

  const baseUrl = "https://robinhoodchain.blockscout.com";
  const contractResponse = await fetch(`${baseUrl}/api/v2/smart-contracts/${address}`, {
    headers: { accept: "application/json", "user-agent": "RWI-Launchpad-Verifier/1.0" },
  });
  if (!contractResponse.ok) throw new Error(`Blockscout could not read the target contract (HTTP ${contractResponse.status}).`);
  const contractRecord = await contractResponse.json();
  const creationBytecode = String(contractRecord.creation_bytecode || "");
  if (!creationBytecode.toLowerCase().startsWith(compiledBytecode.toLowerCase())) {
    throw new Error("The target creation bytecode does not match the reviewed build. Verification was not submitted.");
  }

  if (target === tokenTarget) {
    const constructorData = `0x${creationBytecode.slice(compiledBytecode.length)}`;
    const [name, symbol, receiver] = AbiCoder.defaultAbiCoder().decode(["string", "string", "address"], constructorData);
    const expectedReceiver = process.env.ROBINHOOD_FACTORY_ADDRESS;
    if (expectedReceiver && getAddress(receiver) !== getAddress(expectedReceiver)) {
      throw new Error(`Token receiver ${receiver} does not match the reviewed factory ${expectedReceiver}. Verification was not submitted.`);
    }
    console.log(`Validated token constructor: ${name} (${symbol}), receiver ${receiver}.`);
  }
  if (process.env.VERIFY_DRY_RUN === "1") {
    console.log(`Dry run complete for ${target.contractName} at ${address}. No verification request submitted.`);
    return;
  }

  const form = new FormData();
  form.append("compiler_version", `v${solc.version().replace(/\.Emscripten.*$/, "")}`);
  form.append("contract_name", target.contractName);
  form.append("files[0]", new Blob([JSON.stringify(input)], { type: "application/json" }), "standard-input.json");
  form.append("autodetect_constructor_args", target === tokenTarget ? "true" : "false");
  if (target !== tokenTarget) form.append("constructor_args", "");
  form.append("license_type", "mit");

  const response = await fetch(`${baseUrl}/api/v2/smart-contracts/${address}/verification/via/standard-input`, {
    method: "POST",
    headers: { accept: "application/json", "user-agent": "RWI-Launchpad-Verifier/1.0" },
    body: form,
  });
  const body = await response.text();
  if (!response.ok) {
    const compilerVersion = `v${solc.version().replace(/\.Emscripten.*$/, "")}`;
    const legacyRequest = new URLSearchParams({
      module: "contract",
      action: "verifysourcecode",
      codeformat: "solidity-standard-json-input",
      contractaddress: address,
      contractname: `${target.sourceName}:${target.contractName}`,
      compilerversion: compilerVersion,
      sourceCode: JSON.stringify(input),
      constructorArguments: "",
      autodetectConstructorArguments: target === tokenTarget ? "true" : "false",
      licenseType: "3",
    });
    const legacyResponse = await fetch(`${baseUrl}/api`, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/x-www-form-urlencoded", "user-agent": "RWI-Launchpad-Verifier/1.0" },
      body: legacyRequest,
    });
    const legacyBody = await legacyResponse.json();
    if (!legacyResponse.ok || legacyBody.status !== "1") {
      throw new Error(`Blockscout verification failed on both APIs. v2 HTTP ${response.status}: ${body.slice(0, 500) || "<empty>"}; legacy response: ${JSON.stringify(legacyBody).slice(0, 500)}`);
    }
    const guid = legacyBody.result;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      const statusResponse = await fetch(`${baseUrl}/api?module=contract&action=checkverifystatus&guid=${encodeURIComponent(guid)}`, {
        headers: { accept: "application/json", "user-agent": "RWI-Launchpad-Verifier/1.0" },
      });
      if (!statusResponse.ok) continue;
      const status = await statusResponse.json();
      if (status.status === "1") break;
      if (!/pending|queue/i.test(String(status.result))) throw new Error(`Blockscout verification rejected the build: ${status.result}`);
    }
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const check = await fetch(`${baseUrl}/api/v2/smart-contracts/${address}`, {
      headers: { accept: "application/json", "user-agent": "RWI-Launchpad-Verifier/1.0" },
    });
    if (!check.ok) continue;
    const result = await check.json();
    if (result.source_code && result.name === target.contractName) {
      console.log(`Verified ${target.contractName} at ${address} with ${Object.keys(input.sources).length} source files.`);
      return;
    }
  }
  throw new Error(`Blockscout accepted the verification request but has not confirmed it yet. Response: ${body || "<empty>"}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

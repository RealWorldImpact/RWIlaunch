const fs = require("fs");
const path = require("path");
const solc = require("solc");

const projectRoot = path.resolve(__dirname, "..");

function collectSolidityFiles(directory, prefix = "contracts") {
  const sources = {};
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    const sourceName = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) Object.assign(sources, collectSolidityFiles(absolute, sourceName));
    if (entry.isFile() && entry.name.endsWith(".sol")) {
      sources[sourceName] = { content: fs.readFileSync(absolute, "utf8") };
    }
  }
  return sources;
}

function resolveImport(importPath) {
  const candidates = [
    path.join(projectRoot, importPath),
    path.join(projectRoot, "contracts", importPath),
    path.join(projectRoot, "node_modules", importPath),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return { contents: fs.readFileSync(candidate, "utf8") };
    }
  }
  return { error: `Import not found: ${importPath}` };
}

function compile() {
  const input = {
    language: "Solidity",
    sources: collectSolidityFiles(path.join(projectRoot, "contracts")),
    settings: {
      optimizer: { enabled: true, runs: 1 },
      viaIR: true,
      evmVersion: "shanghai",
      outputSelection: {
        "*": { "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object", "evm.deployedBytecode.immutableReferences"] },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: resolveImport }));
  const errors = (output.errors || []).filter((entry) => entry.severity === "error");
  for (const entry of output.errors || []) {
    const stream = entry.severity === "error" ? console.error : console.warn;
    stream(entry.formattedMessage.trim());
  }
  if (errors.length) throw new Error(`Solidity compilation failed with ${errors.length} error(s).`);

  let artifactCount = 0;
  for (const [sourceName, contracts] of Object.entries(output.contracts || {})) {
    if (!sourceName.startsWith("contracts/")) continue;
    for (const [contractName, contract] of Object.entries(contracts)) {
      const destination = path.join(projectRoot, "artifacts", sourceName, `${contractName}.json`);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.writeFileSync(destination, JSON.stringify({
        contractName,
        sourceName,
        abi: contract.abi,
        bytecode: `0x${contract.evm.bytecode.object}`,
        deployedBytecode: `0x${contract.evm.deployedBytecode.object}`,
        immutableReferences: contract.evm.deployedBytecode.immutableReferences || {},
      }, null, 2));
      artifactCount += 1;
    }
  }

  const browserContract = output.contracts["contracts/RobinhoodRWIV4LaunchHook.sol"]
    .RobinhoodRWIV4LaunchHook;
  const hookDeployer = output.contracts["contracts/RWIV4HookDeployer.sol"].RWIV4HookDeployer;
  fs.writeFileSync(
    path.join(projectRoot, "factory-abi.js"),
    `window.RWI_FACTORY_ABI = Object.freeze(${JSON.stringify(browserContract.abi, null, 2)});\n`,
  );
  fs.writeFileSync(
    path.join(projectRoot, "factory-deployment.js"),
    `window.RWI_FACTORY_DEPLOYMENT = Object.freeze(${JSON.stringify({
      bytecode: `0x${browserContract.evm.bytecode.object}`,
      deployedBytecode: `0x${browserContract.evm.deployedBytecode.object}`,
      immutableReferences: browserContract.evm.deployedBytecode.immutableReferences || {},
    }, null, 2)});\nwindow.RWI_HOOK_DEPLOYER_DEPLOYMENT = Object.freeze(${JSON.stringify({
      abi: hookDeployer.abi,
      bytecode: `0x${hookDeployer.evm.bytecode.object}`,
      deployedBytecode: `0x${hookDeployer.evm.deployedBytecode.object}`,
    }, null, 2)});\n`,
  );
  // The public registry was source-verified and deployed with 500 optimizer runs.
  // Compile it separately so runtime validation is not coupled to the hook's size-focused settings.
  const profileSourceName = "contracts/RWICreatorProfileRegistry.sol";
  const profileOutput = JSON.parse(solc.compile(JSON.stringify({
    language: "Solidity",
    sources: { [profileSourceName]: sourcesForProfileRegistry() },
    settings: {
      optimizer: { enabled: true, runs: 500 },
      viaIR: true,
      evmVersion: "shanghai",
      outputSelection: { "*": { "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"] } },
    },
  })));
  const profileErrors = (profileOutput.errors || []).filter((entry) => entry.severity === "error");
  if (profileErrors.length) {
    profileErrors.forEach((entry) => console.error(entry.formattedMessage.trim()));
    throw new Error(`Profile registry compilation failed with ${profileErrors.length} error(s).`);
  }
  const profileRegistry = profileOutput.contracts[profileSourceName].RWICreatorProfileRegistry;
  const profileArtifactPath = path.join(projectRoot, "artifacts", profileSourceName, "RWICreatorProfileRegistry.json");
  fs.writeFileSync(profileArtifactPath, JSON.stringify({
    contractName: "RWICreatorProfileRegistry",
    sourceName: profileSourceName,
    abi: profileRegistry.abi,
    bytecode: `0x${profileRegistry.evm.bytecode.object}`,
    deployedBytecode: `0x${profileRegistry.evm.deployedBytecode.object}`,
    immutableReferences: {},
  }, null, 2));
  fs.writeFileSync(
    path.join(projectRoot, "profile-registry-abi.js"),
    `window.RWI_PROFILE_REGISTRY_ABI = Object.freeze(${JSON.stringify(profileRegistry.abi, null, 2)});\n`,
  );
  fs.writeFileSync(
    path.join(projectRoot, "profile-registry-deployment.js"),
    `window.RWI_PROFILE_REGISTRY_DEPLOYMENT = Object.freeze(${JSON.stringify({
      bytecode: `0x${profileRegistry.evm.bytecode.object}`,
      deployedBytecode: `0x${profileRegistry.evm.deployedBytecode.object}`,
    }, null, 2)});\n`,
  );
  console.log(`Compiled ${artifactCount} project contracts with solc 0.8.26.`);
  return output;
}

function sourcesForProfileRegistry() {
  return { content: fs.readFileSync(path.join(projectRoot, "contracts", "RWICreatorProfileRegistry.sol"), "utf8") };
}

module.exports = compile;
if (require.main === module) compile();

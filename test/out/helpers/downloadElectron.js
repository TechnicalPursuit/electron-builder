"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadAllRequiredElectronVersions = exports.deleteOldElectronVersion = void 0;
const ci_info_1 = require("ci-info");
const path = __importStar(require("path"));
const fs_1 = require("fs");
const testConfig_1 = require("./testConfig");
const executeAppBuilder = require(path.join(__dirname, "../../..", "packages/builder-util")).executeAppBuilder;
async function deleteOldElectronVersion() {
    // on CircleCi no need to clean manually
    if (process.env.CIRCLECI || !ci_info_1.isCI) {
        return;
    }
    const cacheDir = testConfig_1.getElectronCacheDir();
    let files;
    try {
        files = await fs_1.promises.readdir(cacheDir);
    }
    catch (e) {
        if (e.code === "ENOENT") {
            return;
        }
        else {
            throw e;
        }
    }
    return await Promise.all(files.map(file => {
        if (file.endsWith(".zip") && !file.includes(testConfig_1.ELECTRON_VERSION)) {
            console.log(`Remove old electron ${file}`);
            return fs_1.promises.unlink(path.join(cacheDir, file));
        }
        return Promise.resolve(null);
    }));
}
exports.deleteOldElectronVersion = deleteOldElectronVersion;
function downloadAllRequiredElectronVersions() {
    const platforms = process.platform === "win32" ? ["win32"] : ["darwin", "linux", "win32"];
    if (process.platform === "darwin") {
        platforms.push("mas");
    }
    const versions = [];
    for (const platform of platforms) {
        const archs = (platform === "mas" || platform === "darwin") ? ["x64"] : (platform === "win32" ? ["ia32", "x64"] : require(`${path.join(__dirname, "../../..")}/packages/builder-util/out/util`).getArchCliNames());
        for (const arch of archs) {
            versions.push({
                version: testConfig_1.ELECTRON_VERSION,
                arch,
                platform,
            });
        }
    }
    return executeAppBuilder(["download-electron", "--configuration", JSON.stringify(versions)]);
}
exports.downloadAllRequiredElectronVersions = downloadAllRequiredElectronVersions;
if (require.main === module) {
    downloadAllRequiredElectronVersions()
        .catch(error => {
        console.error((error.stack || error).toString());
        process.exitCode = -1;
    });
}
//# sourceMappingURL=downloadElectron.js.map
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
const crypto_1 = require("crypto");
const fs_extra_1 = require("fs-extra");
const ci_info_1 = require("ci-info");
const os_1 = require("os");
const path = __importStar(require("path"));
const downloadElectron_1 = require("./downloadElectron");
const baseDir = process.env.APP_BUILDER_TMP_DIR || fs_extra_1.realpathSync(os_1.tmpdir());
const APP_BUILDER_TMP_DIR = path.join(baseDir, `et-${crypto_1.createHash("md5").update(__dirname).digest("hex")}`);
runTests()
    .catch(error => {
    console.error(error.stack || error);
    process.exit(1);
});
async function runTests() {
    process.env.BABEL_JEST_SKIP = "true";
    if (process.env.CIRCLECI) {
        await fs_extra_1.emptyDir(APP_BUILDER_TMP_DIR);
    }
    else {
        await Promise.all([
            downloadElectron_1.deleteOldElectronVersion(),
            downloadElectron_1.downloadAllRequiredElectronVersions(),
            fs_extra_1.emptyDir(APP_BUILDER_TMP_DIR),
        ]);
    }
    const testFiles = process.env.TEST_FILES;
    const testPatterns = [];
    if (testFiles != null && testFiles.length !== 0) {
        testPatterns.push(...testFiles.split(","));
    }
    else if (process.env.CIRCLE_NODE_INDEX != null && process.env.CIRCLE_NODE_INDEX.length !== 0) {
        const circleNodeIndex = parseInt(process.env.CIRCLE_NODE_INDEX, 10);
        if (circleNodeIndex === 0) {
            testPatterns.push("debTest");
            testPatterns.push("fpmTest");
            testPatterns.push("winPackagerTest");
            testPatterns.push("winCodeSignTest");
            testPatterns.push("squirrelWindowsTest");
            testPatterns.push("nsisUpdaterTest");
            testPatterns.push("macArchiveTest");
            testPatterns.push("macCodeSignTest");
            testPatterns.push("extraMetadataTest");
            testPatterns.push("HoistedNodeModuleTest");
            testPatterns.push("configurationValidationTest");
            testPatterns.push("webInstallerTest");
        }
        else if (circleNodeIndex === 1) {
            testPatterns.push("oneClickInstallerTest");
        }
        else if (circleNodeIndex === 2) {
            testPatterns.push("snapTest");
            testPatterns.push("macPackagerTest");
            testPatterns.push("linuxPackagerTest");
            testPatterns.push("msiTest");
            testPatterns.push("ignoreTest");
            testPatterns.push("mainEntryTest");
            testPatterns.push("ArtifactPublisherTest");
            testPatterns.push("RepoSlugTest");
            testPatterns.push("portableTest");
            testPatterns.push("globTest");
            testPatterns.push("BuildTest");
            testPatterns.push("linuxArchiveTest");
        }
        else {
            testPatterns.push("PublishManagerTest");
            testPatterns.push("assistedInstallerTest");
            testPatterns.push("filesTest");
            testPatterns.push("protonTest");
        }
        console.log(`Test files for node ${circleNodeIndex}: ${testPatterns.join(", ")}`);
    }
    process.env.APP_BUILDER_TMP_DIR = APP_BUILDER_TMP_DIR;
    const rootDir = path.join(__dirname, "..", "..");
    process.chdir(rootDir);
    const config = (await fs_extra_1.readJson(path.join(rootDir, "package.json"))).jest;
    // use custom cache dir to avoid https://github.com/facebook/jest/issues/1903#issuecomment-261212137
    config.cacheDirectory = process.env.JEST_CACHE_DIR || "/tmp/jest-electron-builder-tests";
    config.bail = process.env.TEST_BAIL === "true";
    let runInBand = false;
    const scriptArgs = process.argv.slice(2);
    const testPathIgnorePatterns = config.testPathIgnorePatterns;
    if (scriptArgs.length > 0) {
        for (const scriptArg of scriptArgs) {
            console.log(`custom opt: ${scriptArg}`);
            if ("runInBand" === scriptArg) {
                runInBand = true;
            }
            else if (scriptArg.includes("=")) {
                const equalIndex = scriptArg.indexOf("=");
                const envName = scriptArg.substring(0, equalIndex);
                let envValue = scriptArg.substring(equalIndex + 1);
                if (envValue === "isCi") {
                    envValue = ci_info_1.isCI ? "true" : "false";
                }
                process.env[envName] = envValue;
                console.log(`Custom env ${envName}=${envValue}`);
                if (envName === "ALL_TESTS" && envValue === "false") {
                    config.cacheDirectory += "-basic";
                }
            }
            else if (scriptArg.startsWith("skip")) {
                if (!ci_info_1.isCI) {
                    const suffix = scriptArg.substring("skip".length);
                    if (scriptArg === "skipArtifactPublisher") {
                        testPathIgnorePatterns.push("[\\/]{1}ArtifactPublisherTest.js$");
                        config.cacheDirectory += `-${suffix}`;
                    }
                    else {
                        throw new Error(`Unknown opt ${scriptArg}`);
                    }
                }
            }
            else {
                config[scriptArg] = true;
            }
        }
    }
    const jestOptions = {
        verbose: true,
        updateSnapshot: process.env.UPDATE_SNAPSHOT === "true",
        config,
        runInBand,
        projects: [rootDir],
    };
    if (testPatterns.length > 0) {
        jestOptions.testPathPattern = testPatterns
            .map(it => it.endsWith(".ts") || it.endsWith("*") ? it : `${it}\\.ts$`);
    }
    if (process.env.CIRCLECI != null || process.env.TEST_JUNIT_REPORT === "true") {
        jestOptions.reporters = ["default", "jest-junit"];
    }
    // console.log(JSON.stringify(jestOptions, null, 2))
    const testResult = await require("@jest/core").runCLI(jestOptions, jestOptions.projects);
    const exitCode = testResult.results == null || testResult.results.success ? 0 : testResult.globalConfig.testFailureExitCode;
    if (ci_info_1.isCI) {
        process.exit(exitCode);
    }
    await fs_extra_1.remove(APP_BUILDER_TMP_DIR);
    process.exitCode = exitCode;
    if (testResult.globalConfig.forceExit) {
        process.exit(exitCode);
    }
}
//# sourceMappingURL=runTests.js.map
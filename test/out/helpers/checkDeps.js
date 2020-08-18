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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const depcheck_1 = __importDefault(require("depcheck"));
const fs_extra_1 = require("fs-extra");
const fs_1 = require("fs");
const path = __importStar(require("path"));
const promise_1 = require("builder-util/out/promise");
const knownUnusedDevDependencies = new Set([]);
const knownMissedDependencies = new Set([
    "babel-core",
    "babel-preset-env",
    "babel-preset-stage-0",
    "babel-preset-react",
]);
const rootDir = path.join(__dirname, "../../..");
const packageDir = path.join(rootDir, "packages");
async function check(projectDir, devPackageData) {
    const packageName = path.basename(projectDir);
    // console.log(`Checking ${projectDir}`)
    const result = await new Promise(resolve => {
        depcheck_1.default(projectDir, {
            ignoreDirs: [
                "src", "test", "docs", "typings", "docker", "certs", "templates", "vendor",
            ],
            // ignore d.ts
            parsers: {
                "*.js": depcheck_1.default.parser.es6,
            },
        }, resolve);
    });
    let unusedDependencies;
    if (packageName === "electron-builder") {
        unusedDependencies = result.dependencies.filter(it => it !== "dmg-builder" && it !== "bluebird-lst" && it !== "@types/yargs");
    }
    else {
        unusedDependencies = result.dependencies.filter(it => it !== "bluebird-lst" && it !== "@types/debug" && it !== "@types/semver" && it !== "@types/fs-extra");
    }
    if (unusedDependencies.length > 0) {
        console.error(`${chalk_1.default.bold(packageName)} Unused dependencies: ${JSON.stringify(unusedDependencies, null, 2)}`);
        return false;
    }
    let unusedDevDependencies = result.devDependencies.filter(it => !it.startsWith("@types/") && !knownUnusedDevDependencies.has(it));
    if (packageName === "dmg-builder") {
        unusedDevDependencies = unusedDevDependencies.filter(it => it !== "temp-file");
    }
    if (unusedDevDependencies.length > 0) {
        console.error(`${chalk_1.default.bold(packageName)} Unused devDependencies: ${JSON.stringify(unusedDevDependencies, null, 2)}`);
        return false;
    }
    delete result.missing.electron;
    const toml = result.missing.toml;
    if (toml != null && toml.length === 1 && toml[0].endsWith("config.js")) {
        delete result.missing.toml;
    }
    for (const name of Object.keys(result.missing)) {
        if (name === "electron-builder-squirrel-windows" || name === "electron-webpack" ||
            (packageName === "app-builder-lib" && (name === "dmg-builder" || knownMissedDependencies.has(name) || name.startsWith("@babel/"))) ||
            (packageName === "app-builder-lib" && (name === "dmg-builder" || knownMissedDependencies.has(name) || name.startsWith("@babel/")))) {
            delete result.missing[name];
        }
    }
    if (Object.keys(result.missing).length > 0) {
        console.error(`${chalk_1.default.bold(packageName)} Missing dependencies: ${JSON.stringify(result.missing, null, 2)}`);
        return false;
    }
    const packageData = await fs_extra_1.readJson(path.join(projectDir, "package.json"));
    for (const name of (devPackageData.devDependencies == null ? [] : Object.keys(devPackageData.devDependencies))) {
        if (packageData.dependencies != null && packageData.dependencies[name] != null) {
            continue;
        }
        const usages = result.using[name];
        if (usages == null || usages.length === 0) {
            continue;
        }
        for (const file of usages) {
            if (file.startsWith(path.join(projectDir, "src") + path.sep)) {
                console.error(`${chalk_1.default.bold(packageName)} Dev dependency ${name} is used in the sources`);
                return false;
            }
        }
    }
    return true;
}
async function main() {
    const packages = (await fs_1.promises.readdir(packageDir)).filter(it => !it.includes(".")).sort();
    const devPackageData = await fs_extra_1.readJson(path.join(rootDir, "package.json"));
    if ((await Promise.all(packages.map(it => check(path.join(packageDir, it), devPackageData)))).includes(false)) {
        process.exitCode = 1;
    }
}
main()
    .catch(promise_1.printErrorAndExit);
//# sourceMappingURL=checkDeps.js.map
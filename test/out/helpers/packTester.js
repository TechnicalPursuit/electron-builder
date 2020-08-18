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
exports.toSystemIndependentPath = exports.verifyAsarFileTree = exports.removeUnstableProperties = exports.checkDirContents = exports.createMacTargetTest = exports.signed = exports.platform = exports.modifyPackageJson = exports.packageJson = exports.parseFileList = exports.getTarExecutable = exports.execShell = exports.getFixtureDir = exports.copyTestAsset = exports.assertPack = exports.appTwo = exports.app = exports.appTwoThrows = exports.appThrows = exports.snapTarget = exports.linuxDirTarget = void 0;
const _7zip_bin_1 = require("7zip-bin");
const builder_util_1 = require("builder-util");
const builder_util_runtime_1 = require("builder-util-runtime");
const fs_1 = require("builder-util/out/fs");
const promise_1 = require("builder-util/out/promise");
const decompress_zip_1 = __importDefault(require("decompress-zip"));
const electron_builder_1 = require("electron-builder");
const app_builder_lib_1 = require("app-builder-lib");
const targetFactory_1 = require("app-builder-lib/out/targets/targetFactory");
const tools_1 = require("app-builder-lib/out/targets/tools");
const squirrelPack_1 = require("electron-builder-squirrel-windows/out/squirrelPack");
const fs_extra_1 = require("fs-extra");
const fs_2 = require("fs");
const js_yaml_1 = require("js-yaml");
const path = __importStar(require("path"));
const util_1 = require("util");
const path_sort_1 = __importDefault(require("path-sort"));
const temp_file_1 = require("temp-file");
const asar_1 = require("app-builder-lib/out/asar/asar");
const appBuilder_1 = require("app-builder-lib/out/util/appBuilder");
const codeSignData_1 = require("./codeSignData");
const fileAssert_1 = require("./fileAssert");
if (process.env.TRAVIS !== "true") {
    process.env.CIRCLE_BUILD_NUM = "42";
}
exports.linuxDirTarget = electron_builder_1.Platform.LINUX.createTarget(electron_builder_1.DIR_TARGET);
exports.snapTarget = electron_builder_1.Platform.LINUX.createTarget("snap");
function appThrows(packagerOptions, checkOptions = {}, customErrorAssert) {
    return () => fileAssert_1.assertThat(assertPack("test-app-one", packagerOptions, checkOptions)).throws(customErrorAssert);
}
exports.appThrows = appThrows;
function appTwoThrows(packagerOptions, checkOptions = {}) {
    return () => fileAssert_1.assertThat(assertPack("test-app", packagerOptions, checkOptions)).throws();
}
exports.appTwoThrows = appTwoThrows;
function app(packagerOptions, checkOptions = {}) {
    return () => assertPack(packagerOptions.config != null && packagerOptions.config.protonNodeVersion != null ? "proton" : "test-app-one", packagerOptions, checkOptions);
}
exports.app = app;
function appTwo(packagerOptions, checkOptions = {}) {
    return () => assertPack("test-app", packagerOptions, checkOptions);
}
exports.appTwo = appTwo;
async function assertPack(fixtureName, packagerOptions, checkOptions = {}) {
    let configuration = packagerOptions.config;
    if (configuration == null) {
        configuration = {};
        packagerOptions.config = configuration;
    }
    if (checkOptions.signed) {
        packagerOptions = signed(packagerOptions);
    }
    if (checkOptions.signedWin) {
        configuration.cscLink = codeSignData_1.WIN_CSC_LINK;
        configuration.cscKeyPassword = "";
    }
    else if (configuration.cscLink == null) {
        packagerOptions = builder_util_1.deepAssign({}, packagerOptions, { config: { mac: { identity: null } } });
    }
    const projectDirCreated = checkOptions.projectDirCreated;
    let projectDir = path.join(__dirname, "..", "..", "fixtures", fixtureName);
    // const isDoNotUseTempDir = platform === "darwin"
    const customTmpDir = process.env.TEST_APP_TMP_DIR;
    const tmpDir = checkOptions.tmpDir || new temp_file_1.TmpDir(`pack-tester: ${fixtureName}`);
    // non-macOS test uses the same dir as macOS test, but we cannot share node_modules (because tests executed in parallel)
    const dir = customTmpDir == null ? await tmpDir.createTempDir({ prefix: "test-project" }) : path.resolve(customTmpDir);
    if (customTmpDir != null) {
        await fs_extra_1.emptyDir(dir);
        builder_util_1.log.info({ customTmpDir }, "custom temp dir used");
    }
    await fs_1.copyDir(projectDir, dir, {
        filter: it => {
            const basename = path.basename(it);
            // if custom project dir specified, copy node_modules (i.e. do not ignore it)
            return (packagerOptions.projectDir != null || basename !== "node_modules") && (!basename.startsWith(".") || basename === ".babelrc");
        },
        isUseHardLink: fs_1.USE_HARD_LINKS,
    });
    projectDir = dir;
    await promise_1.executeFinally((async () => {
        if (projectDirCreated != null) {
            await projectDirCreated(projectDir, tmpDir);
        }
        if (checkOptions.isInstallDepsBefore) {
            // bin links required (e.g. for node-pre-gyp - if package refers to it in the install script)
            await builder_util_1.spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["install", "--production"], {
                cwd: projectDir,
            });
        }
        if (packagerOptions.projectDir != null) {
            packagerOptions.projectDir = path.resolve(projectDir, packagerOptions.projectDir);
        }
        const { packager, outDir } = await packAndCheck({
            projectDir,
            ...packagerOptions
        }, checkOptions);
        if (checkOptions.packed != null) {
            const base = function (platform, arch) {
                return path.join(outDir, `${platform.buildConfigurationKey}${electron_builder_1.getArchSuffix(arch == null ? electron_builder_1.Arch.x64 : arch)}${platform === electron_builder_1.Platform.MAC ? "" : "-unpacked"}`);
            };
            await checkOptions.packed({
                projectDir,
                outDir,
                getResources: (platform, arch) => path.join(base(platform, arch), "resources"),
                getContent: platform => base(platform),
                packager,
                tmpDir,
            });
        }
    })(), () => tmpDir === checkOptions.tmpDir ? null : tmpDir.cleanup());
}
exports.assertPack = assertPack;
const fileCopier = new fs_1.FileCopier();
function copyTestAsset(name, destination) {
    return fileCopier.copy(path.join(getFixtureDir(), name), destination, undefined);
}
exports.copyTestAsset = copyTestAsset;
function getFixtureDir() {
    return path.join(__dirname, "..", "..", "fixtures");
}
exports.getFixtureDir = getFixtureDir;
async function packAndCheck(packagerOptions, checkOptions) {
    const cancellationToken = new builder_util_runtime_1.CancellationToken();
    const packager = new electron_builder_1.Packager(packagerOptions, cancellationToken);
    const publishManager = new app_builder_lib_1.PublishManager(packager, { publish: "publish" in checkOptions ? checkOptions.publish : "never" });
    const artifacts = new Map();
    packager.artifactCreated(event => {
        if (event.file == null) {
            return;
        }
        fileAssert_1.assertThat(event.file).isAbsolute();
        builder_util_1.addValue(artifacts, event.packager.platform, event);
    });
    const { outDir, platformToTargets } = await packager.build();
    await publishManager.awaitTasks();
    if (packagerOptions.platformPackagerFactory != null) {
        return { packager, outDir };
    }
    function sortKey(a) {
        return `${a.target == null ? "no-target" : a.target.name}:${a.file == null ? a.fileContent.toString("hex") : path.basename(a.file)}`;
    }
    const objectToCompare = {};
    for (const platform of packagerOptions.targets.keys()) {
        objectToCompare[platform.buildConfigurationKey] = await Promise.all((artifacts.get(platform) || []).sort((a, b) => sortKey(a).localeCompare(sortKey(b))).map(async (it) => {
            const result = { ...it };
            const file = result.file;
            if (file != null) {
                if (file.endsWith(".yml")) {
                    result.fileContent = removeUnstableProperties(js_yaml_1.safeLoad(await fs_2.promises.readFile(file, "utf-8")));
                }
                result.file = path.basename(file);
            }
            const updateInfo = result.updateInfo;
            if (updateInfo != null) {
                result.updateInfo = removeUnstableProperties(updateInfo);
            }
            else if (updateInfo === null) {
                delete result.updateInfo;
            }
            // reduce snapshot - avoid noise
            if (result.safeArtifactName == null) {
                delete result.safeArtifactName;
            }
            if (result.updateInfo == null) {
                delete result.updateInfo;
            }
            if (result.arch == null) {
                delete result.arch;
            }
            else {
                result.arch = electron_builder_1.Arch[result.arch];
            }
            if (Buffer.isBuffer(result.fileContent)) {
                delete result.fileContent;
            }
            delete result.isWriteUpdateInfo;
            delete result.packager;
            delete result.target;
            delete result.publishConfig;
            return result;
        }));
    }
    expect(objectToCompare).toMatchSnapshot();
    c: for (const [platform, archToType] of packagerOptions.targets) {
        for (const [arch, targets] of targetFactory_1.computeArchToTargetNamesMap(archToType, { platformSpecificBuildOptions: packagerOptions[platform.buildConfigurationKey] || {}, defaultTarget: [] }, platform)) {
            if (targets.length === 1 && targets[0] === electron_builder_1.DIR_TARGET) {
                continue c;
            }
            const nameToTarget = platformToTargets.get(platform);
            if (platform === electron_builder_1.Platform.MAC) {
                const packedAppDir = path.join(outDir, nameToTarget.has("mas-dev") ? "mas-dev" : (nameToTarget.has("mas") ? "mas" : "mac"), `${packager.appInfo.productFilename}.app`);
                await checkMacResult(packager, packagerOptions, checkOptions, packedAppDir);
            }
            else if (platform === electron_builder_1.Platform.LINUX) {
                await checkLinuxResult(outDir, packager, arch, nameToTarget);
            }
            else if (platform === electron_builder_1.Platform.WINDOWS) {
                await checkWindowsResult(packager, checkOptions, artifacts.get(platform), nameToTarget);
            }
        }
    }
    return { packager, outDir };
}
async function checkLinuxResult(outDir, packager, arch, nameToTarget) {
    if (!nameToTarget.has("deb")) {
        return;
    }
    const appInfo = packager.appInfo;
    const packageFile = `${outDir}/TestApp_${appInfo.version}_${arch === electron_builder_1.Arch.ia32 ? "i386" : (arch === electron_builder_1.Arch.x64 ? "amd64" : "armv7l")}.deb`;
    expect(await getContents(packageFile)).toMatchSnapshot();
    if (arch === electron_builder_1.Arch.ia32) {
        expect(await getContents(`${outDir}/TestApp_${appInfo.version}_i386.deb`)).toMatchSnapshot();
    }
    const control = parseDebControl((await exports.execShell(`ar p '${packageFile}' control.tar.gz | ${await getTarExecutable()} zx --to-stdout ./control`, {
        maxBuffer: 10 * 1024 * 1024,
    })).stdout);
    delete control.Version;
    delete control.Size;
    const description = control.Description;
    delete control.Description;
    expect(control).toMatchSnapshot();
    // strange difference on linux and mac (no leading space on Linux)
    expect(description.trim()).toMatchSnapshot();
}
function parseDebControl(info) {
    const regexp = /([\w]+): *(.+\n)([^:\n]+\n)?/g;
    let match;
    const metadata = {};
    info = info.substring(info.indexOf("Package:"));
    while ((match = regexp.exec(info)) !== null) {
        let value = match[2];
        if (match[3] != null) {
            value += match[3];
        }
        if (value[value.length - 1] === "\n") {
            value = value.substring(0, value.length - 1);
        }
        metadata[match[1]] = value;
    }
    return metadata;
}
async function checkMacResult(packager, packagerOptions, checkOptions, packedAppDir) {
    const appInfo = packager.appInfo;
    const info = (await appBuilder_1.executeAppBuilderAsJson(["decode-plist", "-f", path.join(packedAppDir, "Contents", "Info.plist")]))[0];
    expect(info).toMatchObject({
        CFBundleVersion: info.CFBundleVersion === "50" ? "50" : `${appInfo.version}.${(process.env.TRAVIS_BUILD_NUMBER || process.env.CIRCLE_BUILD_NUM)}`
    });
    // checked manually, remove to avoid mismatch on CI server (where TRAVIS_BUILD_NUMBER is defined and different on each test run)
    delete info.AsarIntegrity;
    delete info.CFBundleVersion;
    delete info.BuildMachineOSBuild;
    delete info.NSHumanReadableCopyright;
    delete info.DTXcode;
    delete info.DTXcodeBuild;
    delete info.DTSDKBuild;
    delete info.DTSDKName;
    delete info.DTCompiler;
    delete info.ElectronTeamID;
    delete info.NSMainNibFile;
    delete info.NSCameraUsageDescription;
    delete info.NSMicrophoneUsageDescription;
    delete info.NSRequiresAquaSystemAppearance;
    delete info.NSQuitAlwaysKeepsWindows;
    if (info.NSAppTransportSecurity != null) {
        delete info.NSAppTransportSecurity.NSAllowsArbitraryLoads;
    }
    // test value
    if (info.LSMinimumSystemVersion !== "10.12.0") {
        delete info.LSMinimumSystemVersion;
    }
    expect(info).toMatchSnapshot();
    const checksumData = info.AsarIntegrity;
    if (checksumData != null) {
        const data = JSON.parse(checksumData);
        const checksums = data.checksums;
        for (const name of Object.keys(checksums)) {
            checksums[name] = "hash";
        }
        info.AsarIntegrity = JSON.stringify(data);
    }
    if (checkOptions.checkMacApp != null) {
        await checkOptions.checkMacApp(packedAppDir, info);
    }
    if (packagerOptions.config != null && packagerOptions.config.cscLink != null) {
        const result = await builder_util_1.exec("codesign", ["--verify", packedAppDir]);
        expect(result).not.toMatch(/is not signed at all/);
    }
}
async function checkWindowsResult(packager, checkOptions, artifacts, nameToTarget) {
    const appInfo = packager.appInfo;
    let squirrel = false;
    for (const target of nameToTarget.keys()) {
        if (target === "squirrel") {
            squirrel = true;
            break;
        }
    }
    if (!squirrel) {
        return;
    }
    const packageFile = artifacts.find(it => it.file.endsWith("-full.nupkg")).file;
    const unZipper = new decompress_zip_1.default(packageFile);
    const fileDescriptors = await unZipper.getFiles();
    // we test app-update.yml separately, don't want to complicate general assert (yes, it is not good that we write app-update.yml for squirrel.windows if we build nsis and squirrel.windows in parallel, but as squirrel.windows is deprecated, it is ok)
    const files = path_sort_1.default(fileDescriptors.map(it => toSystemIndependentPath(it.path))
        .filter(it => (!it.startsWith("lib/net45/locales/") || it === "lib/net45/locales/en-US.pak") && !it.endsWith(".psmdcp") && !it.endsWith("app-update.yml") && !it.includes("/inspector/")));
    expect(files).toMatchSnapshot();
    if (checkOptions == null) {
        await unZipper.extractFile(fileDescriptors.filter(it => it.path === "TestApp.nuspec")[0], {
            path: path.dirname(packageFile),
        });
        const expectedSpec = (await fs_2.promises.readFile(path.join(path.dirname(packageFile), "TestApp.nuspec"), "utf8")).replace(/\r\n/g, "\n");
        // console.log(expectedSpec)
        expect(expectedSpec).toEqual(`<?xml version="1.0"?>
<package xmlns="http://schemas.microsoft.com/packaging/2011/08/nuspec.xsd">
  <metadata>
    <id>TestApp</id>
    <version>${squirrelPack_1.convertVersion(appInfo.version)}</version>
    <title>${appInfo.productName}</title>
    <authors>Foo Bar</authors>
    <owners>Foo Bar</owners>
    <iconUrl>https://raw.githubusercontent.com/szwacz/electron-boilerplate/master/resources/windows/icon.ico</iconUrl>
    <requireLicenseAcceptance>false</requireLicenseAcceptance>
    <description>Test Application (test quite “ #378)</description>
    <copyright>Copyright © ${new Date().getFullYear()} Foo Bar</copyright>
    <projectUrl>http://foo.example.com</projectUrl>
  </metadata>
</package>`);
    }
}
exports.execShell = util_1.promisify(require("child_process").exec);
async function getTarExecutable() {
    return process.platform === "darwin" ? path.join(await tools_1.getLinuxToolsPath(), "bin", "gtar") : "tar";
}
exports.getTarExecutable = getTarExecutable;
async function getContents(packageFile) {
    const result = await exports.execShell(`ar p '${packageFile}' data.tar.xz | ${await getTarExecutable()} -t -I'${_7zip_bin_1.path7x}'`, {
        maxBuffer: 10 * 1024 * 1024,
        env: {
            ...process.env,
            SZA_PATH: _7zip_bin_1.path7za,
        }
    });
    const contents = parseFileList(result.stdout, true);
    return path_sort_1.default(contents.filter(it => !(it.includes(`/locales/`) || it.includes(`/libgcrypt`) || it.includes("/inspector/"))));
}
function parseFileList(data, fromDpkg) {
    return data
        .split("\n")
        .map(it => it.length === 0 ? null : fromDpkg ? it.substring(it.indexOf(".") + 1) : (it.startsWith("./") ? it.substring(2) : (it === "." ? null : it)))
        .filter(it => it != null && it.length > 0);
}
exports.parseFileList = parseFileList;
function packageJson(task, isApp = false) {
    return (projectDir) => modifyPackageJson(projectDir, task, isApp);
}
exports.packageJson = packageJson;
async function modifyPackageJson(projectDir, task, isApp = false) {
    const file = isApp ? path.join(projectDir, "app", "package.json") : path.join(projectDir, "package.json");
    const data = await fs_2.promises.readFile(file, "utf-8").then(it => JSON.parse(it));
    task(data);
    // because copied as hard link
    await fs_2.promises.unlink(file);
    await fs_2.promises.writeFile(path.join(projectDir, ".yarnrc.yml"), "nodeLinker: node-modules");
    return await fs_extra_1.writeJson(file, data);
}
exports.modifyPackageJson = modifyPackageJson;
function platform(platform) {
    return {
        targets: platform.createTarget()
    };
}
exports.platform = platform;
function signed(packagerOptions) {
    if (process.env.CSC_KEY_PASSWORD == null) {
        builder_util_1.log.warn({ reason: "CSC_KEY_PASSWORD is not defined" }, "macOS code signing is not tested");
    }
    else {
        if (packagerOptions.config == null) {
            packagerOptions.config = {};
        }
        packagerOptions.config.cscLink = codeSignData_1.CSC_LINK;
    }
    return packagerOptions;
}
exports.signed = signed;
function createMacTargetTest(target, config, isSigned = true) {
    return app({
        targets: electron_builder_1.Platform.MAC.createTarget(),
        config: {
            extraMetadata: {
                repository: "foo/bar",
            },
            mac: {
                target,
            },
            publish: null,
            ...config
        },
    }, {
        signed: isSigned,
        packed: async (context) => {
            if (!target.includes("tar.gz")) {
                return;
            }
            const tempDir = await context.tmpDir.createTempDir({ prefix: "mac-target-test" });
            await builder_util_1.exec("tar", ["xf", path.join(context.outDir, "Test App ßW-1.1.0-mac.tar.gz")], { cwd: tempDir });
            await fileAssert_1.assertThat(path.join(tempDir, "Test App ßW.app")).isDirectory();
        }
    });
}
exports.createMacTargetTest = createMacTargetTest;
async function checkDirContents(dir) {
    expect((await fs_1.walk(dir, file => !path.basename(file).startsWith("."))).map(it => toSystemIndependentPath(it.substring(dir.length + 1)))).toMatchSnapshot();
}
exports.checkDirContents = checkDirContents;
function removeUnstableProperties(data) {
    return JSON.parse(JSON.stringify(data, (name, value) => {
        if (name.includes("size") || name.includes("Size") || name.startsWith("sha") || name === "releaseDate") {
            // to ensure that some property exists
            return `@${name}`;
        }
        return value;
    }));
}
exports.removeUnstableProperties = removeUnstableProperties;
async function verifyAsarFileTree(resourceDir) {
    const fs = await asar_1.readAsar(path.join(resourceDir, "app.asar"));
    // console.log(resourceDir + " " + JSON.stringify(fs.header, null, 2))
    expect(fs.header).toMatchSnapshot();
}
exports.verifyAsarFileTree = verifyAsarFileTree;
function toSystemIndependentPath(s) {
    return path.sep === "/" ? s : s.replace(/\\/g, "/");
}
exports.toSystemIndependentPath = toSystemIndependentPath;
//# sourceMappingURL=packTester.js.map
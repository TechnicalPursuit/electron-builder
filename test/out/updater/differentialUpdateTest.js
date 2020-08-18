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
const bluebird_lst_1 = __importDefault(require("bluebird-lst"));
const builder_util_1 = require("builder-util");
const binDownload_1 = require("app-builder-lib/out/binDownload");
const electron_builder_1 = require("electron-builder");
const AppImageUpdater_1 = require("electron-updater/out/AppImageUpdater");
const MacUpdater_1 = require("electron-updater/out/MacUpdater");
const NsisUpdater_1 = require("electron-updater/out/NsisUpdater");
const events_1 = require("events");
const fs_extra_1 = require("fs-extra");
const path = __importStar(require("path"));
const temp_file_1 = require("temp-file");
const packTester_1 = require("../helpers/packTester");
const updaterTestUtil_1 = require("../helpers/updaterTestUtil");
const differentialUpdateTestSnapshotData_1 = require("../helpers/differentialUpdateTestSnapshotData");
const TestAppAdapter_1 = require("../helpers/TestAppAdapter");
/*

rm -rf ~/Documents/onshape-desktop-shell/node_modules/electron-updater && cp -R ~/Documents/electron-builder/packages/electron-updater ~/Documents/onshape-desktop-shell/node_modules/electron-updater && rm -rf ~/Documents/onshape-desktop-shell/node_modules/electron-updater/src && rm -rf ~/Documents/onshape-desktop-shell/node_modules/builder-util-runtime && cp -R ~/Documents/electron-builder/packages/builder-util-runtime ~/Documents/onshape-desktop-shell/node_modules/builder-util-runtime && rm -rf ~/Documents/onshape-desktop-shell/node_modules/builder-util-runtime/src

*/
// %USERPROFILE%\AppData\Roaming\Onshape
// mkdir -p ~/minio-data/onshape
// minio server ~/minio-data
const OLD_VERSION_NUMBER = "1.0.0";
const testAppCacheDirName = "testapp-updater";
test.ifAll.ifDevOrWinCi("web installer", async () => {
    let outDirs = [];
    async function buildApp(version, tmpDir) {
        await packTester_1.assertPack("test-app-one", {
            targets: electron_builder_1.Platform.WINDOWS.createTarget(["nsis-web"], electron_builder_1.Arch.x64),
            config: {
                extraMetadata: {
                    version,
                },
                // package in any case compressed, customization is explicitly disabled - "do not allow to change compression level to avoid different packages"
                compression: process.env.COMPRESSION || "store",
                publish: {
                    provider: "s3",
                    bucket: "develar",
                    path: "test",
                },
            },
        }, {
            signedWin: true,
            packed: async (context) => {
                outDirs.push(context.outDir);
            },
            tmpDir,
        });
    }
    if (process.env.__SKIP_BUILD == null) {
        const tmpDir = new temp_file_1.TmpDir("differential-updater-test");
        try {
            await buildApp(OLD_VERSION_NUMBER, tmpDir);
            // move dist temporarily out of project dir
            const oldDir = await tmpDir.getTempDir();
            await fs_extra_1.move(outDirs[0], oldDir);
            outDirs[0] = oldDir;
            await buildApp("1.0.1", tmpDir);
        }
        catch (e) {
            await tmpDir.cleanup();
            throw e;
        }
        // move old dist to new project as oldDist - simplify development (no need to guess where old dist located in the temp fs)
        const oldDir = path.join(outDirs[1], "..", "oldDist");
        await fs_extra_1.move(outDirs[0], oldDir);
        outDirs[0] = oldDir;
        await fs_extra_1.move(path.join(oldDir, "nsis-web", `TestApp-${OLD_VERSION_NUMBER}-x64.nsis.7z`), path.join(getTestUpdaterCacheDir(oldDir), testAppCacheDirName, "package.7z"));
    }
    else {
        differentialUpdateTestSnapshotData_1.nsisWebDifferentialUpdateTestFakeSnapshot();
        outDirs = [
            path.join(process.env.TEST_APP_TMP_DIR, "oldDist"),
            path.join(process.env.TEST_APP_TMP_DIR, "dist"),
        ];
    }
    await testBlockMap(outDirs[0], path.join(outDirs[1], "nsis-web"), NsisUpdater_1.NsisUpdater, "win-unpacked", electron_builder_1.Platform.WINDOWS);
});
test.ifAll.ifDevOrWinCi("nsis", async () => {
    let outDirs = [];
    async function buildApp(version) {
        await packTester_1.assertPack("test-app-one", {
            targets: electron_builder_1.Platform.WINDOWS.createTarget(["nsis"], electron_builder_1.Arch.x64),
            config: {
                extraMetadata: {
                    version,
                },
                // package in any case compressed, customization is explicitly disabled - "do not allow to change compression level to avoid different packages"
                compression: process.env.COMPRESSION || "store",
                publish: {
                    provider: "s3",
                    bucket: "develar",
                    path: "test",
                },
            },
        }, {
            signedWin: true,
            packed: async (context) => {
                outDirs.push(context.outDir);
            }
        });
    }
    if (process.env.__SKIP_BUILD == null) {
        await buildApp(OLD_VERSION_NUMBER);
        const tmpDir = new temp_file_1.TmpDir("differential-updater-test");
        try {
            // move dist temporarily out of project dir
            const oldDir = await tmpDir.getTempDir();
            await fs_extra_1.move(outDirs[0], oldDir);
            outDirs[0] = oldDir;
            await buildApp("1.0.1");
        }
        catch (e) {
            await tmpDir.cleanup();
            throw e;
        }
        // move old dist to new project as oldDist - simplify development (no need to guess where old dist located in the temp fs)
        const oldDir = path.join(outDirs[1], "..", "oldDist");
        await fs_extra_1.move(outDirs[0], oldDir);
        outDirs[0] = oldDir;
        await fs_extra_1.move(path.join(oldDir, `Test App ßW Setup ${OLD_VERSION_NUMBER}.exe`), path.join(getTestUpdaterCacheDir(oldDir), testAppCacheDirName, "installer.exe"));
        await fs_extra_1.move(path.join(oldDir, "Test App ßW Setup 1.0.0.exe.blockmap"), path.join(outDirs[1], "Test App ßW Setup 1.0.0.exe.blockmap"));
    }
    else {
        differentialUpdateTestSnapshotData_1.nsisDifferentialUpdateFakeSnapshot();
        outDirs = [
            path.join(process.env.TEST_APP_TMP_DIR, "oldDist"),
            path.join(process.env.TEST_APP_TMP_DIR, "dist"),
        ];
    }
    await testBlockMap(outDirs[0], outDirs[1], NsisUpdater_1.NsisUpdater, "win-unpacked", electron_builder_1.Platform.WINDOWS);
});
async function testLinux(arch) {
    process.env.TEST_UPDATER_ARCH = electron_builder_1.Arch[arch];
    const outDirs = [];
    const tmpDir = new temp_file_1.TmpDir("differential-updater-test");
    try {
        await doBuild(outDirs, electron_builder_1.Platform.LINUX.createTarget(["appimage"], arch), tmpDir);
        process.env.APPIMAGE = path.join(outDirs[0], `TestApp-1.0.0-${arch === electron_builder_1.Arch.x64 ? "x86_64" : "i386"}.AppImage`);
        await testBlockMap(outDirs[0], path.join(outDirs[1]), AppImageUpdater_1.AppImageUpdater, `__appImage-${electron_builder_1.Arch[arch]}`, electron_builder_1.Platform.LINUX);
    }
    finally {
        await tmpDir.cleanup();
    }
}
test.ifAll.ifDevOrLinuxCi("AppImage", () => testLinux(electron_builder_1.Arch.x64));
test.ifAll.ifDevOrLinuxCi("AppImage ia32", () => testLinux(electron_builder_1.Arch.ia32));
// ifAll.ifMac.ifNotCi todo
test.skip("dmg", async () => {
    const outDirs = [];
    const tmpDir = new temp_file_1.TmpDir("differential-updater-test");
    if (process.env.__SKIP_BUILD == null) {
        await doBuild(outDirs, electron_builder_1.Platform.MAC.createTarget(), tmpDir, {
            mac: {
                electronUpdaterCompatibility: ">=2.17.0",
            },
        });
    }
    else {
        // todo
    }
    await testBlockMap(outDirs[0], path.join(outDirs[1]), MacUpdater_1.MacUpdater, "mac/Test App ßW.app", electron_builder_1.Platform.MAC);
});
async function buildApp(version, outDirs, targets, tmpDir, extraConfig) {
    await packTester_1.assertPack("test-app-one", {
        targets,
        config: {
            extraMetadata: {
                version,
            },
            ...extraConfig,
            compression: "normal",
            publish: {
                provider: "s3",
                bucket: "develar",
                path: "test",
            },
        },
    }, {
        packed: async (context) => {
            outDirs.push(context.outDir);
        },
        tmpDir,
    });
}
async function doBuild(outDirs, targets, tmpDir, extraConfig) {
    await buildApp("1.0.0", outDirs, targets, tmpDir, extraConfig);
    try {
        // move dist temporarily out of project dir
        const oldDir = await tmpDir.getTempDir();
        await fs_extra_1.move(outDirs[0], oldDir);
        outDirs[0] = oldDir;
        await buildApp("1.0.1", outDirs, targets, tmpDir, extraConfig);
    }
    catch (e) {
        await tmpDir.cleanup();
        throw e;
    }
    // move old dist to new project as oldDist - simplify development (no need to guess where old dist located in the temp fs)
    const oldDir = path.join(outDirs[1], "..", "oldDist");
    await fs_extra_1.move(outDirs[0], oldDir);
    outDirs[0] = oldDir;
}
async function checkResult(updater) {
    const updateCheckResult = await updater.checkForUpdates();
    const downloadPromise = updateCheckResult.downloadPromise;
    // noinspection JSIgnoredPromiseFromCall
    expect(downloadPromise).not.toBeNull();
    const files = await downloadPromise;
    const fileInfo = updateCheckResult.updateInfo.files[0];
    // because port is random
    expect(fileInfo.url).toBeDefined();
    delete fileInfo.url;
    expect(packTester_1.removeUnstableProperties(updateCheckResult.updateInfo)).toMatchSnapshot();
    expect(files.map(it => path.basename(it))).toMatchSnapshot();
}
class TestNativeUpdater extends events_1.EventEmitter {
    // private updateUrl: string | null = null
    // noinspection JSMethodCanBeStatic
    checkForUpdates() {
        console.log("TestNativeUpdater.checkForUpdates");
        // MacUpdater expects this to emit corresponding update-downloaded event
        this.emit("update-downloaded");
        // this.download()
        //   .catch(error => {
        //     this.emit("error", error)
        //   })
    }
    // private async download() {
    // }
    // noinspection JSMethodCanBeStatic
    setFeedURL(updateUrl) {
        // console.log("TestNativeUpdater.setFeedURL " + updateUrl)
        // this.updateUrl = updateUrl
    }
}
function getTestUpdaterCacheDir(oldDir) {
    return path.join(oldDir, "updater-cache");
}
async function testBlockMap(oldDir, newDir, updaterClass, appUpdateConfigPath, platform) {
    const port = 8000 + updaterClass.name.charCodeAt(0) + Math.floor(Math.random() * 10000);
    // noinspection SpellCheckingInspection
    const httpServerProcess = builder_util_1.doSpawn(path.join(await binDownload_1.getBinFromUrl("ran", "0.1.3", "imfA3LtT6umMM0BuQ29MgO3CJ9uleN5zRBi3sXzcTbMOeYZ6SQeN7eKr3kXZikKnVOIwbH+DDO43wkiR/qTdkg=="), process.platform, "ran"), [
        `-root=${newDir}`,
        `-port=${port}`,
        "-gzip=false",
        "-listdir=true",
    ]);
    const mockNativeUpdater = new TestNativeUpdater();
    jest.mock("electron", () => {
        return {
            autoUpdater: mockNativeUpdater,
        };
    }, { virtual: true });
    return await new bluebird_lst_1.default((resolve, reject) => {
        httpServerProcess.on("error", reject);
        const updater = new updaterClass(null, new TestAppAdapter_1.TestAppAdapter(OLD_VERSION_NUMBER, getTestUpdaterCacheDir(oldDir)));
        updater._appUpdateConfigPath = path.join(oldDir, (updaterClass === MacUpdater_1.MacUpdater ? `${appUpdateConfigPath}/Contents/Resources` : (`${appUpdateConfigPath}/resources`)), "app-update.yml");
        const doTest = async () => {
            await updaterTestUtil_1.tuneTestUpdater(updater, {
                platform: platform.nodeName,
                isUseDifferentialDownload: true,
            });
            updater.logger = console;
            const currentUpdaterCacheDirName = (await updater.configOnDisk.value).updaterCacheDirName;
            if (currentUpdaterCacheDirName == null) {
                throw new Error(`currentUpdaterCacheDirName must be not null, appUpdateConfigPath: ${updater._appUpdateConfigPath}`);
            }
            updater.updateConfigPath = await updaterTestUtil_1.writeUpdateConfig({
                provider: "generic",
                updaterCacheDirName: currentUpdaterCacheDirName,
                url: `http://127.0.0.1:${port}`,
            });
            // updater.updateConfigPath = await writeUpdateConfig<S3Options | GenericServerOptions>({
            //   provider: "s3",
            //   endpoint: "http://192.168.178.34:9000",
            //   bucket: "develar",
            //   path: "onshape-test",
            // })
            await checkResult(updater);
        };
        doTest()
            .then(() => resolve())
            .catch(reject);
    })
        .finally(() => {
        httpServerProcess.kill();
    });
}
//# sourceMappingURL=differentialUpdateTest.js.map
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
exports.doTest = exports.checkHelpers = exports.expectUpdateMetadata = void 0;
const fs_1 = require("builder-util/out/fs");
const electron_builder_1 = require("electron-builder");
const asar_1 = require("app-builder-lib/out/asar/asar");
const fs_extra_1 = require("fs-extra");
const fs_2 = require("fs");
const js_yaml_1 = require("js-yaml");
const path = __importStar(require("path"));
const fileAssert_1 = require("./fileAssert");
const wine_1 = require("./wine");
async function expectUpdateMetadata(context, arch = electron_builder_1.Arch.ia32, requireCodeSign = false) {
    const data = js_yaml_1.safeLoad(await fs_2.promises.readFile(path.join(context.getResources(electron_builder_1.Platform.WINDOWS, arch), "app-update.yml"), "utf-8"));
    if (requireCodeSign) {
        expect(data.publisherName).toEqual(["Foo, Inc"]);
        delete data.publisherName;
    }
    expect(data).toMatchSnapshot();
}
exports.expectUpdateMetadata = expectUpdateMetadata;
async function checkHelpers(resourceDir, isPackElevateHelper) {
    const elevateHelperExecutable = path.join(resourceDir, "elevate.exe");
    if (isPackElevateHelper) {
        await fileAssert_1.assertThat(elevateHelperExecutable).isFile();
    }
    else {
        await fileAssert_1.assertThat(elevateHelperExecutable).doesNotExist();
    }
}
exports.checkHelpers = checkHelpers;
async function doTest(outDir, perUser, productFilename = "TestApp Setup", name = "TestApp", menuCategory = null, packElevateHelper = true) {
    if (process.env.DO_WINE !== "true") {
        return Promise.resolve();
    }
    const wine = new wine_1.WineManager();
    await wine.prepare();
    const driveC = path.join(wine.wineDir, "drive_c");
    const driveCWindows = path.join(wine.wineDir, "drive_c", "windows");
    const perUserTempDir = path.join(wine.userDir, "Temp");
    const walkFilter = (it) => {
        return it !== driveCWindows && it !== perUserTempDir;
    };
    function listFiles() {
        return fs_1.walk(driveC, null, { consume: walkFilter });
    }
    let fsBefore = await listFiles();
    await wine.exec(path.join(outDir, `${productFilename} Setup 1.1.0.exe`), "/S");
    let instDir = perUser ? path.join(wine.userDir, "Local Settings", "Application Data", "Programs") : path.join(driveC, "Program Files");
    if (menuCategory != null) {
        instDir = path.join(instDir, menuCategory);
    }
    const appAsar = path.join(instDir, name, "resources", "app.asar");
    expect(await asar_1.readAsarJson(appAsar, "package.json")).toMatchObject({
        name,
    });
    if (!perUser) {
        let startMenuDir = path.join(driveC, "users", "Public", "Start Menu", "Programs");
        if (menuCategory != null) {
            startMenuDir = path.join(startMenuDir, menuCategory);
        }
        await fileAssert_1.assertThat(path.join(startMenuDir, `${productFilename}.lnk`)).isFile();
    }
    if (packElevateHelper) {
        await fileAssert_1.assertThat(path.join(instDir, name, "resources", "elevate.exe")).isFile();
    }
    else {
        await fileAssert_1.assertThat(path.join(instDir, name, "resources", "elevate.exe")).doesNotExist();
    }
    let fsAfter = await listFiles();
    let fsChanges = wine_1.diff(fsBefore, fsAfter, driveC);
    expect(fsChanges.added).toMatchSnapshot();
    expect(fsChanges.deleted).toEqual([]);
    // run installer again to test uninstall
    const appDataFile = path.join(wine.userDir, "Application Data", name, "doNotDeleteMe");
    await fs_extra_1.outputFile(appDataFile, "app data must be not removed");
    fsBefore = await listFiles();
    await wine.exec(path.join(outDir, `${productFilename} Setup 1.1.0.exe`), "/S");
    fsAfter = await listFiles();
    fsChanges = wine_1.diff(fsBefore, fsAfter, driveC);
    expect(fsChanges.added).toEqual([]);
    expect(fsChanges.deleted).toEqual([]);
    await fileAssert_1.assertThat(appDataFile).isFile();
    await wine.exec(path.join(outDir, `${productFilename} Setup 1.1.0.exe`), "/S", "--delete-app-data");
    await fileAssert_1.assertThat(appDataFile).doesNotExist();
}
exports.doTest = doTest;
//# sourceMappingURL=winHelper.js.map
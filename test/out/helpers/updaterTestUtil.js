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
exports.trackEvents = exports.tuneTestUpdater = exports.httpExecutor = exports.TestNodeHttpExecutor = exports.validateDownload = exports.writeUpdateConfig = exports.createNsisUpdater = exports.createTestAppAdapter = void 0;
const builder_util_1 = require("builder-util");
const electron_updater_1 = require("electron-updater");
const MacUpdater_1 = require("electron-updater/out/MacUpdater");
const fs_extra_1 = require("fs-extra");
const path = __importStar(require("path"));
const NsisUpdater_1 = require("electron-updater/out/NsisUpdater");
const TestAppAdapter_1 = require("./TestAppAdapter");
const fileAssert_1 = require("./fileAssert");
const nodeHttpExecutor_1 = require("builder-util/out/nodeHttpExecutor");
const tmpDir = new builder_util_1.TmpDir("updater-test-util");
async function createTestAppAdapter(version = "0.0.1") {
    return new TestAppAdapter_1.TestAppAdapter(version, await tmpDir.getTempDir());
}
exports.createTestAppAdapter = createTestAppAdapter;
async function createNsisUpdater(version = "0.0.1") {
    const testAppAdapter = await createTestAppAdapter(version);
    const result = new NsisUpdater_1.NsisUpdater(null, testAppAdapter);
    await tuneTestUpdater(result);
    return result;
}
exports.createNsisUpdater = createNsisUpdater;
// to reduce difference in test mode, setFeedURL is not used to set (NsisUpdater also read configOnDisk to load original publisherName)
async function writeUpdateConfig(data) {
    const updateConfigPath = path.join(await tmpDir.getTempDir({ prefix: "test-update-config" }), "app-update.yml");
    await fs_extra_1.outputFile(updateConfigPath, builder_util_1.serializeToYaml(data));
    return updateConfigPath;
}
exports.writeUpdateConfig = writeUpdateConfig;
async function validateDownload(updater, expectDownloadPromise = true) {
    const actualEvents = trackEvents(updater);
    const updateCheckResult = await updater.checkForUpdates();
    const assets = updateCheckResult.updateInfo.assets;
    if (assets != null) {
        for (const asset of assets) {
            delete asset.download_count;
        }
    }
    expect(updateCheckResult.updateInfo).toMatchSnapshot();
    if (expectDownloadPromise) {
        // noinspection JSIgnoredPromiseFromCall
        expect(updateCheckResult.downloadPromise).toBeDefined();
        const downloadResult = await updateCheckResult.downloadPromise;
        if (updater instanceof MacUpdater_1.MacUpdater) {
            expect(downloadResult).toEqual([]);
        }
        else {
            await fileAssert_1.assertThat(path.join((downloadResult)[0])).isFile();
        }
    }
    else {
        // noinspection JSIgnoredPromiseFromCall
        expect(updateCheckResult.downloadPromise).toBeUndefined();
    }
    expect(actualEvents).toMatchSnapshot();
    return updateCheckResult;
}
exports.validateDownload = validateDownload;
class TestNodeHttpExecutor extends nodeHttpExecutor_1.NodeHttpExecutor {
    download(url, destination, options) {
        const args = ["download", "--url", url, "--output", destination];
        if (options != null && options.sha512) {
            args.push("--sha512", options.sha512);
        }
        return builder_util_1.executeAppBuilder(args)
            .then(() => destination);
    }
}
exports.TestNodeHttpExecutor = TestNodeHttpExecutor;
exports.httpExecutor = new TestNodeHttpExecutor();
async function tuneTestUpdater(updater, options) {
    updater.httpExecutor = exports.httpExecutor;
    updater._testOnlyOptions = {
        platform: "win32",
        ...options,
    };
    updater.logger = new electron_updater_1.NoOpLogger();
}
exports.tuneTestUpdater = tuneTestUpdater;
function trackEvents(updater) {
    const actualEvents = [];
    for (const eventName of ["checking-for-update", "update-available", "update-downloaded", "error"]) {
        updater.addListener(eventName, () => {
            actualEvents.push(eventName);
        });
    }
    return actualEvents;
}
exports.trackEvents = trackEvents;
//# sourceMappingURL=updaterTestUtil.js.map
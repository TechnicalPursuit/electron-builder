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
const fs_extra_1 = require("fs-extra");
const os_1 = require("os");
const path = __importStar(require("path"));
const fileAssert_1 = require("../helpers/fileAssert");
const packTester_1 = require("../helpers/packTester");
const updaterTestUtil_1 = require("../helpers/updaterTestUtil");
if (process.env.ELECTRON_BUILDER_OFFLINE === "true") {
    fit("Skip ArtifactPublisherTest suite — ELECTRON_BUILDER_OFFLINE is defined", () => {
        console.warn("[SKIP] Skip ArtifactPublisherTest suite — ELECTRON_BUILDER_OFFLINE is defined");
    });
}
test("check updates - no versions at all", async () => {
    const updater = await updaterTestUtil_1.createNsisUpdater();
    // tslint:disable-next-line:no-object-literal-type-assertion
    updater.setFeedURL({
        provider: "bintray",
        owner: "actperepo",
        package: "no-versions",
    });
    await fileAssert_1.assertThat(updater.checkForUpdates()).throws();
});
async function testUpdateFromBintray(version) {
    const updater = await updaterTestUtil_1.createNsisUpdater(version);
    updater.allowDowngrade = true;
    updater.updateConfigPath = await updaterTestUtil_1.writeUpdateConfig({
        provider: "bintray",
        owner: "actperepo",
        package: "TestApp",
    });
    const actualEvents = [];
    const expectedEvents = ["checking-for-update", "update-available", "update-downloaded"];
    for (const eventName of expectedEvents) {
        updater.addListener(eventName, () => {
            actualEvents.push(eventName);
        });
    }
    const updateCheckResult = await updater.checkForUpdates();
    expect(packTester_1.removeUnstableProperties(updateCheckResult.updateInfo)).toMatchSnapshot();
    await checkDownloadPromise(updateCheckResult);
    expect(actualEvents).toEqual(expectedEvents);
}
test("file url (bintray)", () => testUpdateFromBintray(undefined));
test("downgrade (disallowed, bintray)", async () => {
    const updater = await updaterTestUtil_1.createNsisUpdater("2.0.0");
    updater.updateConfigPath = await updaterTestUtil_1.writeUpdateConfig({
        provider: "bintray",
        owner: "actperepo",
        package: "TestApp",
    });
    const actualEvents = [];
    const expectedEvents = ["checking-for-update", "update-not-available"];
    for (const eventName of expectedEvents) {
        updater.addListener(eventName, () => {
            actualEvents.push(eventName);
        });
    }
    const updateCheckResult = await updater.checkForUpdates();
    expect(packTester_1.removeUnstableProperties(updateCheckResult.updateInfo)).toMatchSnapshot();
    // noinspection JSIgnoredPromiseFromCall
    expect(updateCheckResult.downloadPromise).toBeUndefined();
    expect(actualEvents).toEqual(expectedEvents);
});
test("downgrade (disallowed, beta)", async () => {
    const updater = await updaterTestUtil_1.createNsisUpdater("1.5.2-beta.4");
    updater.updateConfigPath = await updaterTestUtil_1.writeUpdateConfig({
        provider: "github",
        owner: "develar",
        repo: "__test_nsis_release",
    });
    const actualEvents = [];
    const expectedEvents = ["checking-for-update", "update-not-available"];
    for (const eventName of expectedEvents) {
        updater.addListener(eventName, () => {
            actualEvents.push(eventName);
        });
    }
    const updateCheckResult = await updater.checkForUpdates();
    expect(packTester_1.removeUnstableProperties(updateCheckResult.updateInfo)).toMatchSnapshot();
    // noinspection JSIgnoredPromiseFromCall
    expect(updateCheckResult.downloadPromise).toBeUndefined();
    expect(actualEvents).toEqual(expectedEvents);
});
test("downgrade (allowed)", () => testUpdateFromBintray("2.0.0-beta.1"));
test("file url generic", async () => {
    const updater = await updaterTestUtil_1.createNsisUpdater();
    updater.updateConfigPath = await updaterTestUtil_1.writeUpdateConfig({
        provider: "generic",
        url: "https://develar.s3.amazonaws.com/test",
    });
    await updaterTestUtil_1.validateDownload(updater);
});
test.skip("DigitalOcean Spaces", async () => {
    const updater = await updaterTestUtil_1.createNsisUpdater();
    updater.updateConfigPath = await updaterTestUtil_1.writeUpdateConfig({
        provider: "spaces",
        name: "electron-builder-test",
        path: "light-updater-test",
        region: "nyc3",
    });
    await updaterTestUtil_1.validateDownload(updater);
});
test.skip.ifNotCiWin("sha512 mismatch error event", async () => {
    const updater = await updaterTestUtil_1.createNsisUpdater();
    updater.updateConfigPath = await updaterTestUtil_1.writeUpdateConfig({
        provider: "generic",
        url: "https://develar.s3.amazonaws.com/test",
        channel: "beta",
    });
    const actualEvents = updaterTestUtil_1.trackEvents(updater);
    const updateCheckResult = await updater.checkForUpdates();
    expect(packTester_1.removeUnstableProperties(updateCheckResult.updateInfo)).toMatchSnapshot();
    await fileAssert_1.assertThat(updateCheckResult.downloadPromise).throws();
    expect(actualEvents).toMatchSnapshot();
});
test("file url generic - manual download", async () => {
    const updater = await updaterTestUtil_1.createNsisUpdater();
    updater.updateConfigPath = await updaterTestUtil_1.writeUpdateConfig({
        provider: "generic",
        url: "https://develar.s3.amazonaws.com/test",
    });
    updater.autoDownload = false;
    const actualEvents = updaterTestUtil_1.trackEvents(updater);
    const updateCheckResult = await updater.checkForUpdates();
    expect(packTester_1.removeUnstableProperties(updateCheckResult.updateInfo)).toMatchSnapshot();
    // noinspection JSIgnoredPromiseFromCall
    expect(updateCheckResult.downloadPromise).toBeNull();
    expect(actualEvents).toMatchSnapshot();
    await fileAssert_1.assertThat(path.join((await updater.downloadUpdate())[0])).isFile();
});
// https://github.com/electron-userland/electron-builder/issues/1045
test("checkForUpdates several times", async () => {
    const updater = await updaterTestUtil_1.createNsisUpdater();
    updater.updateConfigPath = await updaterTestUtil_1.writeUpdateConfig({
        provider: "generic",
        url: "https://develar.s3.amazonaws.com/test",
    });
    const actualEvents = updaterTestUtil_1.trackEvents(updater);
    for (let i = 0; i < 10; i++) {
        //noinspection JSIgnoredPromiseFromCall
        updater.checkForUpdates();
    }
    async function checkForUpdates() {
        const updateCheckResult = await updater.checkForUpdates();
        expect(packTester_1.removeUnstableProperties(updateCheckResult.updateInfo)).toMatchSnapshot();
        await checkDownloadPromise(updateCheckResult);
    }
    await checkForUpdates();
    // we must not download the same file again
    await checkForUpdates();
    expect(actualEvents).toMatchSnapshot();
});
async function checkDownloadPromise(updateCheckResult) {
    return await fileAssert_1.assertThat(path.join((await updateCheckResult.downloadPromise)[0])).isFile();
}
test("file url github", async () => {
    const updater = await updaterTestUtil_1.createNsisUpdater();
    const options = {
        provider: "github",
        owner: "develar",
        repo: "__test_nsis_release",
    };
    updater.updateConfigPath = await updaterTestUtil_1.writeUpdateConfig(options);
    updater.signals.updateDownloaded(info => {
        expect(info.downloadedFile).not.toBeNull();
        delete info.downloadedFile;
        expect(info).toMatchSnapshot();
    });
    await updaterTestUtil_1.validateDownload(updater);
});
test("file url github pre-release and fullChangelog", async () => {
    const updater = await updaterTestUtil_1.createNsisUpdater("1.5.0-beta.1");
    const options = {
        provider: "github",
        owner: "develar",
        repo: "__test_nsis_release",
    };
    updater.fullChangelog = true;
    updater.updateConfigPath = await updaterTestUtil_1.writeUpdateConfig(options);
    updater.signals.updateDownloaded(info => {
        expect(info.downloadedFile).not.toBeNull();
        delete info.downloadedFile;
        expect(info).toMatchSnapshot();
    });
    const updateCheckResult = await updaterTestUtil_1.validateDownload(updater);
    expect(updateCheckResult.updateInfo).toMatchSnapshot();
});
test.skip("file url github private", async () => {
    const updater = await updaterTestUtil_1.createNsisUpdater("0.0.1");
    updater.updateConfigPath = await updaterTestUtil_1.writeUpdateConfig({
        provider: "github",
        owner: "develar",
        repo: "__test_nsis_release_private",
        private: true,
    });
    await updaterTestUtil_1.validateDownload(updater);
});
test("test error", async () => {
    const updater = await updaterTestUtil_1.createNsisUpdater("0.0.1");
    const actualEvents = updaterTestUtil_1.trackEvents(updater);
    await fileAssert_1.assertThat(updater.checkForUpdates()).throws();
    expect(actualEvents).toMatchSnapshot();
});
test.skip("test download progress", async () => {
    const updater = await updaterTestUtil_1.createNsisUpdater("0.0.1");
    updater.updateConfigPath = await updaterTestUtil_1.writeUpdateConfig({
        provider: "generic",
        url: "https://develar.s3.amazonaws.com/test"
    });
    updater.autoDownload = false;
    const progressEvents = [];
    updater.signals.progress(it => progressEvents.push(it));
    await updater.checkForUpdates();
    await updater.downloadUpdate();
    expect(progressEvents.length).toBeGreaterThanOrEqual(1);
    const lastEvent = progressEvents.pop();
    expect(lastEvent.percent).toBe(100);
    expect(lastEvent.bytesPerSecond).toBeGreaterThan(1);
    expect(lastEvent.transferred).toBe(lastEvent.total);
});
test.ifAll.ifWindows("valid signature", async () => {
    const updater = await updaterTestUtil_1.createNsisUpdater("0.0.1");
    updater.updateConfigPath = await updaterTestUtil_1.writeUpdateConfig({
        provider: "github",
        owner: "develar",
        repo: "__test_nsis_release",
        publisherName: ["Vladimir Krivosheev"],
    });
    await updaterTestUtil_1.validateDownload(updater);
});
test.ifAll.ifWindows("invalid signature", async () => {
    const updater = await updaterTestUtil_1.createNsisUpdater("0.0.1");
    updater.updateConfigPath = await updaterTestUtil_1.writeUpdateConfig({
        provider: "github",
        owner: "develar",
        repo: "__test_nsis_release",
        publisherName: ["Foo Bar"],
    });
    const actualEvents = updaterTestUtil_1.trackEvents(updater);
    await fileAssert_1.assertThat(updater.checkForUpdates().then((it) => it.downloadPromise)).throws();
    expect(actualEvents).toMatchSnapshot();
});
// disable for now
test.skip("90 staging percentage", async () => {
    const userIdFile = path.join(os_1.tmpdir(), "electron-updater-test", "userData", ".updaterId");
    await fs_extra_1.outputFile(userIdFile, "1wa70172-80f8-5cc4-8131-28f5e0edd2a1");
    const updater = await updaterTestUtil_1.createNsisUpdater("0.0.1");
    updater.updateConfigPath = await updaterTestUtil_1.writeUpdateConfig({
        provider: "s3",
        channel: "staging-percentage",
        bucket: "develar",
        path: "test",
    });
    await updaterTestUtil_1.validateDownload(updater);
});
test("1 staging percentage", async () => {
    const userIdFile = path.join(os_1.tmpdir(), "electron-updater-test", "userData", ".updaterId");
    await fs_extra_1.outputFile(userIdFile, "12a70172-80f8-5cc4-8131-28f5e0edd2a1");
    const updater = await updaterTestUtil_1.createNsisUpdater("0.0.1");
    updater.updateConfigPath = await updaterTestUtil_1.writeUpdateConfig({
        provider: "s3",
        channel: "staging-percentage-small",
        bucket: "develar",
        path: "test",
    });
    await updaterTestUtil_1.validateDownload(updater, false);
});
test.skip("cancel download with progress", async () => {
    const updater = await updaterTestUtil_1.createNsisUpdater();
    updater.updateConfigPath = await updaterTestUtil_1.writeUpdateConfig({
        provider: "generic",
        url: "https://develar.s3.amazonaws.com/full-test",
    });
    const progressEvents = [];
    updater.signals.progress(it => progressEvents.push(it));
    let cancelled = false;
    updater.signals.updateCancelled(() => cancelled = true);
    const checkResult = await updater.checkForUpdates();
    checkResult.cancellationToken.cancel();
    if (progressEvents.length > 0) {
        const lastEvent = progressEvents[progressEvents.length - 1];
        expect(lastEvent.percent).not.toBe(100);
        expect(lastEvent.bytesPerSecond).toBeGreaterThan(1);
        expect(lastEvent.transferred).not.toBe(lastEvent.total);
    }
    const downloadPromise = checkResult.downloadPromise;
    await fileAssert_1.assertThat(downloadPromise).throws();
    expect(cancelled).toBe(true);
});
test.ifAll("test download and install", async () => {
    const updater = await updaterTestUtil_1.createNsisUpdater();
    updater.updateConfigPath = await updaterTestUtil_1.writeUpdateConfig({
        provider: "generic",
        url: "https://develar.s3.amazonaws.com/test",
    });
    await updaterTestUtil_1.validateDownload(updater);
    const actualEvents = updaterTestUtil_1.trackEvents(updater);
    expect(actualEvents).toMatchObject([]);
    // await updater.quitAndInstall(true, false)
});
test.ifAll("test downloaded installer", async () => {
    const updater = await updaterTestUtil_1.createNsisUpdater();
    updater.updateConfigPath = await updaterTestUtil_1.writeUpdateConfig({
        provider: "generic",
        url: "https://develar.s3.amazonaws.com/test",
    });
    const actualEvents = updaterTestUtil_1.trackEvents(updater);
    expect(actualEvents).toMatchObject([]);
    // await updater.quitAndInstall(true, false)
});
//# sourceMappingURL=nsisUpdaterTest.js.map
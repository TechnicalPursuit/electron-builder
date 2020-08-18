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
const builder_util_1 = require("builder-util");
const builder_util_runtime_1 = require("builder-util-runtime");
const PublishManager_1 = require("app-builder-lib/out/publish/PublishManager");
const BintrayPublisher_1 = require("app-builder-lib/out/publish/BintrayPublisher");
const gitHubPublisher_1 = require("electron-publish/out/gitHubPublisher");
const ci_info_1 = require("ci-info");
const path = __importStar(require("path"));
if (ci_info_1.isCI && process.platform === "win32") {
    fit("Skip ArtifactPublisherTest suite on Windows CI", () => {
        console.warn("[SKIP] Skip ArtifactPublisherTest suite on Windows CI");
    });
}
if (process.env.ELECTRON_BUILDER_OFFLINE === "true") {
    fit("Skip ArtifactPublisherTest suite — ELECTRON_BUILDER_OFFLINE is defined", () => {
        console.warn("[SKIP] Skip ArtifactPublisherTest suite — ELECTRON_BUILDER_OFFLINE is defined");
    });
}
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function versionNumber() {
    return `${getRandomInt(0, 99)}.${getRandomInt(0, 99)}.${getRandomInt(0, 99)}`;
}
//noinspection SpellCheckingInspection
const token = Buffer.from("Y2Y5NDdhZDJhYzJlMzg1OGNiNzQzYzcwOWZhNGI0OTk2NWQ4ZDg3Yg==", "base64").toString();
const iconPath = path.join(__dirname, "..", "fixtures", "test-app", "build", "icon.icns");
const publishContext = {
    cancellationToken: new builder_util_runtime_1.CancellationToken(),
    progress: null,
};
test("GitHub unauthorized", async () => {
    try {
        await new gitHubPublisher_1.GitHubPublisher(publishContext, { provider: "github", owner: "actperepo", repo: "ecb2", token: "incorrect token" }, versionNumber())._release.value;
    }
    catch (e) {
        expect(e.message).toMatch(/(Bad credentials|Unauthorized|API rate limit exceeded)/);
        return;
    }
    throw new Error("must be error");
});
function isApiRateError(e) {
    if (e.name === "HttpError") {
        const description = e.description;
        return description.message != null && description.message.includes("API rate limit exceeded");
    }
    else {
        return false;
    }
}
function testAndIgnoreApiRate(name, testFunction) {
    test.skip(name, async () => {
        try {
            await testFunction();
        }
        catch (e) {
            if (isApiRateError(e)) {
                console.warn(e.description.message);
            }
            else {
                throw e;
            }
        }
    });
}
test("Bintray upload", async () => {
    const version = "42.0.0";
    const tmpDir = new builder_util_1.TmpDir("artifact-publisher-test");
    const artifactPath = await tmpDir.getTempFile({ suffix: " test-space.icns" });
    await builder_util_1.copyFile(iconPath, artifactPath);
    //noinspection SpellCheckingInspection
    const publisher = new BintrayPublisher_1.BintrayPublisher(publishContext, { provider: "bintray", owner: "actperepo", package: "test", repo: "generic", token: "5df2cadec86dff91392e4c419540785813c3db15" }, version);
    try {
        // force delete old version to ensure that test doesn't depend on previous runs
        await publisher.deleteRelease(true);
        await publisher.upload({ file: artifactPath, arch: builder_util_1.Arch.x64 });
        await publisher.upload({ file: artifactPath, arch: builder_util_1.Arch.x64 });
    }
    finally {
        try {
            await publisher.deleteRelease(false);
        }
        finally {
            await tmpDir.cleanup();
        }
    }
});
testAndIgnoreApiRate("GitHub upload", async () => {
    const publisher = new gitHubPublisher_1.GitHubPublisher(publishContext, { provider: "github", owner: "actperepo", repo: "ecb2", token }, versionNumber());
    try {
        await publisher.upload({ file: iconPath, arch: builder_util_1.Arch.x64 });
        // test overwrite
        await publisher.upload({ file: iconPath, arch: builder_util_1.Arch.x64 });
    }
    finally {
        await publisher.deleteRelease();
    }
});
if (process.env.AWS_ACCESS_KEY_ID != null && process.env.AWS_SECRET_ACCESS_KEY != null) {
    test("S3 upload", async () => {
        const publisher = PublishManager_1.createPublisher(publishContext, "0.0.1", { provider: "s3", bucket: "electron-builder-test" }, {}, {});
        await publisher.upload({ file: iconPath, arch: builder_util_1.Arch.x64 });
        // test overwrite
        await publisher.upload({ file: iconPath, arch: builder_util_1.Arch.x64 });
    });
}
if (process.env.DO_KEY_ID != null && process.env.DO_SECRET_KEY != null) {
    test("DO upload", async () => {
        const configuration = {
            provider: "spaces",
            name: "electron-builder-test",
            region: "nyc3",
        };
        const publisher = PublishManager_1.createPublisher(publishContext, "0.0.1", configuration, {}, {});
        await publisher.upload({ file: iconPath, arch: builder_util_1.Arch.x64 });
        // test overwrite
        await publisher.upload({ file: iconPath, arch: builder_util_1.Arch.x64 });
    });
}
testAndIgnoreApiRate("prerelease", async () => {
    const publisher = new gitHubPublisher_1.GitHubPublisher(publishContext, { provider: "github", owner: "actperepo", repo: "ecb2", token, releaseType: "prerelease" }, versionNumber());
    try {
        await publisher.upload({ file: iconPath, arch: builder_util_1.Arch.x64 });
        const r = await publisher.getRelease();
        expect(r).toMatchObject({
            prerelease: true,
            draft: false,
        });
    }
    finally {
        await publisher.deleteRelease();
    }
});
testAndIgnoreApiRate("GitHub upload org", async () => {
    //noinspection SpellCheckingInspection
    const publisher = new gitHubPublisher_1.GitHubPublisher(publishContext, { provider: "github", owner: "builder-gh-test", repo: "darpa", token }, versionNumber());
    try {
        await publisher.upload({ file: iconPath, arch: builder_util_1.Arch.x64 });
    }
    finally {
        await publisher.deleteRelease();
    }
});
//# sourceMappingURL=ArtifactPublisherTest.js.map
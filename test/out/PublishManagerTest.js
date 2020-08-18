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
const electron_builder_1 = require("electron-builder");
const fs_extra_1 = require("fs-extra");
const path = __importStar(require("path"));
const fileAssert_1 = require("./helpers/fileAssert");
const packTester_1 = require("./helpers/packTester");
test.ifNotWindows.ifDevOrLinuxCi("generic, github and spaces", packTester_1.app({
    targets: electron_builder_1.Platform.MAC.createTarget("zip"),
    config: {
        generateUpdatesFilesForAllChannels: true,
        mac: {
            electronUpdaterCompatibility: ">=2.16",
        },
        publish: [
            genericPublisher("https://example.com/downloads"),
            githubPublisher("foo/foo"),
            spacesPublisher(),
        ]
    },
}));
function spacesPublisher(publishAutoUpdate = true) {
    return {
        provider: "spaces",
        name: "mySpaceName",
        region: "nyc3",
        publishAutoUpdate,
    };
}
function githubPublisher(repo) {
    return {
        provider: "github",
        repo,
    };
}
function genericPublisher(url) {
    return {
        provider: "generic",
        url,
    };
}
test.ifNotWindows.ifDevOrLinuxCi("github and spaces (publishAutoUpdate)", packTester_1.app({
    targets: electron_builder_1.Platform.LINUX.createTarget("AppImage"),
    config: {
        mac: {
            electronUpdaterCompatibility: ">=2.16",
        },
        publish: [
            githubPublisher("foo/foo"),
            spacesPublisher(false),
        ]
    },
}));
test.ifAll("mac artifactName ", packTester_1.app({
    targets: electron_builder_1.Platform.MAC.createTarget("zip"),
    config: {
        // tslint:disable-next-line:no-invalid-template-strings
        artifactName: "${productName}_${version}_${os}.${ext}",
        mac: {
            electronUpdaterCompatibility: ">=2.16",
        },
        publish: [
            spacesPublisher(),
        ]
    },
}, {
    publish: undefined,
}));
// otherwise test "os macro" always failed for pull requests
process.env.PUBLISH_FOR_PULL_REQUEST = "true";
test.ifAll.ifNotWindows("os macro", packTester_1.app({
    targets: electron_builder_1.createTargets([electron_builder_1.Platform.LINUX, electron_builder_1.Platform.MAC], "zip"),
    config: {
        publish: {
            provider: "s3",
            bucket: "my bucket",
            // tslint:disable-next-line:no-invalid-template-strings
            path: "${channel}/${os}"
        },
    },
}, {
    publish: "always",
    projectDirCreated: async (projectDir) => {
        process.env.__TEST_S3_PUBLISHER__ = path.join(projectDir, "dist/s3");
    },
    packed: async (context) => {
        const dir = path.join(context.projectDir, "dist/s3");
        await fileAssert_1.assertThat(dir).isDirectory();
        await packTester_1.checkDirContents(dir);
    }
}));
// disable on ifNotCi for now - slow on CircleCI
// error should be ignored because publish: never
// https://github.com/electron-userland/electron-builder/issues/2670
test.ifAll.ifNotCi("dotted s3 bucket", packTester_1.app({
    targets: electron_builder_1.createTargets([electron_builder_1.Platform.LINUX], "zip"),
    config: {
        publish: {
            provider: "s3",
            bucket: "bucket.dotted.name",
        },
    },
}, {
    publish: "never"
}));
// https://github.com/electron-userland/electron-builder/issues/3261
test.ifAll.ifNotWindows("custom provider", packTester_1.app({
    targets: electron_builder_1.createTargets([electron_builder_1.Platform.LINUX], "zip"),
    config: {
        publish: {
            provider: "custom",
            boo: "foo",
        },
    },
}, {
    publish: "never",
    projectDirCreated: projectDir => fs_extra_1.outputFile(path.join(projectDir, "build/electron-publisher-custom.js"), `class Publisher {
    async upload(task) {
    }
  }
  
  module.exports = Publisher`)
}));
//# sourceMappingURL=PublishManagerTest.js.map
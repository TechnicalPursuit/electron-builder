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
const fs_1 = require("fs");
const path = __importStar(require("path"));
const fileAssert_1 = require("./helpers/fileAssert");
const packTester_1 = require("./helpers/packTester");
const testConfig_1 = require("./helpers/testConfig");
const winHelper_1 = require("./helpers/winHelper");
function createBuildResourcesTest(packagerOptions) {
    return packTester_1.app({
        ...packagerOptions,
        config: {
            publish: null,
            directories: {
                buildResources: "custom",
                // tslint:disable:no-invalid-template-strings
                output: "customDist/${channel}",
                // https://github.com/electron-userland/electron-builder/issues/601
                app: ".",
            },
            nsis: {
                differentialPackage: false,
            },
        },
    }, {
        packed: async (context) => {
            await fileAssert_1.assertThat(path.join(context.projectDir, "customDist", "latest")).isDirectory();
        },
        projectDirCreated: projectDir => fs_1.promises.rename(path.join(projectDir, "build"), path.join(projectDir, "custom"))
    });
}
test.ifAll.ifNotWindows("custom buildResources and output dirs: mac", createBuildResourcesTest({ mac: ["dir"] }));
test.ifAll.ifNotCiMac("custom buildResources and output dirs: win", createBuildResourcesTest({ win: ["nsis"] }));
test.ifAll.ifNotWindows("custom buildResources and output dirs: linux", createBuildResourcesTest({ linux: ["appimage"] }));
test.ifAll.ifLinuxOrDevMac("prepackaged", packTester_1.app({
    targets: packTester_1.linuxDirTarget,
}, {
    packed: async (context) => {
        await electron_builder_1.build({
            prepackaged: path.join(context.outDir, "linux-unpacked"),
            projectDir: context.projectDir,
            linux: [],
            config: {
                // test target
                linux: {
                    target: {
                        target: "deb",
                        arch: "ia32",
                    }
                },
                compression: "store"
            }
        });
        await fileAssert_1.assertThat(path.join(context.projectDir, "dist", "TestApp_1.1.0_i386.deb")).isFile();
    }
}));
test.ifAll.ifLinuxOrDevMac("retrieve latest electron version", packTester_1.app({
    targets: packTester_1.linuxDirTarget,
}, {
    projectDirCreated: projectDir => packTester_1.modifyPackageJson(projectDir, data => {
        data.devDependencies = {
            ...data.devDependencies,
            electron: "latest",
        };
        delete data.build.electronVersion;
    }),
}));
test.ifAll.ifLinuxOrDevMac("retrieve latest electron-nightly version", packTester_1.app({
    targets: packTester_1.linuxDirTarget,
}, {
    projectDirCreated: projectDir => packTester_1.modifyPackageJson(projectDir, data => {
        data.devDependencies = {
            ...data.devDependencies,
            "electron-nightly": "latest",
        };
        delete data.build.electronVersion;
    }),
}));
test.ifAll.ifDevOrLinuxCi("override targets in the config", packTester_1.app({
    targets: packTester_1.linuxDirTarget,
}, {
    packed: async (context) => {
        await electron_builder_1.build({
            projectDir: context.projectDir,
            linux: ["deb"],
            config: {
                publish: null,
                // https://github.com/electron-userland/electron-builder/issues/1355
                linux: {
                    target: [
                        "AppImage",
                        "deb",
                        "rpm"
                    ],
                },
                compression: "store"
            }
        });
    }
}));
// test https://github.com/electron-userland/electron-builder/issues/1182 also
test.ifAll.ifDevOrWinCi("override targets in the config - only arch", packTester_1.app({
    targets: electron_builder_1.Platform.WINDOWS.createTarget(null, electron_builder_1.Arch.ia32),
    config: {
        extraMetadata: {
            version: "1.0.0-beta.1",
        },
        // https://github.com/electron-userland/electron-builder/issues/1348
        win: {
            // tslint:disable:no-invalid-template-strings
            artifactName: "${channel}-${name}.exe",
            target: [
                "nsis",
            ],
        },
        publish: {
            provider: "generic",
            url: "https://develar.s3.amazonaws.com/test",
        },
    },
}, {
    packed: context => {
        return Promise.all([
            fileAssert_1.assertThat(path.join(context.projectDir, "dist", "win-unpacked")).doesNotExist(),
            fileAssert_1.assertThat(path.join(context.projectDir, "dist", "latest.yml")).doesNotExist(),
            winHelper_1.expectUpdateMetadata(context, electron_builder_1.Arch.ia32),
        ]);
    },
}));
// test on all CI to check path separators
test.ifAll("do not exclude build entirely (respect files)", () => packTester_1.assertPack("test-app-build-sub", { targets: packTester_1.linuxDirTarget }));
test.ifNotWindows("electronDist as path to local folder with electron builds zipped ", packTester_1.app({
    targets: packTester_1.linuxDirTarget,
    config: {
        electronDist: testConfig_1.getElectronCacheDir(),
    },
}));
const overridePublishChannel = {
    channel: "beta"
};
test.ifAll.ifDevOrLinuxCi("overriding the publish channel", packTester_1.app({
    targets: packTester_1.linuxDirTarget,
    config: {
        publish: overridePublishChannel
    },
}, {
    projectDirCreated: projectDir => packTester_1.modifyPackageJson(projectDir, data => {
        data.devDependencies = {};
        data.build.publish = [
            {
                provider: "s3",
                bucket: "my-s3-bucket",
            }
        ];
    }),
    packed: async (context) => {
        expect(context.packager.config.publish).toMatchSnapshot();
    },
}));
//# sourceMappingURL=ExtraBuildTest.js.map
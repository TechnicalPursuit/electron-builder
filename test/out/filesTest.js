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
const builder_util_1 = require("builder-util");
const fs_1 = require("builder-util/out/fs");
const fs_extra_1 = require("fs-extra");
const fs_2 = require("fs");
const path = __importStar(require("path"));
const stat_mode_1 = require("stat-mode");
const fileAssert_1 = require("./helpers/fileAssert");
const packTester_1 = require("./helpers/packTester");
test.ifDevOrLinuxCi("expand not defined env", packTester_1.appThrows({
    targets: packTester_1.linuxDirTarget,
    config: {
        asar: false,
        // tslint:disable:no-invalid-template-strings
        files: ["${env.FOO_NOT_DEFINED}"],
    }
}));
process.env.__NOT_BAR__ = "!**/bar";
test.ifDevOrLinuxCi("files", packTester_1.app({
    targets: packTester_1.linuxDirTarget,
    config: {
        asar: false,
        // tslint:disable:no-invalid-template-strings
        files: ["**/*", "!ignoreMe${/*}", "${env.__NOT_BAR__}", "dist/electron/**/*"],
    }
}, {
    projectDirCreated: projectDir => Promise.all([
        fs_extra_1.outputFile(path.join(projectDir, "ignoreMe", "foo"), "data"),
        fs_extra_1.outputFile(path.join(projectDir, "ignoreEmptyDir", "bar"), "data"),
        fs_extra_1.outputFile(path.join(projectDir, "test.h"), "test that"),
        fs_extra_1.outputFile(path.join(projectDir, "dist/electron/foo.js"), "data"),
    ]),
    packed: context => {
        const resources = path.join(context.getResources(electron_builder_1.Platform.LINUX), "app");
        return packTester_1.checkDirContents(resources);
    },
}));
test.ifDevOrLinuxCi("files.from asar", packTester_1.app({
    targets: packTester_1.linuxDirTarget,
    config: {
        asar: true,
        files: [
            {
                from: ".",
                to: ".",
                filter: ["package.json"]
            },
            {
                from: "app/node",
                to: "app/node"
            },
        ],
    },
}, {
    projectDirCreated: projectDir => Promise.all([
        fs_2.promises.mkdir(path.join(projectDir, "app/node"), { recursive: true }).then(() => fs_2.promises.rename(path.join(projectDir, "index.js"), path.join(projectDir, "app/node/index.js"))),
        packTester_1.modifyPackageJson(projectDir, data => {
            data.main = "app/node/index.js";
        })
    ]),
}));
test.ifDevOrLinuxCi("map resources", packTester_1.app({
    targets: packTester_1.linuxDirTarget,
    config: {
        asar: false,
        extraResources: [
            {
                from: "foo/old",
                to: "foo/new",
            },
            {
                from: "license.txt",
                to: ".",
            },
        ],
    }
}, {
    projectDirCreated: projectDir => Promise.all([
        fs_extra_1.outputFile(path.join(projectDir, "foo", "old"), "data"),
        fs_extra_1.outputFile(path.join(projectDir, "license.txt"), "data"),
    ]),
    packed: context => {
        const resources = path.join(context.getResources(electron_builder_1.Platform.LINUX));
        return Promise.all([
            fileAssert_1.assertThat(path.join(resources, "app", "foo", "old")).doesNotExist(),
            fileAssert_1.assertThat(path.join(resources, "foo", "new")).isFile(),
            fileAssert_1.assertThat(path.join(resources, "license.txt")).isFile(),
        ]);
    },
}));
async function doExtraResourcesTest(platform) {
    const osName = platform.buildConfigurationKey;
    //noinspection SpellCheckingInspection
    await packTester_1.assertPack("test-app-one", {
        // to check NuGet package
        targets: platform.createTarget(platform === electron_builder_1.Platform.WINDOWS ? "squirrel" : electron_builder_1.DIR_TARGET),
        config: {
            extraResources: [
                "foo",
                "bar/hello.txt",
                "./dir-relative/f.txt",
                "bar/${arch}.txt",
                "${os}/${arch}.txt",
            ],
            [osName]: {
                extraResources: [
                    "platformSpecificR"
                ],
                extraFiles: [
                    "platformSpecificF"
                ],
            }
        },
    }, {
        projectDirCreated: projectDir => {
            return Promise.all([
                fs_extra_1.outputFile(path.join(projectDir, "foo/nameWithoutDot"), "nameWithoutDot"),
                fs_extra_1.outputFile(path.join(projectDir, "bar/hello.txt"), "data"),
                fs_extra_1.outputFile(path.join(projectDir, "dir-relative/f.txt"), "data"),
                fs_extra_1.outputFile(path.join(projectDir, `bar/${process.arch}.txt`), "data"),
                fs_extra_1.outputFile(path.join(projectDir, `${osName}/${process.arch}.txt`), "data"),
                fs_extra_1.outputFile(path.join(projectDir, "platformSpecificR"), "platformSpecificR"),
                fs_extra_1.outputFile(path.join(projectDir, "ignoreMe.txt"), "ignoreMe"),
            ]);
        },
        packed: context => {
            const base = path.join(context.outDir, `${platform.buildConfigurationKey}${platform === electron_builder_1.Platform.MAC ? "" : "-unpacked"}`);
            let resourcesDir = path.join(base, "resources");
            if (platform === electron_builder_1.Platform.MAC) {
                resourcesDir = path.join(base, `${context.packager.appInfo.productFilename}.app`, "Contents", "Resources");
            }
            return Promise.all([
                fileAssert_1.assertThat(path.join(resourcesDir, "foo")).isDirectory(),
                fileAssert_1.assertThat(path.join(resourcesDir, "foo", "nameWithoutDot")).isFile(),
                fileAssert_1.assertThat(path.join(resourcesDir, "bar", "hello.txt")).isFile(),
                fileAssert_1.assertThat(path.join(resourcesDir, "dir-relative", "f.txt")).isFile(),
                fileAssert_1.assertThat(path.join(resourcesDir, "bar", `${process.arch}.txt`)).isFile(),
                fileAssert_1.assertThat(path.join(resourcesDir, osName, `${process.arch}.txt`)).isFile(),
                fileAssert_1.assertThat(path.join(resourcesDir, "platformSpecificR")).isFile(),
                fileAssert_1.assertThat(path.join(resourcesDir, "ignoreMe.txt")).doesNotExist(),
            ]);
        },
    });
}
test.ifDevOrLinuxCi("extraResources on Linux", () => doExtraResourcesTest(electron_builder_1.Platform.LINUX));
// Squirrel.Windows is not supported on macOS anymore (32-bit)
test.ifNotMac.ifDevOrWinCi("extraResources on Windows", () => doExtraResourcesTest(electron_builder_1.Platform.WINDOWS));
test.ifMac("extraResources on macOS", async () => {
    await doExtraResourcesTest(electron_builder_1.Platform.MAC);
});
test.ifNotWindows.ifNotCiWin("extraResources - two-package", () => {
    const platform = electron_builder_1.Platform.LINUX;
    const osName = platform.buildConfigurationKey;
    //noinspection SpellCheckingInspection
    return packTester_1.assertPack("test-app", {
        // to check NuGet package
        targets: platform.createTarget(electron_builder_1.DIR_TARGET),
        config: {
            asar: true,
            extraResources: [
                "foo",
                "bar/hello.txt",
                "bar/${arch}.txt",
                "${os}/${arch}.txt",
                "executable*",
            ],
            [osName]: {
                extraResources: [
                    "platformSpecificR"
                ],
                extraFiles: [
                    "platformSpecificF"
                ],
            },
        },
    }, {
        projectDirCreated: projectDir => {
            return Promise.all([
                fs_extra_1.outputFile(path.join(projectDir, "foo/nameWithoutDot"), "nameWithoutDot"),
                fs_extra_1.outputFile(path.join(projectDir, "bar/hello.txt"), "data", { mode: 0o400 }),
                fs_extra_1.outputFile(path.join(projectDir, `bar/${process.arch}.txt`), "data"),
                fs_extra_1.outputFile(path.join(projectDir, `${osName}/${process.arch}.txt`), "data"),
                fs_extra_1.outputFile(path.join(projectDir, "platformSpecificR"), "platformSpecificR"),
                fs_extra_1.outputFile(path.join(projectDir, "ignoreMe.txt"), "ignoreMe"),
                fs_extra_1.outputFile(path.join(projectDir, "executable"), "executable", { mode: 0o755 }),
                fs_extra_1.outputFile(path.join(projectDir, "executableOnlyOwner"), "executable", { mode: 0o740 }),
            ]);
        },
        packed: async (context) => {
            const base = path.join(context.outDir, `${platform.buildConfigurationKey}-unpacked`);
            let resourcesDir = path.join(base, "resources");
            if (platform === electron_builder_1.Platform.MAC) {
                resourcesDir = path.join(base, "TestApp.app", "Contents", "Resources");
            }
            const appDir = path.join(resourcesDir, "app");
            await Promise.all([
                fileAssert_1.assertThat(path.join(resourcesDir, "foo")).isDirectory(),
                fileAssert_1.assertThat(path.join(appDir, "foo")).doesNotExist(),
                fileAssert_1.assertThat(path.join(resourcesDir, "foo", "nameWithoutDot")).isFile(),
                fileAssert_1.assertThat(path.join(appDir, "foo", "nameWithoutDot")).doesNotExist(),
                fileAssert_1.assertThat(path.join(resourcesDir, "bar", "hello.txt")).isFile(),
                fileAssert_1.assertThat(path.join(resourcesDir, "bar", `${process.arch}.txt`)).isFile(),
                fileAssert_1.assertThat(path.join(appDir, "bar", `${process.arch}.txt`)).doesNotExist(),
                fileAssert_1.assertThat(path.join(resourcesDir, osName, `${process.arch}.txt`)).isFile(),
                fileAssert_1.assertThat(path.join(resourcesDir, "platformSpecificR")).isFile(),
                fileAssert_1.assertThat(path.join(resourcesDir, "ignoreMe.txt")).doesNotExist(),
                allCan(path.join(resourcesDir, "executable"), true),
                allCan(path.join(resourcesDir, "executableOnlyOwner"), true),
                allCan(path.join(resourcesDir, "bar", "hello.txt"), false),
            ]);
            expect(await fs_2.promises.readFile(path.join(resourcesDir, "bar", "hello.txt"), "utf-8")).toEqual("data");
        },
    });
});
// https://github.com/electron-userland/electron-builder/pull/998
// copyDir walks to a symlink referencing a file that has not yet been copied by postponing the linking step until after the full walk is complete
test.ifNotWindows("postpone symlink", async () => {
    const tmpDir = new builder_util_1.TmpDir("files-test");
    const source = await tmpDir.getTempDir();
    const aSourceFile = path.join(source, "z", "Z");
    const bSourceFileLink = path.join(source, "B");
    await fs_extra_1.outputFile(aSourceFile, "test");
    await fs_2.promises.symlink(aSourceFile, bSourceFileLink);
    const dest = await tmpDir.getTempDir();
    await fs_1.copyDir(source, dest);
    await tmpDir.cleanup();
});
async function allCan(file, execute) {
    const mode = new stat_mode_1.Mode(await fs_2.promises.stat(file));
    function checkExecute(value) {
        if (value.execute !== execute) {
            throw new Error(`${file} is ${execute ? "not " : ""}executable`);
        }
    }
    function checkRead(value) {
        if (!value.read) {
            throw new Error(`${file} is not readable`);
        }
    }
    checkExecute(mode.owner);
    checkExecute(mode.group);
    checkExecute(mode.others);
    checkRead(mode.owner);
    checkRead(mode.group);
    checkRead(mode.others);
}
//# sourceMappingURL=filesTest.js.map
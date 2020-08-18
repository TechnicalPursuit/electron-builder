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
const app_builder_lib_1 = require("app-builder-lib");
const asar_1 = require("app-builder-lib/out/asar/asar");
const fs_extra_1 = require("fs-extra");
const path = __importStar(require("path"));
const fs_1 = require("fs");
const fileAssert_1 = require("./helpers/fileAssert");
const packTester_1 = require("./helpers/packTester");
async function createFiles(appDir) {
    await Promise.all([
        fs_extra_1.outputFile(path.join(appDir, "assets", "file"), "data"),
        fs_extra_1.outputFile(path.join(appDir, "b2", "file"), "data"),
        fs_extra_1.outputFile(path.join(appDir, "do-not-unpack-dir", "file.json"), "{}")
            .then(() => fs_1.promises.writeFile(path.join(appDir, "do-not-unpack-dir", "must-be-not-unpacked"), "{}"))
    ]);
    const dir = path.join(appDir, "do-not-unpack-dir", "dir-2", "dir-3", "dir-3");
    await fs_1.promises.mkdir(dir, { recursive: true });
    await fs_1.promises.writeFile(path.join(dir, "file-in-asar"), "{}");
    await fs_1.promises.symlink(path.join(appDir, "assets", "file"), path.join(appDir, "assets", "file-symlink"));
}
test.ifNotWindows.ifDevOrLinuxCi("unpackDir one", packTester_1.app({
    targets: app_builder_lib_1.Platform.LINUX.createTarget(app_builder_lib_1.DIR_TARGET),
    config: {
        asarUnpack: [
            "assets",
            "b2",
            "do-not-unpack-dir/file.json",
        ],
    }
}, {
    projectDirCreated: createFiles,
    packed: assertDirs,
}));
async function assertDirs(context) {
    const resourceDir = context.getResources(app_builder_lib_1.Platform.LINUX);
    await Promise.all([
        fileAssert_1.assertThat(path.join(resourceDir, "app.asar.unpacked", "assets")).isDirectory(),
        fileAssert_1.assertThat(path.join(resourceDir, "app.asar.unpacked", "b2")).isDirectory(),
        fileAssert_1.assertThat(path.join(resourceDir, "app.asar.unpacked", "do-not-unpack-dir", "file.json")).isFile(),
        fileAssert_1.assertThat(path.join(resourceDir, "app.asar.unpacked", "do-not-unpack-dir", "must-be-not-unpacked")).doesNotExist(),
        fileAssert_1.assertThat(path.join(resourceDir, "app.asar.unpacked", "do-not-unpack-dir", "dir-2")).doesNotExist(),
    ]);
    await packTester_1.verifyAsarFileTree(resourceDir);
}
test.ifNotWindows.ifDevOrLinuxCi("unpackDir", () => {
    return packTester_1.assertPack("test-app", {
        targets: app_builder_lib_1.Platform.LINUX.createTarget(app_builder_lib_1.DIR_TARGET),
        config: {
            asarUnpack: ["assets", "b2", "do-not-unpack-dir/file.json"],
        }
    }, {
        projectDirCreated: projectDir => createFiles(path.join(projectDir, "app")),
        packed: assertDirs,
    });
});
test.ifDevOrLinuxCi("asarUnpack and files ignore", () => {
    return packTester_1.assertPack("test-app", {
        targets: app_builder_lib_1.Platform.LINUX.createTarget(app_builder_lib_1.DIR_TARGET),
        config: {
            asarUnpack: [
                "!**/ffprobe-static/bin/darwin/x64/ffprobe"
            ],
        }
    }, {
        projectDirCreated: projectDir => fs_extra_1.outputFile(path.join(projectDir, "node_modules/ffprobe-static/bin/darwin/x64/ffprobe"), "data"),
        packed: async (context) => {
            const resourceDir = context.getResources(app_builder_lib_1.Platform.LINUX);
            await Promise.all([
                fileAssert_1.assertThat(path.join(resourceDir, "app.asar.unpacked", "node_modules/ffprobe-static/bin/darwin/x64/ffprobe")).doesNotExist(),
            ]);
            await packTester_1.verifyAsarFileTree(context.getResources(app_builder_lib_1.Platform.LINUX));
        },
    });
});
test.ifNotWindows("link", packTester_1.app({
    targets: app_builder_lib_1.Platform.LINUX.createTarget(app_builder_lib_1.DIR_TARGET),
}, {
    projectDirCreated: projectDir => {
        return fs_1.promises.symlink(path.join(projectDir, "index.js"), path.join(projectDir, "foo.js"));
    },
    packed: async (context) => {
        expect((await asar_1.readAsar(path.join(context.getResources(app_builder_lib_1.Platform.LINUX), "app.asar"))).getFile("foo.js", false)).toMatchSnapshot();
    },
}));
test.ifNotWindows("outside link", packTester_1.app({
    targets: app_builder_lib_1.Platform.LINUX.createTarget(app_builder_lib_1.DIR_TARGET),
}, {
    projectDirCreated: async (projectDir, tmpDir) => {
        const tempDir = await tmpDir.getTempDir();
        await fs_extra_1.outputFile(path.join(tempDir, "foo"), "data");
        await fs_1.promises.symlink(tempDir, path.join(projectDir, "o-dir"));
    },
    packed: async (context) => {
        expect((await asar_1.readAsar(path.join(context.getResources(app_builder_lib_1.Platform.LINUX), "app.asar"))).getFile("o-dir/foo", false)).toMatchSnapshot();
    },
}));
// cannot be enabled
// https://github.com/electron-userland/electron-builder/issues/611
test.ifDevOrLinuxCi("failed peer dep", () => {
    return packTester_1.assertPack("test-app-one", {
        targets: app_builder_lib_1.Platform.LINUX.createTarget(app_builder_lib_1.DIR_TARGET),
    }, {
        isInstallDepsBefore: true,
        projectDirCreated: projectDir => packTester_1.modifyPackageJson(projectDir, data => {
            //noinspection SpellCheckingInspection
            data.dependencies = {
                "rc-datepicker": "4.0.0",
                react: "15.2.1",
                "react-dom": "15.2.1"
            };
        }),
    });
});
test.ifAll.ifDevOrLinuxCi("ignore node_modules", () => {
    return packTester_1.assertPack("test-app-one", {
        targets: app_builder_lib_1.Platform.LINUX.createTarget(app_builder_lib_1.DIR_TARGET),
        config: {
            asar: false,
            files: [
                "!node_modules/**/*"
            ]
        }
    }, {
        isInstallDepsBefore: true,
        projectDirCreated: projectDir => packTester_1.modifyPackageJson(projectDir, data => {
            //noinspection SpellCheckingInspection
            data.dependencies = {
                "ci-info": "2.0.0",
            };
        }),
        packed: context => {
            return fileAssert_1.assertThat(path.join(context.getResources(app_builder_lib_1.Platform.LINUX), "app", "node_modules")).doesNotExist();
        }
    });
});
test.ifAll.ifDevOrLinuxCi("asarUnpack node_modules", () => {
    return packTester_1.assertPack("test-app-one", {
        targets: app_builder_lib_1.Platform.LINUX.createTarget(app_builder_lib_1.DIR_TARGET),
        config: {
            asarUnpack: "node_modules",
        }
    }, {
        isInstallDepsBefore: true,
        projectDirCreated: projectDir => packTester_1.modifyPackageJson(projectDir, data => {
            data.dependencies = {
                "ci-info": "2.0.0",
            };
        }),
        packed: async (context) => {
            const nodeModulesNode = (await asar_1.readAsar(path.join(context.getResources(app_builder_lib_1.Platform.LINUX), "app.asar"))).getNode("node_modules");
            expect(packTester_1.removeUnstableProperties(nodeModulesNode)).toMatchSnapshot();
            await fileAssert_1.assertThat(path.join(context.getResources(app_builder_lib_1.Platform.LINUX), "app.asar.unpacked/node_modules/ci-info")).isDirectory();
        }
    });
});
//# sourceMappingURL=globTest.js.map
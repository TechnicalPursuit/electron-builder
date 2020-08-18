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
exports.removeUnstableProperties = void 0;
const app_builder_lib_1 = require("app-builder-lib");
const asar_1 = require("app-builder-lib/out/asar/asar");
const config_1 = require("app-builder-lib/out/util/config");
const fs_1 = require("builder-util/out/fs");
const electron_builder_1 = require("electron-builder");
const fs_2 = require("fs");
const fs_extra_1 = require("fs-extra");
const path = __importStar(require("path"));
const builder_1 = require("electron-builder/out/builder");
const packTester_1 = require("./helpers/packTester");
const testConfig_1 = require("./helpers/testConfig");
test("cli", async () => {
    // because these methods are internal
    const { configureBuildCommand, normalizeOptions } = require("electron-builder/out/builder");
    const yargs = builder_1.createYargs();
    configureBuildCommand(yargs);
    function parse(input) {
        const options = normalizeOptions(yargs.parse(input));
        app_builder_lib_1.checkBuildRequestOptions(options);
        return options;
    }
    expect(parse("-owl --x64 --ia32"));
    expect(parse("-mwl --x64 --ia32"));
    expect(parse("--dir")).toMatchObject({ targets: electron_builder_1.Platform.current().createTarget(electron_builder_1.DIR_TARGET) });
    expect(parse("--mac --dir")).toMatchSnapshot();
    expect(parse("--x64 --dir")).toMatchObject({ targets: electron_builder_1.Platform.current().createTarget(electron_builder_1.DIR_TARGET, electron_builder_1.Arch.x64) });
    expect(parse("--ia32 --x64")).toMatchObject({ targets: electron_builder_1.Platform.current().createTarget(null, electron_builder_1.Arch.x64, electron_builder_1.Arch.ia32) });
    expect(parse("--linux")).toMatchSnapshot();
    expect(parse("--win")).toMatchSnapshot();
    expect(parse("-owl")).toMatchSnapshot();
    expect(parse("-l tar.gz:ia32")).toMatchSnapshot();
    expect(parse("-l tar.gz:x64")).toMatchSnapshot();
    expect(parse("-l tar.gz")).toMatchSnapshot();
    expect(parse("-w tar.gz:x64")).toMatchSnapshot();
    expect(parse("-p always -w --x64")).toMatchSnapshot();
    expect(parse("--prepackaged someDir -w --x64")).toMatchSnapshot();
    expect(parse("--project someDir -w --x64")).toMatchSnapshot();
    expect(parse("-c.compress=store -c.asar -c ./config.json")).toMatchObject({
        config: {
            asar: true,
            compress: "store",
            extends: "./config.json"
        }
    });
});
test("merge configurations", () => {
    const result = config_1.doMergeConfigs({
        files: [
            "**/*",
            "!webpack",
            "!.*",
            "!config/jsdoc.json",
            "!package.*",
            "!docs",
            "!private"
        ],
    }, {
        files: [
            {
                from: ".",
                filter: [
                    "package.json"
                ]
            },
            {
                from: "dist/main"
            },
            {
                from: "dist/renderer"
            },
            {
                from: "dist/renderer-dll"
            }
        ],
    });
    // console.log("data: " + JSON.stringify(result, null, 2))
    expect(result).toMatchObject({
        directories: {
            output: "dist",
            buildResources: "build"
        },
        files: [
            {
                filter: [
                    "package.json",
                    "**/*",
                    "!webpack",
                    "!.*",
                    "!config/jsdoc.json",
                    "!package.*",
                    "!docs",
                    "!private"
                ]
            },
            {
                from: "dist/main"
            },
            {
                from: "dist/renderer"
            },
            {
                from: "dist/renderer-dll"
            }
        ]
    });
});
test("build in the app package.json", packTester_1.appTwoThrows({ targets: packTester_1.linuxDirTarget }, {
    projectDirCreated: it => packTester_1.modifyPackageJson(it, data => {
        data.build = {
            productName: "bar",
        };
    }, true)
}));
test("relative index", packTester_1.appTwo({
    targets: packTester_1.linuxDirTarget,
}, {
    projectDirCreated: projectDir => packTester_1.modifyPackageJson(projectDir, data => {
        data.main = "./index.js";
    }, true)
}));
it.ifDevOrLinuxCi("electron version from electron-prebuilt dependency", packTester_1.app({
    targets: packTester_1.linuxDirTarget,
}, {
    projectDirCreated: projectDir => Promise.all([
        fs_extra_1.outputJson(path.join(projectDir, "node_modules", "electron-prebuilt", "package.json"), {
            version: testConfig_1.ELECTRON_VERSION
        }),
        packTester_1.modifyPackageJson(projectDir, data => {
            delete data.build.electronVersion;
            data.devDependencies = {};
        })
    ])
}));
test.ifDevOrLinuxCi("electron version from electron dependency", packTester_1.app({
    targets: packTester_1.linuxDirTarget,
}, {
    projectDirCreated: projectDir => Promise.all([
        fs_extra_1.outputJson(path.join(projectDir, "node_modules", "electron", "package.json"), {
            version: testConfig_1.ELECTRON_VERSION
        }),
        packTester_1.modifyPackageJson(projectDir, data => {
            delete data.build.electronVersion;
            data.devDependencies = {};
        })
    ])
}));
test.ifDevOrLinuxCi("electron version from build", packTester_1.app({
    targets: packTester_1.linuxDirTarget,
}, {
    projectDirCreated: projectDir => packTester_1.modifyPackageJson(projectDir, data => {
        data.devDependencies = {};
        data.build.electronVersion = testConfig_1.ELECTRON_VERSION;
    })
}));
test("www as default dir", packTester_1.appTwo({
    targets: electron_builder_1.Platform.LINUX.createTarget(electron_builder_1.DIR_TARGET),
}, {
    projectDirCreated: projectDir => fs_2.promises.rename(path.join(projectDir, "app"), path.join(projectDir, "www"))
}));
test.ifLinuxOrDevMac("afterPack", () => {
    let called = 0;
    return packTester_1.assertPack("test-app-one", {
        targets: electron_builder_1.createTargets([electron_builder_1.Platform.LINUX, electron_builder_1.Platform.MAC], electron_builder_1.DIR_TARGET),
        config: {
            afterPack: () => {
                called++;
                return Promise.resolve();
            }
        }
    }, {
        packed: async () => {
            expect(called).toEqual(2);
        }
    });
});
test.ifLinuxOrDevMac("afterSign", () => {
    let called = 0;
    return packTester_1.assertPack("test-app-one", {
        targets: electron_builder_1.createTargets([electron_builder_1.Platform.LINUX, electron_builder_1.Platform.MAC], electron_builder_1.DIR_TARGET),
        config: {
            afterSign: () => {
                called++;
                return Promise.resolve();
            }
        }
    }, {
        packed: async () => {
            expect(called).toEqual(2);
        }
    });
});
test.ifLinuxOrDevMac("beforeBuild", () => {
    let called = 0;
    return packTester_1.assertPack("test-app-one", {
        targets: electron_builder_1.createTargets([electron_builder_1.Platform.LINUX, electron_builder_1.Platform.MAC], electron_builder_1.DIR_TARGET),
        config: {
            npmRebuild: true,
            beforeBuild: async () => {
                called++;
            }
        }
    }, {
        packed: async () => {
            expect(called).toEqual(2);
        }
    });
});
// https://github.com/electron-userland/electron-builder/issues/1738
test.ifDevOrLinuxCi("win smart unpack", () => {
    // test onNodeModuleFile hook
    const nodeModuleFiles = [];
    let p = "";
    return packTester_1.app({
        targets: electron_builder_1.Platform.WINDOWS.createTarget(electron_builder_1.DIR_TARGET),
        config: {
            npmRebuild: true,
            onNodeModuleFile: file => {
                const name = packTester_1.toSystemIndependentPath(path.relative(p, file));
                if (!name.startsWith(".") && !name.endsWith(".dll") && name.includes(".")) {
                    nodeModuleFiles.push(name);
                }
            },
        },
    }, {
        projectDirCreated: projectDir => {
            p = projectDir;
            return packTester_1.packageJson(it => {
                it.dependencies = {
                    debug: "3.1.0",
                    "edge-cs": "1.2.1",
                    "@electron-builder/test-smart-unpack": "1.0.0",
                    "@electron-builder/test-smart-unpack-empty": "1.0.0",
                };
            })(projectDir);
        },
        packed: async (context) => {
            await verifySmartUnpack(context.getResources(electron_builder_1.Platform.WINDOWS));
            expect(nodeModuleFiles).toMatchSnapshot();
        }
    })();
});
function removeUnstableProperties(data) {
    return JSON.parse(JSON.stringify(data, (name, value) => {
        if (name === "offset") {
            return undefined;
        }
        else if (name.endsWith(".node") && value.size != null) {
            // size differs on various OS
            value.size = "<size>";
            return value;
        }
        return value;
    }));
}
exports.removeUnstableProperties = removeUnstableProperties;
async function verifySmartUnpack(resourceDir) {
    const asarFs = await asar_1.readAsar(path.join(resourceDir, "app.asar"));
    expect(await asarFs.readJson(`node_modules${path.sep}debug${path.sep}package.json`)).toMatchObject({
        name: "debug"
    });
    expect(removeUnstableProperties(asarFs.header)).toMatchSnapshot();
    const files = (await fs_1.walk(resourceDir, file => !path.basename(file).startsWith(".") && !file.endsWith(`resources${path.sep}inspector`)))
        .map(it => {
        const name = packTester_1.toSystemIndependentPath(it.substring(resourceDir.length + 1));
        if (it.endsWith("package.json")) {
            return { name, content: fs_2.readFileSync(it, "utf-8") };
        }
        return name;
    });
    expect(files).toMatchSnapshot();
}
// https://github.com/electron-userland/electron-builder/issues/1738
test.ifAll.ifDevOrLinuxCi("posix smart unpack", packTester_1.app({
    targets: packTester_1.linuxDirTarget,
    config: {
        // https://github.com/electron-userland/electron-builder/issues/3273
        // tslint:disable-next-line:no-invalid-template-strings
        copyright: "Copyright © 2018 ${author}",
        npmRebuild: true,
        files: [
            // test ignore pattern for node_modules defined as file set filter
            {
                filter: "!node_modules/napi-build-utils/napi-build-utils-1.0.0.tgz",
            }
        ]
    }
}, {
    projectDirCreated: packTester_1.packageJson(it => {
        it.dependencies = {
            debug: "4.1.1",
            "edge-cs": "1.2.1",
            // no prebuilt for electron 3
            // "lzma-native": "3.0.10",
            keytar: "5.6.0",
        };
    }),
    packed: context => {
        expect(context.packager.appInfo.copyright).toBe("Copyright © 2018 Foo Bar");
        return verifySmartUnpack(context.getResources(electron_builder_1.Platform.LINUX));
    }
}));
//# sourceMappingURL=BuildTest.js.map
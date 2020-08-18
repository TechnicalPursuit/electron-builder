"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DebugLogger_1 = require("builder-util/out/DebugLogger");
const electron_builder_1 = require("electron-builder");
const config_1 = require("app-builder-lib/out/util/config");
const builder_1 = require("electron-builder/out/builder");
const packTester_1 = require("./helpers/packTester");
test.ifAll.ifDevOrLinuxCi("validation", packTester_1.appThrows({
    targets: packTester_1.linuxDirTarget,
    config: {
        foo: 123,
        mac: {
            foo: 12123,
        },
    },
}, undefined, error => error.message.includes("configuration has an unknown property 'foo'")));
test.skip.ifDevOrLinuxCi("appId as object", packTester_1.appThrows({
    targets: packTester_1.linuxDirTarget,
    config: {
        appId: {},
    },
}));
// https://github.com/electron-userland/electron-builder/issues/1302
test.ifAll.ifDevOrLinuxCi("extraFiles", packTester_1.app({
    targets: electron_builder_1.Platform.LINUX.createTarget("appimage"),
    config: {
        linux: {
            target: "zip:ia32",
        },
        extraFiles: [
            "lib/*.jar",
            "lib/Proguard/**/*",
            {
                from: "lib/",
                to: ".",
                filter: [
                    "*.dll"
                ]
            },
            {
                from: "lib/",
                to: ".",
                filter: [
                    "*.exe"
                ]
            },
            "BLClient/BLClient.json",
            {
                from: "include/",
                to: "."
            }
        ],
    },
}));
test.ifAll.ifDevOrLinuxCi("files", () => {
    return config_1.validateConfig({
        appId: "com.example.myapp",
        files: [{ from: "dist/app", to: "app", filter: "*.js" }],
        win: {
            target: "NSIS",
            icon: "build/icon.ico"
        }
    }, new DebugLogger_1.DebugLogger());
});
test.ifAll.ifDevOrLinuxCi("null string as null", async () => {
    const yargs = builder_1.configureBuildCommand(builder_1.createYargs());
    const options = builder_1.normalizeOptions(yargs.parse(["-c.mac.identity=null", "--config.mac.hardenedRuntime=false"]));
    const config = options.config;
    await config_1.validateConfig(config, new DebugLogger_1.DebugLogger());
    expect(config.mac.identity).toBeNull();
    expect(config.mac.hardenedRuntime).toBe(false);
});
//# sourceMappingURL=configurationValidationTest.js.map
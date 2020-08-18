"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("builder-util/out/fs");
const electron_builder_1 = require("electron-builder");
const packTester_1 = require("./helpers/packTester");
const checkOptions = {
    projectDirCreated: async (projectDir) => {
        const src = process.env.PROTON_NATIVE_TEST_NODE_MODULES;
        if (src != null) {
            await fs_1.copyDir(src, projectDir + "/node_modules");
        }
    },
    isInstallDepsBefore: false,
};
test.ifAll.ifMac("mac", packTester_1.app({
    targets: electron_builder_1.Platform.MAC.createTarget(),
    config: {
        framework: "proton",
    },
}, checkOptions));
test.ifAll.ifLinuxOrDevMac("linux", packTester_1.app({
    targets: electron_builder_1.Platform.LINUX.createTarget("appimage"),
    config: {
        framework: "proton",
    },
}, checkOptions));
test.ifAll.ifDevOrWinCi("win", packTester_1.app({
    targets: electron_builder_1.Platform.WINDOWS.createTarget("nsis"),
    config: {
        framework: "proton",
    },
}, checkOptions));
test.ifAll.ifDevOrWinCi("win ia32", packTester_1.app({
    targets: electron_builder_1.Platform.WINDOWS.createTarget("nsis", electron_builder_1.Arch.ia32),
    config: {
        framework: "proton",
    },
}, checkOptions));
//# sourceMappingURL=protonTest.js.map
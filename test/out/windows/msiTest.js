"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const packTester_1 = require("../helpers/packTester");
const electron_builder_1 = require("electron-builder");
test.ifAll.ifDevOrWinCi("msi", packTester_1.app({
    targets: electron_builder_1.Platform.WINDOWS.createTarget("msi"),
    config: {
        appId: "build.electron.test.msi.oneClick.perMachine",
        extraMetadata: {
        // version: "1.0.0",
        },
        productName: "Test MSI",
    }
}, {
// signed: true,
}));
test.ifAll.ifDevOrWinCi("msi no asar", packTester_1.app({
    targets: electron_builder_1.Platform.WINDOWS.createTarget("msi"),
    config: {
        appId: "build.electron.test.msi.oneClick.perMachine",
        extraMetadata: {
        // version: "1.0.0",
        },
        productName: "Test MSI",
        asar: false,
    }
}, {
// signed: true,
}));
test.ifAll.ifDevOrWinCi("per-user", packTester_1.app({
    targets: electron_builder_1.Platform.WINDOWS.createTarget("msi"),
    config: {
        appId: "build.electron.test.msi.oneClick.perUser",
        extraMetadata: {
        // version: "1.0.0",
        },
        productName: "Test MSI Per User",
        msi: {
            perMachine: false,
        }
    }
}, {
// signed: true,
}));
test.skip.ifAll("assisted", packTester_1.app({
    targets: electron_builder_1.Platform.WINDOWS.createTarget("msi"),
    config: {
        appId: "build.electron.test.msi.assisted",
        extraMetadata: {
        // version: "1.0.0",
        },
        productName: "Test MSI Assisted",
        // test lzx (currently, doesn't work on wine)
        compression: "maximum",
        msi: {
            oneClick: false,
            menuCategory: "TestMenuDirectory"
        },
    }
}));
//# sourceMappingURL=msiTest.js.map
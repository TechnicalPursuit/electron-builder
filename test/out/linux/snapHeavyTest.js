"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_builder_lib_1 = require("app-builder-lib");
const packTester_1 = require("../helpers/packTester");
// very slow
if (process.env.SNAP_HEAVY_TEST !== "true") {
    fit("Skip snapHeavyTest suite — SNAP_HEAVY_TEST is not set to true", () => {
        console.warn("[SKIP] Skip snapTest suite — SNAP_HEAVY_TEST is not set to true");
    });
}
test.ifAll("snap full", packTester_1.app({
    targets: packTester_1.snapTarget,
    config: {
        extraMetadata: {
            name: "se-wo-template",
        },
        productName: "Snap Electron App (full build)",
        snap: {
            useTemplateApp: false,
        },
    },
}));
// very slow
test.ifAll("snap full (armhf)", packTester_1.app({
    targets: app_builder_lib_1.Platform.LINUX.createTarget("snap", app_builder_lib_1.Arch.armv7l),
    config: {
        extraMetadata: {
            name: "se-wo-template",
        },
        productName: "Snap Electron App (full build)",
        snap: {
            useTemplateApp: false,
        },
    },
}));
//# sourceMappingURL=snapHeavyTest.js.map
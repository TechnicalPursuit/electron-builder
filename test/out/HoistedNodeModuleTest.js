"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const packTester_1 = require("./helpers/packTester");
const electron_builder_1 = require("electron-builder");
test.ifAll("yarn workspace", () => packTester_1.assertPack("test-app-yarn-workspace", {
    targets: packTester_1.linuxDirTarget,
    projectDir: "packages/test-app"
}, {
    packed: context => packTester_1.verifyAsarFileTree(context.getResources(electron_builder_1.Platform.LINUX)),
}));
test.ifAll("conflict versions", () => packTester_1.assertPack("test-app-yarn-workspace-version-conflict", {
    targets: packTester_1.linuxDirTarget,
    projectDir: "packages/test-app"
}, {
    packed: context => packTester_1.verifyAsarFileTree(context.getResources(electron_builder_1.Platform.LINUX)),
}));
test.ifAll("yarn several workspaces", () => packTester_1.assertPack("test-app-yarn-several-workspace", {
    targets: packTester_1.linuxDirTarget,
    projectDir: "packages/test-app"
}, {
    packed: context => packTester_1.verifyAsarFileTree(context.getResources(electron_builder_1.Platform.LINUX)),
}));
//# sourceMappingURL=HoistedNodeModuleTest.js.map
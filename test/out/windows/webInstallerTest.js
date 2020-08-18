"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_builder_1 = require("electron-builder");
const packTester_1 = require("../helpers/packTester");
// tests are heavy, to distribute tests across CircleCI machines evenly, these tests were moved from oneClickInstallerTest
test.ifNotCiMac("web installer", packTester_1.app({
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["nsis-web"], electron_builder_1.Arch.x64),
    config: {
        publish: {
            provider: "s3",
            bucket: "develar",
            path: "test",
        },
    }
}));
test.ifAll.ifNotCiMac("web installer (default github)", packTester_1.app({
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["nsis-web"], electron_builder_1.Arch.ia32, electron_builder_1.Arch.x64, electron_builder_1.Arch.arm64),
    config: {
        publish: {
            provider: "github",
            // test form without owner
            repo: "foo/bar",
        },
    },
}));
test.ifAll.ifNotCiMac("web installer, safe name on github", packTester_1.app({
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["nsis-web"], electron_builder_1.Arch.x64),
    config: {
        productName: "WorkFlowy",
        publish: {
            provider: "github",
            repo: "foo/bar",
        },
        nsisWeb: {
            //tslint:disable-next-line:no-invalid-template-strings
            artifactName: "${productName}.${ext}",
        },
    },
}));
//# sourceMappingURL=webInstallerTest.js.map
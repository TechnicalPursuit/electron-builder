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
const path = __importStar(require("path"));
const packTester_1 = require("../helpers/packTester");
// build in parallel - https://github.com/electron-userland/electron-builder/issues/1340#issuecomment-286061789
test.ifAll.ifNotCiMac("portable", packTester_1.app({
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["portable", "nsis"]),
    config: {
        publish: null,
        nsis: {
            differentialPackage: false,
        },
    }
}));
test.ifAll.ifDevOrWinCi("portable zip", packTester_1.app({
    targets: electron_builder_1.Platform.WINDOWS.createTarget("portable"),
    config: {
        publish: null,
        portable: {
            useZip: true,
            unpackDirName: "0ujssxh0cECutqzMgbtXSGnjorm",
        },
        compression: "normal",
    }
}));
test.ifAll.ifNotCi("portable zip several archs", packTester_1.app({
    targets: electron_builder_1.Platform.WINDOWS.createTarget("portable", electron_builder_1.Arch.ia32, electron_builder_1.Arch.x64),
    config: {
        publish: null,
        portable: {
            useZip: true,
        },
        compression: "store",
    }
}));
test.ifNotCiMac("portable - artifactName and request execution level", packTester_1.app({
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["portable"]),
    config: {
        nsis: {
            //tslint:disable-next-line:no-invalid-template-strings
            artifactName: "${productName}Installer.${version}.${ext}",
            installerIcon: "foo test space.ico",
        },
        portable: {
            requestExecutionLevel: "admin",
            //tslint:disable-next-line:no-invalid-template-strings
            artifactName: "${productName}Portable.${version}.${ext}",
        },
    },
}, {
    projectDirCreated: projectDir => {
        return packTester_1.copyTestAsset("headerIcon.ico", path.join(projectDir, "build", "foo test space.ico"));
    },
}));
test.ifDevOrWinCi("portable - splashImage", packTester_1.app({
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["portable"]),
    config: {
        publish: null,
        portable: {
            //tslint:disable-next-line:no-invalid-template-strings
            artifactName: "${productName}Portable.${version}.${ext}",
            splashImage: path.resolve(packTester_1.getFixtureDir(), "installerHeader.bmp"),
        },
    },
}));
//# sourceMappingURL=portableTest.js.map
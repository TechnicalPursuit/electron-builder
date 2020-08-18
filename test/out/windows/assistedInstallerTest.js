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
const fs_1 = require("fs");
const path = __importStar(require("path"));
const packTester_1 = require("../helpers/packTester");
const winHelper_1 = require("../helpers/winHelper");
const nsisTarget = electron_builder_1.Platform.WINDOWS.createTarget(["nsis"]);
test.ifNotCiMac("assisted", packTester_1.app({
    targets: nsisTarget,
    config: {
        nsis: {
            oneClick: false,
            language: "1031",
        },
        win: {
            legalTrademarks: "My Trademark"
        },
    }
}, {
    signedWin: true,
    projectDirCreated: projectDir => packTester_1.copyTestAsset("license.txt", path.join(projectDir, "build", "license.txt")),
}));
test.ifAll.ifNotCiMac("allowElevation false, app requestedExecutionLevel admin", packTester_1.app({
    targets: nsisTarget,
    config: {
        publish: null,
        extraMetadata: {
            // mt.exe doesn't like unicode names from wine
            name: "test",
            productName: "test"
        },
        win: {
            requestedExecutionLevel: "requireAdministrator",
        },
        nsis: {
            oneClick: false,
            allowElevation: false,
            perMachine: true,
            displayLanguageSelector: true,
            installerLanguages: ["en_US", "ru_RU"],
            differentialPackage: false,
        },
    }
}));
test.ifNotCiMac("assisted, MUI_HEADER", () => {
    let installerHeaderPath = null;
    return packTester_1.assertPack("test-app-one", {
        targets: nsisTarget,
        config: {
            publish: null,
            nsis: {
                oneClick: false,
                differentialPackage: false,
            }
        },
        effectiveOptionComputed: async (it) => {
            const defines = it[0];
            expect(defines.MUI_HEADERIMAGE).toBeNull();
            expect(defines.MUI_HEADERIMAGE_BITMAP).toEqual(installerHeaderPath);
            expect(defines.MUI_HEADERIMAGE_RIGHT).toBeNull();
            // speedup, do not build - another MUI_HEADER test will test build
            return true;
        }
    }, {
        projectDirCreated: projectDir => {
            installerHeaderPath = path.join(projectDir, "build", "installerHeader.bmp");
            return packTester_1.copyTestAsset("installerHeader.bmp", installerHeaderPath);
        }
    });
});
test.ifAll.ifNotCiMac("assisted, MUI_HEADER as option", () => {
    let installerHeaderPath = null;
    return packTester_1.assertPack("test-app-one", {
        targets: electron_builder_1.Platform.WINDOWS.createTarget(["nsis"], electron_builder_1.Arch.ia32, electron_builder_1.Arch.x64),
        config: {
            publish: null,
            nsis: {
                oneClick: false,
                installerHeader: "foo.bmp",
                differentialPackage: false,
            }
        },
        effectiveOptionComputed: async (it) => {
            const defines = it[0];
            expect(defines.MUI_HEADERIMAGE).toBeNull();
            expect(defines.MUI_HEADERIMAGE_BITMAP).toEqual(installerHeaderPath);
            expect(defines.MUI_HEADERIMAGE_RIGHT).toBeNull();
            // test that we can build such installer
            return false;
        }
    }, {
        projectDirCreated: projectDir => {
            installerHeaderPath = path.join(projectDir, "foo.bmp");
            return packTester_1.copyTestAsset("installerHeader.bmp", installerHeaderPath);
        },
    });
});
test.ifNotCiMac("assisted, only perMachine", packTester_1.app({
    targets: nsisTarget,
    config: {
        nsis: {
            oneClick: false,
            perMachine: true,
        }
    }
}));
// test release notes also
test.ifAll.ifNotCiMac("allowToChangeInstallationDirectory", packTester_1.app({
    targets: nsisTarget,
    config: {
        extraMetadata: {
            name: "test-custom-inst-dir",
            productName: "Test Custom Installation Dir",
            repository: "foo/bar",
        },
        nsis: {
            allowToChangeInstallationDirectory: true,
            oneClick: false,
            multiLanguageInstaller: false,
        }
    },
}, {
    projectDirCreated: async (projectDir) => {
        await fs_1.promises.writeFile(path.join(projectDir, "build", "release-notes.md"), "New release with new bugs and\n\nwithout features");
        await packTester_1.copyTestAsset("license.txt", path.join(projectDir, "build", "license.txt"));
    },
    packed: async (context) => {
        await winHelper_1.expectUpdateMetadata(context, electron_builder_1.archFromString(process.arch));
        await winHelper_1.checkHelpers(context.getResources(electron_builder_1.Platform.WINDOWS), true);
        await winHelper_1.doTest(context.outDir, false);
    }
}));
//# sourceMappingURL=assistedInstallerTest.js.map
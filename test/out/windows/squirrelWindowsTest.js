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
const CheckingPackager_1 = require("../helpers/CheckingPackager");
const packTester_1 = require("../helpers/packTester");
test.ifAll.ifNotCiMac("Squirrel.Windows", packTester_1.app({
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["squirrel"]),
    config: {
        win: {
            compression: "normal",
        }
    }
}, { signedWin: true }));
test.ifAll.ifNotCiMac("artifactName", packTester_1.app({
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["squirrel", "zip"]),
    config: {
        win: {
            // tslint:disable:no-invalid-template-strings
            artifactName: "Test ${name} foo.${ext}",
        }
    }
}));
// very slow
test.skip("delta and msi", packTester_1.app({
    targets: electron_builder_1.Platform.WINDOWS.createTarget("squirrel", electron_builder_1.Arch.ia32),
    config: {
        squirrelWindows: {
            remoteReleases: "https://github.com/develar/__test-app-releases",
            msi: true,
        }
    },
}));
test.ifAll("detect install-spinner", () => {
    let platformPackager = null;
    let loadingGifPath = null;
    return packTester_1.assertPack("test-app-one", {
        targets: electron_builder_1.Platform.WINDOWS.createTarget("squirrel"),
        platformPackagerFactory: (packager, platform) => platformPackager = new CheckingPackager_1.CheckingWinPackager(packager),
    }, {
        projectDirCreated: it => {
            loadingGifPath = path.join(it, "build", "install-spinner.gif");
            return packTester_1.copyTestAsset("install-spinner.gif", loadingGifPath);
        },
        packed: async () => {
            expect(platformPackager.effectiveDistOptions.loadingGif).toEqual(loadingGifPath);
        },
    });
});
//# sourceMappingURL=squirrelWindowsTest.js.map
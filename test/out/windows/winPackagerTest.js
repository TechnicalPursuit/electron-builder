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
const CheckingPackager_1 = require("../helpers/CheckingPackager");
const packTester_1 = require("../helpers/packTester");
const fs_extra_1 = require("fs-extra");
test.ifWinCi("beta version", packTester_1.app({
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["squirrel", "nsis"]),
    config: {
        extraMetadata: {
            version: "3.0.0-beta.2",
        },
    }
}));
test.ifNotCiMac("win zip", packTester_1.app({
    targets: electron_builder_1.Platform.WINDOWS.createTarget(["zip"]),
}));
test.ifNotCiMac.ifAll("zip artifactName", packTester_1.app({
    linux: ["appimage"],
    win: ["zip"],
    config: {
        //tslint:disable-next-line:no-invalid-template-strings
        artifactName: "${productName}-${version}-${os}-${arch}.${ext}",
    },
}));
test.ifNotCiMac("icon < 256", packTester_1.appThrows(packTester_1.platform(electron_builder_1.Platform.WINDOWS), {
    projectDirCreated: projectDir => fs_1.promises.rename(path.join(projectDir, "build", "incorrect.ico"), path.join(projectDir, "build", "icon.ico"))
}));
test.ifNotCiMac("icon not an image", packTester_1.appThrows(packTester_1.platform(electron_builder_1.Platform.WINDOWS), {
    projectDirCreated: async (projectDir) => {
        const file = path.join(projectDir, "build", "icon.ico");
        // because we use hardlinks
        await fs_1.promises.unlink(file);
        await fs_1.promises.writeFile(file, "foo");
    }
}));
test.ifMac("custom icon", () => {
    let platformPackager = null;
    return packTester_1.assertPack("test-app-one", {
        targets: electron_builder_1.Platform.WINDOWS.createTarget("squirrel"),
        platformPackagerFactory: packager => platformPackager = new CheckingPackager_1.CheckingWinPackager(packager),
        config: {
            win: {
                icon: "customIcon",
            },
        },
    }, {
        projectDirCreated: projectDir => fs_1.promises.rename(path.join(projectDir, "build", "icon.ico"), path.join(projectDir, "customIcon.ico")),
        packed: async (context) => {
            expect(await platformPackager.getIconPath()).toEqual(path.join(context.projectDir, "customIcon.ico"));
        },
    });
});
test.ifAll("win icon from icns", () => {
    let platformPackager = null;
    return packTester_1.app({
        targets: electron_builder_1.Platform.WINDOWS.createTarget(electron_builder_1.DIR_TARGET),
        config: {
            mac: {
                icon: "icons/icon.icns",
            },
        },
        platformPackagerFactory: packager => platformPackager = new CheckingPackager_1.CheckingWinPackager(packager)
    }, {
        projectDirCreated: projectDir => Promise.all([
            fs_1.promises.unlink(path.join(projectDir, "build", "icon.ico")),
            fs_extra_1.remove(path.join(projectDir, "build", "icons")),
        ]),
        packed: async () => {
            const file = await platformPackager.getIconPath();
            expect(file).toBeDefined();
        },
    })();
});
//# sourceMappingURL=winPackagerTest.js.map
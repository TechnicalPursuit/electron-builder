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
async function assertIcon(platformPackager) {
    const file = await platformPackager.getIconPath();
    expect(file).toBeDefined();
    const result = await platformPackager.resolveIcon([file], [], "set");
    result.forEach(it => {
        it.file = path.basename(it.file);
    });
    expect(result).toMatchSnapshot();
}
test.ifMac.ifAll("icon set", () => {
    let platformPackager = null;
    return packTester_1.app({
        targets: electron_builder_1.Platform.MAC.createTarget(electron_builder_1.DIR_TARGET),
        platformPackagerFactory: packager => platformPackager = new CheckingPackager_1.CheckingMacPackager(packager)
    }, {
        projectDirCreated: projectDir => Promise.all([
            fs_1.promises.unlink(path.join(projectDir, "build", "icon.icns")),
            fs_1.promises.unlink(path.join(projectDir, "build", "icon.ico")),
        ]),
        packed: () => assertIcon(platformPackager),
    })();
});
test.ifMac.ifAll("custom icon set", () => {
    let platformPackager = null;
    return packTester_1.app({
        targets: electron_builder_1.Platform.MAC.createTarget(electron_builder_1.DIR_TARGET),
        config: {
            mac: {
                icon: "customIconSet",
            },
        },
        platformPackagerFactory: packager => platformPackager = new CheckingPackager_1.CheckingMacPackager(packager)
    }, {
        projectDirCreated: projectDir => Promise.all([
            fs_1.promises.unlink(path.join(projectDir, "build", "icon.icns")),
            fs_1.promises.unlink(path.join(projectDir, "build", "icon.ico")),
            fs_1.promises.rename(path.join(projectDir, "build", "icons"), path.join(projectDir, "customIconSet")),
        ]),
        packed: () => assertIcon(platformPackager),
    })();
});
test.ifMac.ifAll("custom icon set with only 512 and 128", () => {
    let platformPackager = null;
    return packTester_1.app({
        targets: electron_builder_1.Platform.MAC.createTarget(electron_builder_1.DIR_TARGET),
        config: {
            mac: {
                icon: "..",
            },
        },
        platformPackagerFactory: packager => platformPackager = new CheckingPackager_1.CheckingMacPackager(packager)
    }, {
        projectDirCreated: projectDir => Promise.all([
            fs_1.promises.unlink(path.join(projectDir, "build", "icon.icns")),
            fs_1.promises.unlink(path.join(projectDir, "build", "icon.ico")),
            fs_1.promises.copyFile(path.join(projectDir, "build", "icons", "512x512.png"), path.join(projectDir, "512x512.png")),
            fs_1.promises.copyFile(path.join(projectDir, "build", "icons", "128x128.png"), path.join(projectDir, "128x128.png")),
        ]),
        packed: () => assertIcon(platformPackager),
    })();
});
test.ifMac.ifAll("png icon", () => {
    let platformPackager = null;
    return packTester_1.app({
        targets: electron_builder_1.Platform.MAC.createTarget(electron_builder_1.DIR_TARGET),
        config: {
            mac: {
                icon: "icons/512x512.png",
            },
        },
        platformPackagerFactory: packager => platformPackager = new CheckingPackager_1.CheckingMacPackager(packager)
    }, {
        projectDirCreated: projectDir => Promise.all([
            fs_1.promises.unlink(path.join(projectDir, "build", "icon.icns")),
            fs_1.promises.unlink(path.join(projectDir, "build", "icon.ico")),
        ]),
        packed: () => assertIcon(platformPackager),
    })();
});
test.ifMac.ifAll("default png icon", () => {
    let platformPackager = null;
    return packTester_1.app({
        targets: electron_builder_1.Platform.MAC.createTarget(electron_builder_1.DIR_TARGET),
        platformPackagerFactory: packager => platformPackager = new CheckingPackager_1.CheckingMacPackager(packager)
    }, {
        projectDirCreated: projectDir => Promise.all([
            fs_1.promises.unlink(path.join(projectDir, "build", "icon.icns")),
            fs_1.promises.unlink(path.join(projectDir, "build", "icon.ico")),
            fs_1.promises.copyFile(path.join(projectDir, "build", "icons", "512x512.png"), path.join(projectDir, "build", "icon.png"))
                .then(() => fs_extra_1.remove(path.join(projectDir, "build", "icons")))
        ]),
        packed: () => assertIcon(platformPackager),
    })();
});
test.ifMac.ifAll("png icon small", () => {
    let platformPackager = null;
    return packTester_1.app({
        targets: electron_builder_1.Platform.MAC.createTarget(electron_builder_1.DIR_TARGET),
        config: {
            mac: {
                icon: "icons/128x128.png",
            },
        },
        platformPackagerFactory: packager => platformPackager = new CheckingPackager_1.CheckingMacPackager(packager)
    }, {
        projectDirCreated: projectDir => Promise.all([
            fs_1.promises.unlink(path.join(projectDir, "build", "icon.icns")),
            fs_1.promises.unlink(path.join(projectDir, "build", "icon.ico")),
        ]),
        packed: async () => {
            try {
                await platformPackager.getIconPath();
            }
            catch (e) {
                if (!e.message.includes("must be at least 512x512")) {
                    throw e;
                }
                return;
            }
            throw new Error("error expected");
        },
    })();
});
//# sourceMappingURL=macIconTest.js.map
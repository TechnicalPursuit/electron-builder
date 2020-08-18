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
const fs_1 = require("fs");
if (process.platform !== "darwin") {
    fit("Skip mas tests because platform is not macOS", () => {
        console.warn("[SKIP] Skip mas tests because platform is not macOS");
    });
}
else if (process.env.CSC_KEY_PASSWORD == null) {
    fit("Skip mas tests because CSC_KEY_PASSWORD is not defined", () => {
        console.warn("[SKIP] Skip mas tests because CSC_KEY_PASSWORD is not defined");
    });
}
test.ifNotCi("mas", packTester_1.createMacTargetTest(["mas"]));
test.ifNotCi.ifAll("dev", packTester_1.createMacTargetTest(["mas-dev"]));
test.ifNotCi.ifAll("mas and 7z", packTester_1.createMacTargetTest(["mas", "7z"]));
test.skip.ifAll("custom mas", () => {
    let platformPackager = null;
    return packTester_1.assertPack("test-app-one", packTester_1.signed({
        targets: electron_builder_1.Platform.MAC.createTarget(),
        platformPackagerFactory: (packager, platform) => platformPackager = new CheckingPackager_1.CheckingMacPackager(packager),
        config: {
            mac: {
                target: ["mas"],
            },
            mas: {
                entitlements: "mas-entitlements file path",
                entitlementsInherit: "mas-entitlementsInherit file path",
            }
        }
    }), {
        packed: () => {
            expect(platformPackager.effectiveSignOptions).toMatchObject({
                entitlements: "mas-entitlements file path",
                "entitlements-inherit": "mas-entitlementsInherit file path",
            });
            return Promise.resolve(null);
        }
    });
});
test.ifAll.ifNotCi("entitlements in the package.json", () => {
    let platformPackager = null;
    return packTester_1.assertPack("test-app-one", packTester_1.signed({
        targets: electron_builder_1.Platform.MAC.createTarget(),
        platformPackagerFactory: (packager, platform) => platformPackager = new CheckingPackager_1.CheckingMacPackager(packager),
        config: {
            mac: {
                entitlements: "osx-entitlements file path",
                entitlementsInherit: "osx-entitlementsInherit file path",
            }
        }
    }), {
        packed: () => {
            expect(platformPackager.effectiveSignOptions).toMatchObject({
                entitlements: "osx-entitlements file path",
                "entitlements-inherit": "osx-entitlementsInherit file path",
            });
            return Promise.resolve();
        }
    });
});
test.ifAll.ifNotCi("entitlements in build dir", () => {
    let platformPackager = null;
    return packTester_1.assertPack("test-app-one", packTester_1.signed({
        targets: electron_builder_1.Platform.MAC.createTarget(),
        platformPackagerFactory: (packager, platform) => platformPackager = new CheckingPackager_1.CheckingMacPackager(packager),
    }), {
        projectDirCreated: projectDir => Promise.all([
            fs_1.promises.writeFile(path.join(projectDir, "build", "entitlements.mac.plist"), ""),
            fs_1.promises.writeFile(path.join(projectDir, "build", "entitlements.mac.inherit.plist"), ""),
        ]),
        packed: context => {
            expect(platformPackager.effectiveSignOptions).toMatchObject({
                entitlements: path.join(context.projectDir, "build", "entitlements.mac.plist"),
                "entitlements-inherit": path.join(context.projectDir, "build", "entitlements.mac.inherit.plist"),
            });
            return Promise.resolve();
        }
    });
});
//# sourceMappingURL=masTest.js.map
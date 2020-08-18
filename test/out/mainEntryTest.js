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
const packTester_1 = require("./helpers/packTester");
const packagerOptions = {
    targets: electron_builder_1.createTargets([electron_builder_1.Platform.LINUX, electron_builder_1.Platform.MAC], electron_builder_1.DIR_TARGET)
};
test.ifLinuxOrDevMac("invalid main in the app package.json", packTester_1.appTwoThrows(packagerOptions, {
    projectDirCreated: projectDir => packTester_1.modifyPackageJson(projectDir, data => {
        data.main = "main.js";
    }, true)
}));
test.ifLinuxOrDevMac("invalid main in the app package.json (no asar)", packTester_1.appTwoThrows(packagerOptions, {
    projectDirCreated: projectDir => {
        return Promise.all([
            packTester_1.modifyPackageJson(projectDir, data => {
                data.main = "main.js";
            }, true),
            packTester_1.modifyPackageJson(projectDir, data => {
                data.build.asar = false;
            })
        ]);
    }
}));
test.ifLinuxOrDevMac("invalid main in the app package.json (custom asar)", packTester_1.appTwoThrows(packagerOptions, {
    projectDirCreated: projectDir => {
        return Promise.all([
            packTester_1.modifyPackageJson(projectDir, data => {
                data.main = "path/app.asar/main.js";
            }, true),
            packTester_1.modifyPackageJson(projectDir, data => {
                data.build.asar = false;
            })
        ]);
    }
}));
test.ifLinuxOrDevMac("main in the app package.json (no asar)", () => packTester_1.assertPack("test-app", packagerOptions, {
    projectDirCreated: projectDir => {
        return Promise.all([
            fs_1.promises.rename(path.join(projectDir, "app", "index.js"), path.join(projectDir, "app", "main.js")),
            packTester_1.modifyPackageJson(projectDir, data => {
                data.main = "main.js";
            }, true),
            packTester_1.modifyPackageJson(projectDir, data => {
                data.build.asar = false;
            })
        ]);
    }
}));
test.ifLinuxOrDevMac("main in the app package.json (custom asar)", () => packTester_1.assertPack("test-app", packagerOptions, {
    projectDirCreated: projectDir => {
        return Promise.all([
            packTester_1.modifyPackageJson(projectDir, data => {
                data.main = "path/app.asar/index.js";
            }, true),
            packTester_1.modifyPackageJson(projectDir, data => {
                data.build.asar = false;
            })
        ]);
    }
}));
//# sourceMappingURL=mainEntryTest.js.map
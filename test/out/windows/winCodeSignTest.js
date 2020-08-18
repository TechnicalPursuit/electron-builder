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
const fs_extra_1 = require("fs-extra");
const path = __importStar(require("path"));
const CheckingPackager_1 = require("../helpers/CheckingPackager");
const packTester_1 = require("../helpers/packTester");
const builder_util_runtime_1 = require("builder-util-runtime");
const js_yaml_1 = require("js-yaml");
test("parseDn", () => {
    expect(builder_util_runtime_1.parseDn("CN=7digital Limited, O=7digital Limited, L=London, C=GB")).toMatchSnapshot();
    expect(js_yaml_1.safeLoad("publisherName:\n  - 7digital Limited")).toMatchObject({ publisherName: ["7digital Limited"] });
});
const windowsDirTarget = electron_builder_1.Platform.WINDOWS.createTarget(["dir"]);
test("sign nested asar unpacked executables", packTester_1.appThrows({
    targets: electron_builder_1.Platform.WINDOWS.createTarget(electron_builder_1.DIR_TARGET),
    config: {
        publish: "never",
        asarUnpack: ["assets"],
    }
}, {
    signedWin: true,
    projectDirCreated: async (projectDir) => {
        await fs_extra_1.outputFile(path.join(projectDir, "assets", "nested", "nested", "file.exe"), "invalid PE file");
    },
}, error => expect(error.message).toContain("Unrecognized file type")));
function testCustomSign(sign) {
    return packTester_1.app({
        targets: electron_builder_1.Platform.WINDOWS.createTarget(electron_builder_1.DIR_TARGET),
        platformPackagerFactory: (packager, platform) => new CheckingPackager_1.CheckingWinPackager(packager),
        config: {
            win: {
                certificatePassword: "pass",
                certificateFile: "secretFile",
                sign,
                signingHashAlgorithms: ["sha256"],
                // to be sure that sign code will be executed
                forceCodeSigning: true,
            }
        },
    });
}
test.ifAll.ifNotCiMac("certificateFile/password - sign as function", testCustomSign(require("../helpers/customWindowsSign").default));
test.ifAll.ifNotCiMac("certificateFile/password - sign as path", testCustomSign(path.join(__dirname, "../helpers/customWindowsSign")));
test.ifAll.ifNotCiMac("custom sign if no code sign info", () => {
    let called = false;
    return packTester_1.app({
        targets: electron_builder_1.Platform.WINDOWS.createTarget(electron_builder_1.DIR_TARGET),
        platformPackagerFactory: (packager, platform) => new CheckingPackager_1.CheckingWinPackager(packager),
        config: {
            win: {
                // to be sure that sign code will be executed
                forceCodeSigning: true,
                sign: async () => {
                    called = true;
                },
            },
        },
    }, {
        packed: async () => {
            expect(called).toBe(true);
        }
    })();
});
test.ifAll.ifNotCiMac("forceCodeSigning", packTester_1.appThrows({
    targets: windowsDirTarget,
    config: {
        forceCodeSigning: true,
    }
}));
test.ifAll.ifNotCiMac("electronDist", packTester_1.appThrows({
    targets: electron_builder_1.Platform.WINDOWS.createTarget(electron_builder_1.DIR_TARGET),
    config: {
        electronDist: "foo",
    }
}));
//# sourceMappingURL=winCodeSignTest.js.map
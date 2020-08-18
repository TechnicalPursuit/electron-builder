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
const fs_1 = require("builder-util/out/fs");
const electron_builder_1 = require("electron-builder");
const fs_2 = require("fs");
const path = __importStar(require("path"));
const fileAssert_1 = require("../helpers/fileAssert");
const packTester_1 = require("../helpers/packTester");
test.ifMac.ifAll("two-package", () => packTester_1.assertPack("test-app", {
    targets: electron_builder_1.createTargets([electron_builder_1.Platform.MAC], null, "all"),
    config: {
        extraMetadata: {
            repository: "foo/bar"
        },
        mac: {
            electronUpdaterCompatibility: ">=2.16",
            electronLanguages: ["bn", "en"]
        },
        //tslint:disable-next-line:no-invalid-template-strings
        artifactName: "${name}-${version}-${os}.${ext}",
    },
}, {
    signed: true,
    checkMacApp: async (appDir) => {
        expect((await fs_2.promises.readdir(path.join(appDir, "Contents", "Resources")))
            .filter(it => !it.startsWith("."))
            .sort()).toMatchSnapshot();
    },
}));
test.ifMac("one-package", packTester_1.app({
    targets: electron_builder_1.Platform.MAC.createTarget(),
    config: {
        appId: "bar",
        publish: {
            provider: "generic",
            //tslint:disable-next-line:no-invalid-template-strings
            url: "https://develar.s3.amazonaws.com/test/${os}/${arch}",
        },
        mac: {
            // test appId per platform
            appId: "foo",
            extendInfo: {
                LSUIElement: true,
            },
            minimumSystemVersion: "10.12.0",
            fileAssociations: [
                {
                    ext: "foo",
                    name: "Foo",
                    role: "Viewer",
                },
                {
                    ext: "boo",
                    name: "Boo",
                    role: "Shell",
                    rank: "Owner",
                    isPackage: true,
                },
                {
                    ext: "bar",
                    name: "Bar",
                    role: "Shell",
                    rank: "Default",
                    // If I specify `fileAssociations.icon` as `build/foo.icns` will it know to use `build/foo.ico` for Windows?
                    icon: "someFoo.ico"
                },
            ]
        }
    }
}, {
    signed: false,
    projectDirCreated: projectDir => Promise.all([
        fs_1.copyOrLinkFile(path.join(projectDir, "build", "icon.icns"), path.join(projectDir, "build", "foo.icns")),
        fs_1.copyOrLinkFile(path.join(projectDir, "build", "icon.icns"), path.join(projectDir, "build", "someFoo.icns")),
    ]),
    checkMacApp: async (appDir, info) => {
        await fileAssert_1.assertThat(path.join(appDir, "Contents", "Resources", "foo.icns")).isFile();
        await fileAssert_1.assertThat(path.join(appDir, "Contents", "Resources", "someFoo.icns")).isFile();
    },
}));
test.ifMac.ifAll("electronDist", packTester_1.appThrows({
    targets: electron_builder_1.Platform.MAC.createTarget(electron_builder_1.DIR_TARGET),
    config: {
        electronDist: "foo",
    }
}));
test.ifWinCi("Build macOS on Windows is not supported", packTester_1.appThrows(packTester_1.platform(electron_builder_1.Platform.MAC)));
//# sourceMappingURL=macPackagerTest.js.map